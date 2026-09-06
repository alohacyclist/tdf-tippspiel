import { useState } from "react";
import { stageProfileSrc } from "../lib/pcs";

// Faint elevation profile behind a stage row. Silently disappears when a race has
// no profile image for that stage — the row must read fine without it.
export function StageWatermark({
  raceSlug,
  stageNumber,
}: {
  raceSlug: string;
  stageNumber: number;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={stageProfileSrc(raceSlug, stageNumber)}
      alt=""
      aria-hidden="true"
      loading="lazy"
      onError={() => setFailed(true)}
      className="profile-wm"
    />
  );
}
