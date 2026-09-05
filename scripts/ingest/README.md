# Results ingester (T2 automation)

Sets stage winners automatically for the **active** tour by reading PCS results and
writing them through a service-role-only RPC.

```
GitHub Actions cron
  └─ FlareSolverr (headless Chrome) → fetch PCS stage page (bypass Cloudflare 403)
      └─ procyclingstats → parse finishers (PCS rider slugs)
          └─ match slug == riders.pcs_slug  → ingest_stage_result RPC (service_role)
                                               sets winner + status='finished'
```

## Safety model

- Never touches a stage whose `start_time` (tip deadline) is still in the future.
- Writes **only** when the winner's PCS slug exactly matches a startlist rider.
  Anything ambiguous → skipped + logged → falls back to the Admin **„Zu erledigen"**
  panel (manual entry). It never guesses a winner.
- `ingest_stage_result` is idempotent (`unchanged` / `set` / `changed`); re-runs are safe.
- The RPC is `revoke`d from anon/authenticated → only the service-role key can call it.

## Setup

1. Apply migration `0023_ingest_results.sql` (`supabase db push`).
2. GitHub repo → Settings → Secrets → Actions:
   - `SUPABASE_URL` = your project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = **service-role** key (never `VITE_`-prefixed, never client)
3. Adjust the cron window in `.github/workflows/ingest-results.yml` per race.
4. **First run: use “Run workflow” with dry-run = true** and check the log before going live.

## Local test

```bash
docker run -d --name flaresolverr -p 8191:8191 ghcr.io/flaresolverr/flaresolverr:latest
pip install -r scripts/ingest/requirements.txt
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… python scripts/ingest/run.py --dry-run
```

## Calibrate on first run

The one integration point to verify live is the `procyclingstats` parse
(`pcs.py`) + FlareSolverr's Cloudflare bypass. If PCS ever hard-blocks even
FlareSolverr, swap the source adapter (e.g. official race site) behind
`stage_result_slugs()` — the DB write path stays the same.

## Not yet automated

- DNF (`ingest_rider_dnf` RPC exists; wire a source when a reliable abandon feed is picked).
- Classification/jersey results.
