import type { StageType } from "../lib/types";
import profiles from "../data/stageProfiles.json";

// Real elevation lines, traced out of the PCS profile images by
// scripts/extract_profiles.py (0 = lowest point of the stage, 100 = highest).
const REAL: Record<string, number[]> = profiles;

// Fallback for stages we have no profile image for: a schematic silhouette that at
// least encodes the stage type.
const SCHEMATIC: Record<StageType, number[]> = {
  flat: [8, 10, 9, 11, 9, 12, 10, 11, 9, 10],
  hilly: [20, 45, 25, 60, 30, 70, 35, 65, 40, 55],
  mountain: [10, 25, 20, 45, 35, 70, 55, 85, 70, 100],
  itt: [12, 14, 11, 15, 12, 16, 13, 15, 12, 14],
  ttt: [12, 14, 11, 15, 12, 16, 13, 15, 12, 14],
};

const H = 40;

// PCS scales every profile image to its own height, so a flat stage fills its frame
// just like an alpine one. The traced shape stays faithful; the amplitude is damped
// per stage type so a sprint stage actually reads flat next to a summit finish.
const AMPLITUDE: Record<StageType, number> = {
  flat: 0.35,
  itt: 0.35,
  ttt: 0.35,
  hilly: 0.65,
  mountain: 1,
};

// Closed area under the line, drawn across a 0..100 x-axis so the SVG stretches.
function toPath(points: number[], amplitude: number): string {
  const step = 100 / (points.length - 1);
  const line = points
    .map(
      (v, i) =>
        `${(i * step).toFixed(2)},${(H - (v / 100) * H * amplitude).toFixed(2)}`,
    )
    .join(" L");
  return `M0,${H} L${line} L100,${H} Z`;
}

export function StageWatermark({
  raceSlug,
  stageNumber,
  type,
}: {
  raceSlug: string;
  stageNumber: number;
  type: StageType | null;
}) {
  const real = REAL[`${raceSlug}/${stageNumber}`];
  const points = real ?? (type ? SCHEMATIC[type] : null);
  if (!points) return null;
  // the schematic fallback is already drawn at the right scale
  const amplitude = real && type ? AMPLITUDE[type] : 1;
  return (
    <svg
      className="profile-wm"
      viewBox={`0 0 100 ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={toPath(points, amplitude)} fill="currentColor" />
    </svg>
  );
}
