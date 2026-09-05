"""Automated results ingester.

For the active tour, for every stage whose start has already passed and that has no
winner yet, fetch the PCS result and set the winner via the service-role RPC
`ingest_stage_result`. Safe by design:

* never touches a stage whose deadline (start_time) is still in the future,
* writes only when the winner maps to a startlist rider (exact pcs_slug match);
  anything ambiguous is skipped and logged for manual entry (the admin To-Do),
* the RPC itself is idempotent — re-running never double-writes.

Run with --dry-run to print intended writes without touching the DB.

Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FLARESOLVERR_URL.
"""

import os
import sys
from datetime import datetime, timezone

from supabase import create_client

from pcs import stage_result_slugs

DRY_RUN = "--dry-run" in sys.argv


def parse_ts(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def main() -> None:
    sb = create_client(
        os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    )

    tours = sb.table("tours").select("*").eq("is_active", True).execute().data
    if not tours:
        print("no active tour — nothing to do")
        return
    tour = tours[0]
    print(f"active tour: {tour['name']} ({tour['pcs_slug']} {tour['year']})")

    riders = (
        sb.table("riders")
        .select("id, pcs_slug, name, team")
        .eq("tour_id", tour["id"])
        .execute()
        .data
    )
    by_slug = {r["pcs_slug"]: r for r in riders}

    stages = sb.table("stages").select("*").eq("tour_id", tour["id"]).execute().data
    now = datetime.now(timezone.utc)

    for s in sorted(stages, key=lambda x: x["number"]):
        if s["winner_rider_id"] or s["winner_team"] or s["status"] == "void":
            continue
        if not s["start_time"] or parse_ts(s["start_time"]) > now:
            continue  # deadline still open — never touch

        try:
            slugs = stage_result_slugs(tour["pcs_slug"], tour["year"], s["number"])
        except Exception as exc:  # network / FlareSolverr / parse error
            print(f"stage {s['number']}: fetch failed ({exc}) — skip")
            continue
        if not slugs:
            print(f"stage {s['number']}: no result yet")
            continue

        winner = by_slug.get(slugs[0])
        if not winner:
            print(
                f"stage {s['number']}: winner '{slugs[0]}' not in startlist "
                f"— skip (enter manually)"
            )
            continue

        if s["type"] == "ttt":
            if not winner["team"]:
                print(f"stage {s['number']}: ttt winner has no team — skip")
                continue
            payload = {"p_stage_id": s["id"], "p_winner_team": winner["team"]}
            label = winner["team"]
        else:
            payload = {"p_stage_id": s["id"], "p_winner_rider_id": winner["id"]}
            label = winner["name"]

        if DRY_RUN:
            print(f"stage {s['number']}: WOULD set winner -> {label}")
            continue

        result = sb.rpc("ingest_stage_result", payload).execute()
        print(f"stage {s['number']}: winner -> {label} [{result.data}]")


if __name__ == "__main__":
    main()
