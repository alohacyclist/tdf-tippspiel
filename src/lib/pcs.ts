const PCS_RACE_SLUG = "tour-de-france";

// PCS-Etappenseite (Ergebnis, Profil, Details). Aus Jahr + Etappennummer konstruierbar.
export function pcsStageUrl(year: number, stageNumber: number): string {
  return `https://www.procyclingstats.com/race/${PCS_RACE_SLUG}/${year}/stage-${stageNumber}`;
}

// Lokales Höhenprofil-Asset. Bilder liegen unter public/stage-profiles/stage-{n}.jpg.
export function stageProfileSrc(stageNumber: number): string {
  return `/stage-profiles/stage-${stageNumber}.jpg`;
}
