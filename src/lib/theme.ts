// Per-race accent theme, keyed by PCS race slug. Lives in code (not the DB):
// onboarding a race already means a seed migration + startlist + profile images, so
// one entry here is cheaper than a schema column. Unknown slugs fall back to the
// Tour-de-France yellow.
export interface TourTheme {
  accent: string;
  accentContrast: string;
  confetti: string[];
  // Optional CSS gradient for races whose identity is not a single colour (the
  // rainbow jersey). Painted as the header underline + title fill; --accent stays
  // a plain colour because every utility (border/bg/text) needs one.
  titleGradient?: string;
}

const YELLOW: TourTheme = {
  accent: "#facc15", // maillot jaune
  accentContrast: "#0f172a",
  confetti: ["#facc15", "#fde047", "#eab308", "#fbbf24", "#fef08a"],
};

const RED: TourTheme = {
  accent: "#e11d48", // La Roja
  accentContrast: "#ffffff",
  confetti: ["#e11d48", "#f43f5e", "#be123c", "#fb7185", "#fecdd3"],
};

const PINK: TourTheme = {
  accent: "#ec4899", // maglia rosa
  accentContrast: "#0f172a",
  confetti: ["#ec4899", "#f472b6", "#db2777", "#f9a8d4", "#fbcfe8"],
};

// UCI rainbow bands: blue, red, black, yellow, green. Blue leads as the accent;
// the full set drives the confetti and the gradient.
const RAINBOW_BANDS = ["#0a5eb0", "#e30613", "#1a1a1a", "#f7d417", "#00a651"];
const RAINBOW: TourTheme = {
  accent: "#0a5eb0",
  accentContrast: "#ffffff",
  confetti: RAINBOW_BANDS,
  titleGradient: `linear-gradient(90deg, ${RAINBOW_BANDS.join(", ")})`,
};

// Monuments — no official colour each, so these are deliberate associations:
// Sanremo = "La Primavera" on the Ligurian coast (sea blue), Flanders = the Flemish
// lion's gold (deeper than the TdF yellow), Roubaix = cobbles and mud (stone),
// Liège = "La Doyenne" (regal violet), Lombardia = race of the falling leaves (autumn).
const SEA: TourTheme = {
  accent: "#38bdf8",
  accentContrast: "#0f172a",
  confetti: ["#38bdf8", "#7dd3fc", "#0ea5e9", "#bae6fd", "#0284c7"],
};

const FLEMISH_GOLD: TourTheme = {
  accent: "#d97706",
  accentContrast: "#0f172a",
  confetti: ["#d97706", "#f59e0b", "#b45309", "#fcd34d", "#1a1a1a"],
};

const COBBLE: TourTheme = {
  accent: "#a8a29e",
  accentContrast: "#0f172a",
  confetti: ["#a8a29e", "#d6d3d1", "#78716c", "#e7e5e4", "#57534e"],
};

const DOYENNE: TourTheme = {
  accent: "#8b5cf6",
  accentContrast: "#ffffff",
  confetti: ["#8b5cf6", "#a78bfa", "#7c3aed", "#c4b5fd", "#6d28d9"],
};

const AUTUMN: TourTheme = {
  accent: "#f97316",
  accentContrast: "#0f172a",
  confetti: ["#f97316", "#fb923c", "#ea580c", "#fdba74", "#c2410c"],
};

const BY_SLUG: Record<string, TourTheme> = {
  "tour-de-france": YELLOW,
  "vuelta-a-espana": RED,
  "giro-d-italia": PINK,
  "world-championship": RAINBOW,
  "milano-sanremo": SEA,
  "ronde-van-vlaanderen": FLEMISH_GOLD,
  "paris-roubaix": COBBLE,
  "liege-bastogne-liege": DOYENNE,
  "il-lombardia": AUTUMN,
};

export function tourTheme(pcsSlug: string | null | undefined): TourTheme {
  return (pcsSlug && BY_SLUG[pcsSlug]) || YELLOW;
}
