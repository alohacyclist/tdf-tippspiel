# Tour-Tippspiel

Privates Etappensieger-Tippspiel zur Tour de France (mehrjahresfähig). Magic-Link-Login,
Tipp je Etappe aus der aktiven Startliste bis zum Etappenstart, fremde Tipps erst ab Start
sichtbar, Vorab-Sonderwertungen (GC Top 3, Grün, Berg, Jungprofi), Rangliste.

Stack: React + TS + Vite + Tailwind v4 (Frontend, Vercel) · Supabase (Postgres + Auth + **RLS
als Spiellogik**) · GitHub-Actions-Pipeline (PCS-Scrape, *deferred*).

Deadline & Reveal werden **serverseitig in RLS-Policies** erzwungen (`supabase/migrations/0002_rls.sql`),
nicht im Client.

---

## ⚠️ Day-0-Checkliste (HEUTE, parallel — der echte kritische Pfad bis 04.07.)

1. **Supabase-Projekt** anlegen, Region **EU (Frankfurt)**. `Project URL` + `anon key` notieren.
   - Auth → URL Configuration: `Site URL` + Redirect-URLs = deine Vercel-Prod-URL.
2. **Vercel-Projekt** mit diesem Repo verbinden, `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
   als Env setzen, **Hello-World deployen** und **einen echten Magic-Link-Login in Prod testen**
   (häufigster Launch-Killer).
3. **Resend** Domain + DNS **heute** anlegen (über Nacht propagieren). Für Launch reicht der
   Supabase-Default-Mailer; Resend wird erst für Phase-6-Notifications gebraucht.
4. **Roadbook-Startzeit Etappe 1** offiziell heraussuchen und in `supabase/migrations/0003_seed.sql`
   als **UTC mit explizitem Offset** eintragen (Barcelona = UTC+2 im Juli). PCS-Zeitlabel **nicht** vertrauen.

Reihenfolge danach: 01.07 Schema+RLS+Tests · 02.07 Seed + Freunde vorab freischalten · 03.07 UI-Feinschliff · 04.07 Puffer.

---

# Setup: Von Null auf Live (Supabase → Vercel)

Reihenfolge ist wichtig: **erst Supabase** (DB + Auth), **dann Vercel** (Hosting), **dann zurück zu
Supabase** für die finale Redirect-URL. Spiellogik (Deadline, Reveal, Scoring) steckt in den
RLS-Policies — nicht im Client.

## 1 — Supabase-Projekt anlegen
1. https://supabase.com/dashboard → **New project**.
   - **Name** `tdf-tippspiel` · **DB-Passwort** stark wählen + speichern (für `db push`) · **Region
     Central EU (Frankfurt)**.
2. ~2 Min warten, bis grün.
3. **Project Settings → API** notieren:
   - **Project URL** (`https://xxxxxxxx.supabase.co`) → wird `VITE_SUPABASE_URL`
   - **anon public** Key → wird `VITE_SUPABASE_ANON_KEY`
   - Das `xxxxxxxx` ist die **Project Ref** (gleich für `link`).

> ⚠️ `service_role`-Key **nie** ins Frontend / nie `VITE_`-prefixed. Im Browser lebt nur der `anon`-Key.

## 2 — Migrations anwenden (Schema → RLS → Seed)
```bash
npm i -g supabase                          # CLI (kein Docker nötig fürs reine Push)
supabase login                             # Browser-Token bestätigen
supabase link --project-ref <PROJECT_REF>  # fragt nach DB-Passwort
supabase db push                           # wendet 0001..0005 an (Schema, RLS, Seed, Route+Startliste)
```
Prüfen: **Table Editor** zeigt `tours`, `stages` (21 Etappen), `riders` (~145), `profiles`,
`scoring_config`, `classifications`. **Authentication → Policies**: RLS aktiv.

> ⚠️ **Vor echtem Launch — zwei Dinge aus `0005_seed_2026.sql`:**
> 1. **Startzeiten sind Platzhalter** (12:00 CEST). `deadline = reveal = start_time` → jede Etappe
>    gegen das offizielle ASO-Roadbook prüfen und `stages.start_time` als **UTC mit Offset** (`+02` im
>    Juli) per SQL updaten. Etappe 1 = **Mannschaftszeitfahren** (Barcelona).
> 2. **Startliste ist provisorisch** (nur bestätigte Fahrer, keine Startnummern). Nach der
>    Teampräsentation neu ziehen und Rosters/Bibs ergänzen.

## 3 — Supabase Auth (Magic-Link)
**Authentication → URL Configuration:**
- **Site URL**: vorerst `http://localhost:5173` (in Schritt 6 auf Vercel-URL ändern).
- **Redirect URLs**: `http://localhost:5173` und `http://localhost:5173/**`.

**Authentication → Providers → Email** aktiv lassen. Default-Mailer reicht für den Launch (Resend ist
deferred).

