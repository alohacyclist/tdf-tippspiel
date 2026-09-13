"""Automated results ingester.

For every race that is currently on, for every stage whose start has already passed
and that has no winner yet, fetch the result and set the winner via the service-role
RPC `ingest_stage_result`. Safe by design:

* never touches a stage whose deadline (start_time) is still in the future,
* writes only when the winner maps to a startlist rider (exact pcs_slug match);
  anything ambiguous is skipped and logged for manual entry (the admin To-Do),
* the RPC itself is idempotent — re-running never double-writes.

Run with --dry-run to print intended writes without touching the DB.

Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FLARESOLVERR_URL.
"""

import os
import sys
import time
from datetime import datetime, timedelta, timezone

from supabase import create_client

from pcs import stage_result_slugs

DRY_RUN = "--dry-run" in sys.argv

# A race counts as "on" from the day before its first stage until two days after the
# last one, which leaves room for a result that is entered late.
LEAD = timedelta(days=1)
TRAIL = timedelta(days=2)


def parse_ts(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def retry(what: str, fn, attempts: int = 3, delay: int = 10):
    """Supabase occasionally answers a plain select with a 504. A scheduled job
    should ride that out rather than fail the run."""
    for i in range(1, attempts + 1):
        try:
            return fn()
        except Exception as exc:
            if i == attempts:
                raise
            print(f"{what}: attempt {i} failed ({exc}) — retrying in {delay}s")
            time.sleep(delay)


def live_tours(sb, now: datetime) -> list[dict]:
    """Races whose stage window contains today.

    Deliberately NOT tours.is_active: the schema allows a single active row, so that
    flag marks the app's default selection, not which race is running. Picking by it
    pointed the ingester at a Tour de France that finished in July.
    """
    tours = retry("tours", lambda: sb.table("tours").select("*, stages(start_time)").execute()).data
    live = []
    for t in tours:
        times = sorted(s["start_time"] for s in t.get("stages", []) if s["start_time"])
        if not times:
            continue
        if parse_ts(times[0]) - LEAD <= now <= parse_ts(times[-1]) + TRAIL:
            live.append(t)
    return live


def ingest_tour(sb, tour: dict, now: datetime) -> None:
    print(f"\n== {tour['name']} ({tour['pcs_slug']} {tour['year']})")

    riders = retry(
        "riders",
        lambda: sb.table("riders")
        .select("id, pcs_slug, name, team")
        .eq("tour_id", tour["id"])
        .execute(),
    ).data
    by_slug = {r["pcs_slug"]: r for r in riders}

    stages = retry(
        "stages",
        lambda: sb.table("stages").select("*").eq("tour_id", tour["id"]).execute(),
    ).data

    for s in sorted(stages, key=lambda x: x["number"]):
        if s["winner_rider_id"] or s["winner_team"] or s["status"] == "void":
            continue
        if not s["start_time"] or parse_ts(s["start_time"]) > now:
            continue  # deadline still open — never touch

        try:
            slugs = stage_result_slugs(
                tour["pcs_slug"],
                tour["year"],
                s["number"],
                one_day=tour.get("kind") == "one_day",
            )
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

        result = retry(
            f"stage {s['number']} write",
            lambda: sb.rpc("ingest_stage_result", payload).execute(),
        )
        print(f"stage {s['number']}: winner -> {label} [{result.data}]")


def main() -> None:
    sb = create_client(
        os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    )
    now = datetime.now(timezone.utc)

    tours = live_tours(sb, now)
    if not tours:
        print("no race running today — nothing to do")
        return
    for tour in tours:
        ingest_tour(sb, tour, now)


if __name__ == "__main__":
    main()
