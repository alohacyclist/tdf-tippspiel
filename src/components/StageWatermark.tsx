import type { StageType } from "../lib/types";

// Roadbook-style silhouette behind a stage row. Deliberately schematic, not the real
// elevation data (we have none): it encodes the stage TYPE — flat, rolling, summit.
// The PCS profile images are labelled diagrams and turn to noise at watermark size;
// the real profile stays on the stage detail page.
const SHAPES: Record<StageType, string> = {
  flat: "M0,40 L0,35 L40,34 L80,36 L120,34 L160,35 L200,33 L240,35 L280,34 L300,35 L300,40 Z",
  hilly:
    "M0,40 L0,31 L30,27 L60,33 L90,23 L120,29 L150,20 L180,27 L210,18 L240,26 L270,17 L300,24 L300,40 Z",
  mountain:
    "M0,40 L0,35 L40,33 L75,27 L105,31 L145,17 L185,23 L225,7 L260,13 L300,2 L300,40 Z",
  itt: "M0,40 L0,34 L50,33 L100,35 L150,32 L200,34 L250,32 L300,33 L300,40 Z",
  ttt: "M0,40 L0,34 L50,33 L100,35 L150,32 L200,34 L250,32 L300,33 L300,40 Z",
};

export function StageWatermark({ type }: { type: StageType | null }) {
  if (!type) return null;
  return (
    <svg
      className="profile-wm"
      viewBox="0 0 300 40"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={SHAPES[type]} fill="currentColor" />
    </svg>
  );
}
