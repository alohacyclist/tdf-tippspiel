"""Fetch a PCS stage result through FlareSolverr (Cloudflare bypass) and parse it
with the procyclingstats library. Returns the finishers' PCS rider slugs in order.

PCS serves behind Cloudflare and 403s plain bots, so we route the GET through a
FlareSolverr instance (a headless browser that solves the challenge) and hand the
returned HTML to procyclingstats' parser via `html=`/`update_html=False`.
"""

import os

import requests
from procyclingstats import Stage

FLARESOLVERR_URL = os.environ.get("FLARESOLVERR_URL", "http://localhost:8191/v1")


def _fetch_html(url: str) -> str:
    resp = requests.post(
        FLARESOLVERR_URL,
        json={"cmd": "request.get", "url": url, "maxTimeout": 60000},
        timeout=90,
    )
    resp.raise_for_status()
    solution = resp.json()["solution"]
    if solution["status"] != 200:
        raise RuntimeError(f"{url} -> HTTP {solution['status']}")
    return solution["response"]


def stage_result_slugs(
    pcs_slug: str, year: int, number: int, one_day: bool = False
) -> list[str] | None:
    """Ordered PCS rider slugs for a finished race, or None if no result yet.

    Grand-tour stages live at /stage-N; a one-day race (monument, WC event) has no
    stage number and lives at /result. The winner is element [0]. Slugs (e.g.
    'tadej-pogacar') come straight from PCS rider URLs, so they map 1:1 to our
    seeded riders.pcs_slug — no fuzzy name match.
    """
    rel = f"race/{pcs_slug}/{year}/{'result' if one_day else f'stage-{number}'}"
    html = _fetch_html(f"https://www.procyclingstats.com/{rel}")
    try:
        rows = Stage(rel, html=html, update_html=False).results()
    except Exception:
        return None  # not parseable yet (e.g. stage not finished)
    if not rows:
        return None
    slugs = []
    for row in rows:
        rider_url = row.get("rider_url") or ""
        slug = rider_url.rstrip("/").rsplit("/", 1)[-1]
        if slug:
            slugs.append(slug)
    return slugs or None
