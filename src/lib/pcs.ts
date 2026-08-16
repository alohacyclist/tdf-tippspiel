// PCS-Etappenseite (Ergebnis, Profil, Details). Aus Race-Slug + Jahr + Nummer.
export function pcsStageUrl(
  raceSlug: string,
  year: number,
  stageNumber: number,
): string {
  return `https://www.procyclingstats.com/race/${raceSlug}/${year}/stage-${stageNumber}`;
}

// Lokales Höhenprofil-Asset, pro Tour-Ordner (zwei Grand Tours teilen sich ein
// Jahr, daher nach Race-Slug getrennt): public/stage-profiles/<slug>/stage-{n}.jpg.
export function stageProfileSrc(raceSlug: string, stageNumber: number): string {
  return `/stage-profiles/${raceSlug}/stage-${stageNumber}.jpg`;
}
