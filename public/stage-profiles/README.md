# Höhenprofile der Etappen

Höhenprofil-Bilder pro Etappe, **getrennt nach Tour** (zwei Grand Tours teilen
sich ein Jahr, daher Unterordner pro PCS-Race-Slug). Die App rendert sie in der
Etappen-Detailansicht; fehlt eine Datei, zeigt die App automatisch einen
Fallback-Link zu procyclingstats.

## Ordner & Dateinamen

Pro Tour ein Ordner nach `tours.pcs_slug`, darin `stage-<Nummer>.jpg`:

    stage-profiles/
      tour-de-france/   stage-1.jpg … stage-21.jpg
      vuelta-a-espana/  stage-1.jpg … stage-21.jpg

Der Pfad wird in `src/lib/pcs.ts` als `/stage-profiles/<slug>/stage-<n>.jpg`
gebaut.

## Quelle

Profile-Übersicht (manuell speichern, PCS blockt automatisiertes Laden via
Cloudflare):

    https://www.procyclingstats.com/race/<slug>/<jahr>/route/stage-profiles

Format egal, solange als `.jpg` gespeichert (Browser rendert auch PNG/WebP unter
`.jpg`-Endung). Für scharfe Darstellung Breite ~1000px genügt.
