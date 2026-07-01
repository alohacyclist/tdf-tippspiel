import { useState } from "react";
import { pcsStageUrl, stageProfileSrc } from "../lib/pcs";

export function StageProfile({
  stageNumber,
  year,
}: {
  stageNumber: number;
  year: number;
}) {
  const [failed, setFailed] = useState(false);
  const pcs = pcsStageUrl(year, stageNumber);

  if (failed) {
    return (
      <a
        href={pcs}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-yellow-400"
      >
        Höhenprofil & Details auf procyclingstats ansehen ↗
      </a>
    );
  }

  return (
    <a href={pcs} target="_blank" rel="noopener noreferrer" className="mt-4 block">
      <img
        src={stageProfileSrc(stageNumber)}
        alt={`Höhenprofil Etappe ${stageNumber}`}
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-full rounded-lg border border-slate-800 bg-white"
      />
    </a>
  );
}
