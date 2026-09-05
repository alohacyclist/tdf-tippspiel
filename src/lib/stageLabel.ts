import type { TourKind } from "./types";

// Grand-tour stages read "Etappe N"; a one-day event's single "stage" is the race
// itself, so show its name (e.g. "Paris–Roubaix", "Männer Straßenrennen").
export function stageLabel(
  kind: TourKind,
  stage: { number: number; name: string | null },
): string {
  if (kind === "one_day") return stage.name ?? "Rennen";
  return `Etappe ${stage.number}`;
}

// Label for the "stages" navigation/section per tour kind.
export function stagesNounPlural(kind: TourKind): string {
  return kind === "one_day" ? "Rennen" : "Etappen";
}
