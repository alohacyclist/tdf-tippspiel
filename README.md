# ridtipp

Privates Tippspiel für Straßenrad-Rennen. Pro Etappe wird ein Etappensieger getippt,
dazu Sonderwertungen (Gesamtwertung, Trikots) und freie Fragen. Die Tipps der anderen
bleiben bis zum Start verdeckt — durchgesetzt in der Datenbank, nicht im Frontend.

Mehrere Rennen laufen parallel: Grand Tours (21 Etappen) und Eintagesrennen
(Monumente, WM) teilen sich dasselbe Modell, jedes mit eigener Rangliste, plus einer
Gesamtwertung über die Saison.

**Stack:** React · TypeScript · Vite · Tailwind v4 (Frontend, Vercel) ·
Supabase (Postgres + Auth + Row Level Security) · GitHub Actions (Ergebnis-Import)

---

## Spielprinzip

| | |
|---|---|
| **Etappensieger** | Ein Tipp pro Etappe, änderbar bis zum Start. Beim Mannschaftszeitfahren wird ein Team getippt. |
| **Sonderwertungen** | Vorab-Tipps auf Gesamtwertung (Top 3), Punkte-, Berg- und Nachwuchstrikot. |
| **Fragen** | Frei anlegbare Ja/Nein- oder Multiple-Choice-Fragen, optional an eine Etappe gekoppelt. |
| **Rangliste** | Der Rang zählt **nur Etappensieger-Punkte**. Sonderwertungen und Fragen stehen als eigene Spalten daneben. |
| **Saison** | Alle Rennen eines Jahres summiert. Ein Monument- oder WM-Sieg wiegt mehr als eine Grand-Tour-Etappe (pro Rennen konfigurierbar). |

## Warum die Spielregeln in der Datenbank stehen

Deadline und Reveal sind **RLS-Policies** (`supabase/migrations/0002_rls.sql`), keine
Frontend-Checks:

- Ein Tipp lässt sich nur einfügen/ändern, solange `stages.start_time` in der Zukunft liegt.
- Fremde Tipps sind erst ab Start lesbar — ein manipuliertes Bundle bekommt sie vorher nicht.
- Admin-Schreibzugriffe laufen über rollen-geprüfte `SECURITY DEFINER`-RPCs. Im Browser
  lebt ausschließlich der `anon`-Key.

## Rollen

`member` tippt · `editor` pflegt Inhalte (Wertungen, Fragen, Ergebnisse) ·
`admin` zusätzlich löschen, Rollen und Status vergeben, Tipps nachtragen.

---

## Setup

### 1 — Supabase

```bash
npm i -g supabase
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db push          # wendet alle Migrationen an (aktuell 0001–0029)
```

**Project Settings → API** liefert `Project URL` und `anon public` key.

> Der `service_role`-Key gehört **nie** ins Frontend und nie hinter ein `VITE_`-Prefix.

**Authentication → URL Configuration:** Site URL und Redirect-URLs auf die eigene
Domain setzen (inkl. `/**`), sonst schlägt der Magic-Link in Produktion fehl.

### 2 — Frontend

```bash
pnpm install
cp .env.example .env      # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
pnpm dev
pnpm build                # muss grün sein, sonst failt das Deployment
```

### 3 — Ersten Admin freischalten

Nach dem ersten Magic-Link-Login (legt das Profil an), im Supabase SQL-Editor:

```sql
update profiles set role = 'admin', status = 'active'
where id = (select id from auth.users where email = 'DEINE@EMAIL');
```

Alle weiteren Spieler werden danach im Admin-UI freigeschaltet (Tab **Nutzer**).

---

## Ein Rennen aufnehmen

Rennen werden als Migration geseedet — ein Eintagesrennen ist schlicht eine Tour mit
genau einer Etappe (`tours.kind = 'one_day'`).

1. **Tour + Route**: `tours` (Jahr, Name, `pcs_slug`, `kind`), `scoring_config`
   (Punkte pro Sieg), `stages`. Startzeiten als UTC mit Offset — `start_time` **ist**
   die Tipp-Deadline.
2. **Startliste**: `riders` mit `pcs_slug` als Schlüssel (matcht den Ergebnis-Import).
   Bei der WM steht in `riders.team` die Nation.
3. **Höhenprofile**: `public/stage-profiles/<pcs_slug>/stage-<n>.jpg`. Fehlt eine
   Datei, verlinkt die App auf procyclingstats.
4. **Farbe**: Eintrag in `src/lib/theme.ts` (Slug → Trikotfarbe). Ohne Eintrag Gelb.
5. **Umschalten**: zum Rennstart `is_active` auf die neue Tour setzen. Vergangene
   Rennen bleiben über den Tour-Umschalter erreichbar.

Vorlagen: `0019` (Grand Tour), `0027` (Eintagesrennen), `0021` (Startliste abgleichen).

## Ergebnis-Import (optional)

`scripts/ingest/` holt Etappensieger automatisch und schreibt sie über einen
service-role-RPC. Der Import fasst nie eine Etappe an, deren Deadline noch offen ist,
und schreibt nur bei eindeutigem Treffer — alles andere landet im Admin-Panel
„Zu erledigen". Details: [`scripts/ingest/README.md`](scripts/ingest/README.md).

---

## Gestaltung

Vorbild ist das gedruckte Roadbook: heller Papiergrund, Haarlinien statt Karten,
Startnummern-Typografie (Archivo Narrow), technische Daten in Monospace. Die Farbe
des jeweiligen Führungstrikots markiert gezielt Countdown, Punkte und Führenden —
Gelb für die Tour, Rot für die Vuelta, Rosa für den Giro, Regenbogen für die WM.
Hell und Dunkel folgen dem System des Geräts; alle Farben laufen über Tokens in
`src/index.css`.

## Tests

```bash
pnpm typecheck
supabase test db     # pgTAP: RLS, Reveal, Scoring, Rollen (braucht Docker)
```

Die Testabdeckung liegt bewusst in der Datenbank, weil dort die Spielregeln stehen:
Reveal vor/nach Start, Tipp vor/nach Deadline, gesperrte Accounts, Rollen-Gates und
die Punkte-Mathematik (`supabase/tests/`).

Vitest ist eingerichtet (`pnpm test`), aber es gibt noch **keine** Frontend-Tests —
der Befehl endet entsprechend mit „No test files found".

## Sicherheit

- Im Browser nur der `anon`-Key; der `service_role`-Key lebt ausschließlich in
  GitHub-Actions-Secrets.
- Jeder Admin-Schreibpfad prüft die Rolle serverseitig erneut.
- `.env` ist über `.gitignore` ausgeschlossen.

## Lizenz

Privates Projekt, keine Lizenz vergeben.
