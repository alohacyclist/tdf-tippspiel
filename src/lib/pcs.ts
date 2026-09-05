// PCS-Rennseite (Ergebnis, Profil, Details). Grand Tour → /stage-N; Eintagesrennen
// (Monument, WM-Einzelrennen) haben keine Etappennummer → /result.
export function pcsStageUrl(
  raceSlug: string,
  year: number,
  stageNumber: number,
  oneDay = false,
): string {
  const base = `https://www.procyclingstats.com/race/${raceSlug}/${year}`;
  return oneDay ? `${base}/result` : `${base}/stage-${stageNumber}`;
}

// Lokales Höhenprofil-Asset, pro Tour-Ordner (zwei Grand Tours teilen sich ein
// Jahr, daher nach Race-Slug getrennt): public/stage-profiles/<slug>/stage-{n}.jpg.
export function stageProfileSrc(raceSlug: string, stageNumber: number): string {
  return `/stage-profiles/${raceSlug}/stage-${stageNumber}.jpg`;
}
