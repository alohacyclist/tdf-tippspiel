// Per-tour accent theme, keyed by PCS race slug. Lives in code (not the DB):
// onboarding a new tour already means a seed migration + startlist + profile
// images, so one entry here is cheaper than a schema column. Falls back to the
// Tour-de-France yellow for any unknown slug.
export interface TourTheme {
  accent: string;
  accentContrast: string;
  confetti: string[];
}

const YELLOW: TourTheme = {
  accent: "#facc15", // maillot jaune (yellow-400)
  accentContrast: "#0f172a", // slate-900
  confetti: ["#facc15", "#fde047", "#eab308", "#fbbf24", "#fef08a"],
};

const RED: TourTheme = {
  accent: "#e11d48", // La Roja (rose-600)
  accentContrast: "#ffffff",
  confetti: ["#e11d48", "#f43f5e", "#be123c", "#fb7185", "#fecdd3"],
};

const BY_SLUG: Record<string, TourTheme> = {
  "tour-de-france": YELLOW,
  "vuelta-a-espana": RED,
};

export function tourTheme(pcsSlug: string | null | undefined): TourTheme {
  return (pcsSlug && BY_SLUG[pcsSlug]) || YELLOW;
}
