# ridtipp

A prediction game for road cycling races, for a closed group of players. For every stage
you pick the winner; there are optional side bets on the general classification and the
jerseys. Everyone else's picks stay hidden until the stage starts, and that rule is
enforced in the database, not in the frontend.

Grand Tours (21 stages) and one-day races (Monuments, World Championships) share the
same model. Each race has its own leaderboard, plus a season ranking across all races.
The repository is still called `tdf-tippspiel`.

## Screenshots

<!-- SCREENSHOT: stage view with countdown, stage profile and the pick -->
<!-- SCREENSHOT: leaderboard of a race and the season ranking -->
<!-- SCREENSHOT: admin panel (users, results, "to do" list from the result import) -->

## Stack

React · TypeScript · Vite · Tailwind CSS v4 (frontend, deployed on Vercel) ·
Supabase (Postgres, Auth with magic links, Row Level Security) ·
GitHub Actions (CI, migrations, result import)

## Getting started

```bash
pnpm install
cp .env.example .env        # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
pnpm dev
pnpm typecheck && pnpm test
supabase test db            # pgTAP tests for RLS, reveal, scoring and roles (needs Docker)
```

Setting up Supabase, adding a new race and the result import are described in the full
documentation (German): [docs/README.de.md](docs/README.de.md).

## What mattered to me

- **The rules live in the database.** Deadline and reveal are Row Level Security
  policies: a pick can only be changed before `start_time`, and other players' picks are
  not readable before the start, even with a manipulated bundle. Admin writes go through
  role-checked `SECURITY DEFINER` functions; the browser only ever holds the `anon` key.
- **Tests where the rules are.** pgTAP tests cover reveal before and after the start,
  picks before and after the deadline, blocked accounts, role gates and scoring.
  CI runs typecheck, tests and build on every pull request.
- **A careful result import.** It never touches a stage whose deadline is still open and
  only writes on an unambiguous match; everything else lands in the admin "to do" list.
- **A design inspired by the printed roadbook:** paper background, hairlines instead of
  cards, race-number typography, and the colour of each race's leader's jersey as the
  accent (yellow, pink, red, rainbow). Light and dark mode follow the system.

## License

Private project, no license granted.