## 4 — Lokal testen + Admin freischalten
```bash
pnpm install
cp .env.example .env        # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY eintragen
pnpm dev                    # http://localhost:5173 — Magic-Link-Login durchspielen
pnpm build                  # tsc -b && vite build muss grün sein (sonst failt Vercel)
```
Nach deinem ersten Login (legt `auth.users`-Eintrag an) im Supabase **SQL Editor**:
```sql
-- dich selbst zum Admin + freischalten
update profiles set is_admin = true, status = 'active'
where id = (select id from auth.users where email = 'DEINE@EMAIL');
-- weitere Spieler freischalten (bis Admin-Panel existiert)
update profiles set status = 'active'
where id = (select id from auth.users where email = '…');
```

## 5 — Code zu GitHub pushen
Vercel deployt aus GitHub. Privates Repo anlegen, dann:
```bash
git add -A && git commit -m "chore: initial commit"
git branch -M main
git remote add origin git@github.com:<DEIN_USER>/tdf-tippspiel.git
git push -u origin main
```
`.env` ist via `.gitignore` ausgeschlossen — Secrets landen nicht im Repo.

## 6 — Vercel deployen
1. https://vercel.com/new → **Import** des Repos. Framework **Vite** wird erkannt (Build `pnpm build`,
   Output `dist`).
2. **Environment Variables** (vor erstem Deploy, alle Environments):
   - `VITE_SUPABASE_URL` = `https://xxxxxxxx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = anon-Key
3. **Deploy** → URL wie `https://tdf-tippspiel.vercel.app`.

> Env-Vars werden zur **Build-Zeit** in den Bundle gebacken — nach Änderung **neu deployen**.

## 7 — Supabase auf Vercel-URL umstellen (kritisch!)
Sonst failt der Magic-Link in Prod (häufigster Launch-Killer). **Authentication → URL Configuration:**
- **Site URL**: `https://tdf-tippspiel.vercel.app`
- **Redirect URLs** (localhost behalten, ergänzen):
  ```
  https://tdf-tippspiel.vercel.app
  https://tdf-tippspiel.vercel.app/**
  ```

## 8 — Abnahme in Prod
Inkognito → Vercel-URL → E-Mail → Link senden → Mail-Link klickt sich eingeloggt zurück. Erster Login
= `status = 'pending'` → per SQL (Schritt 4) auf `active`/`is_admin` setzen. Etappen/Tipp/Rangliste
sichtbar → **live**. 🎉

## Tests (DB, brauchen Docker)
```bash
supabase test db   # pgTAP: supabase/tests/rls_test.sql + scoring_test.sql
```
Decken die launch-kritischen Fälle ab: Reveal vor/nach Start, Tipp vor/nach Deadline,
pending-User gesperrt, keine RLS-Rekursion, Scoring-Mathe (10 / GC 15-5).

## Troubleshooting
| Symptom | Fix |
|---|---|
| `Missing VITE_SUPABASE_URL …` im Browser | Env-Vars in Vercel fehlen / kein Redeploy danach. |
| Magic-Link landet auf `localhost` statt Vercel | Site URL / Redirect URLs (Schritt 7) fehlen. |
| „redirect_to is not allowed" | Exakte Origin fehlt in Redirect URLs (inkl. `/**`). |
| Login ok, aber keine Daten / „pending" | Profil noch nicht `active` (SQL aus Schritt 4). |
| Vercel-Build failt | Lokal `pnpm build` reproduzieren (meist TS-Fehler). |
| Keine Magic-Mail | Default-Mailer-Rate-Limit → warten oder Resend. |

## Sicherheit
- Im Browser **nur** der `anon key`. Der `service-role key` lebt ausschließlich in
  GitHub-Actions-Secrets (Pipeline) — **nie** `VITE_`-prefixed, nie im Bundle.
- Repo privat halten.

---

## Deferred (nach 04.07. — bewusst nicht im Launch-Scope)
PWA/Offline · Reminder-Mail 3 h vor Start (Cron, idempotent via `stages.reminder_sent_at`) ·
PCS-Scraper (GitHub Actions + Python `procyclingstats`, Upsert-Startliste/DNF, FK-Guard auf
`stages.winner_rider_id`, Notify bei Sieger-**Änderung**) · Admin-Panel (Pending freischalten,
neue Sonderwertung, `scoring_config` editieren, Override/`void`) · Archiv alter Touren ·
Resend-Notifications · Cron-Heartbeat/`on:failure`-Alert.

Admin-Mutationen laufen zum Launch **nicht** über den Browser, sondern via Supabase-Dashboard/SQL.
Sobald ein Admin-UI gebaut wird: als **SECURITY-DEFINER-RPC** mit `is_admin(auth.uid())`-Gate,
niemals service-role im Client.
