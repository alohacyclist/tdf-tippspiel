import { useState } from "react";
import { pcsStageUrl, stageProfileSrc } from "../lib/pcs";

export function StageProfile({
  raceSlug,
  stageNumber,
  year,
  oneDay = false,
}: {
  raceSlug: string;
  stageNumber: number;
  year: number;
  oneDay?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const pcs = pcsStageUrl(raceSlug, year, stageNumber, oneDay);

  if (failed) {
    return (
      <a
        href={pcs}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block rounded-lg border border-line bg-surface px-3 py-2 text-sm text-accent"
      >
        Höhenprofil & Details auf procyclingstats ansehen ↗
      </a>
    );
  }

  return (
    <a
      href={pcs}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 block"
    >
      <img
        src={stageProfileSrc(raceSlug, stageNumber)}
        alt={`Höhenprofil Etappe ${stageNumber}`}
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-full rounded-lg border border-line bg-white"
      />
    </a>
  );
}
