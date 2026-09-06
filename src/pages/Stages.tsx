import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../lib/appContext";
import {
  listMyStageTips,
  listRiders,
  listStages,
  type MyStageTip,
} from "../lib/queries";
import type { Stage } from "../lib/types";
import { formatLocal, isPast } from "../lib/time";
import {
  stageHasResult,
  stageWinnerLabel,
  stageWinnerMatch,
} from "../lib/stageResult";
import { stageLabel, stagesNounPlural } from "../lib/stageLabel";
import { Countdown } from "../components/Countdown";
import { SkeletonList } from "../components/Skeleton";
import { StageWatermark } from "../components/StageWatermark";

const TYPE_SHORT: Record<string, string> = {
  flat: "Flach",
  hilly: "Hügelig",
  mountain: "Berg",
  itt: "Einzelzeitfahren",
  ttt: "Mannschaftszeitfahren",
};

export function Stages() {
  const { tour, userId } = useApp();
  const [stages, setStages] = useState<Stage[]>([]);
  const [tips, setTips] = useState<Map<string, MyStageTip>>(new Map());
  const [riderName, setRiderName] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      listStages(tour.id),
      listMyStageTips(userId),
      listRiders(tour.id),
    ])
      .then(([s, ts, rs]) => {
        if (!active) return;
        setStages(s);
        setTips(new Map(ts.map((t) => [t.stage_id, t])));
        setRiderName(new Map(rs.map((r) => [r.id, r.name])));
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [tour.id, userId]);

  if (error) return <p className="text-miss">{error}</p>;
  if (loading)
    return (
      <div className="py-2">
        <SkeletonList rows={8} height="h-[68px]" />
      </div>
    );

  const oneDay = tour.kind === "one_day";

  return (
    <ul className="divide-y divide-line border-y border-line">
      {stages.map((s) => {
        const started = isPast(s.start_time);
        const tip = tips.get(s.id);
        const resolved = stageHasResult(s);
        const tipLabel = tip
          ? (tip.team ?? riderName.get(tip.rider_id ?? "") ?? "—")
          : "kein Tipp";
        const correct = tip ? stageWinnerMatch(s, tip) : false;
        const tipColor = resolved
          ? correct
            ? "text-hit"
            : tip
              ? "text-miss"
              : "text-faint"
          : tip
            ? "text-muted"
            : "text-faint";
        return (
          <li key={s.id}>
            <Link
              to={`/stage/${s.id}`}
              className="relative grid grid-cols-[auto_1fr_auto] items-center gap-3 overflow-hidden py-3 hover:bg-surface2"
            >
              <StageWatermark raceSlug={tour.pcs_slug} stageNumber={s.number} />
              {/* stage number as a race plate; one-day races have nothing to number */}
              {!oneDay && (
                <div className="relative w-11 text-center">
                  <div className="plate text-2xl leading-none text-ink">
                    {s.number}
                  </div>
                  <div className="label mt-0.5 text-[0.5rem] text-faint">
                    Etappe
                  </div>
                </div>
              )}
              <div className="relative min-w-0">
                <div className="truncate font-semibold text-ink">
                  {s.start_city && s.finish_city
                    ? `${s.start_city} → ${s.finish_city}`
                    : stageLabel(tour.kind, s)}
                </div>
                <div className="data mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
                  {s.distance_km != null && <span>{s.distance_km} km</span>}
                  {s.type && <span>{TYPE_SHORT[s.type]}</span>}
                  <span>{formatLocal(s.start_time)}</span>
                </div>
              </div>
              <div className="relative pr-1 text-right">
                {started ? (
                  <span className="label text-faint">
                    {resolved ? "beendet" : "läuft"}
                  </span>
                ) : (
                  <span className="data text-sm font-semibold text-accent">
                    <Countdown iso={s.start_time} />
                  </span>
                )}
                {resolved && (
                  <div className="truncate text-xs text-muted">
                    {stageWinnerLabel(s, riderName)}
                  </div>
                )}
                <div className={`truncate text-xs ${tipColor}`}>
                  {tipLabel}
                  {resolved && tip && (correct ? " ✓" : " ✗")}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
      {stages.length === 0 && (
        <p className="text-muted">Noch keine {stagesNounPlural(tour.kind)}.</p>
      )}
    </ul>
  );
}
