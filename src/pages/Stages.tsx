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

  if (error) return <p className="text-red-400">{error}</p>;
  if (loading)
    return (
      <div className="py-2">
        <SkeletonList rows={8} height="h-[68px]" />
      </div>
    );

  return (
    <ul className="flex flex-col gap-2 py-2">
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
            ? "text-green-400"
            : tip
              ? "text-red-400"
              : "text-slate-500"
          : tip
            ? "text-slate-300"
            : "text-slate-500";
        return (
          <li key={s.id}>
            <Link
              to={`/stage/${s.id}`}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-3"
            >
              <div>
                <div className="font-semibold text-slate-100">
                  {stageLabel(tour.kind, s)}
                  {s.start_city && s.finish_city
                    ? ` · ${s.start_city} → ${s.finish_city}`
                    : ""}
                  {s.type === "ttt" && (
                    <span className="ml-2 rounded bg-accent/20 px-1.5 py-0.5 text-xs font-medium text-accent">
                      MZF
                    </span>
                  )}
                  {s.type === "itt" && (
                    <span className="ml-2 rounded bg-slate-700 px-1.5 py-0.5 text-xs font-medium text-slate-300">
                      EZF
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  {formatLocal(s.start_time)}
                </div>
              </div>
              <div className="text-right text-xs">
                {started ? (
                  <span className="text-slate-500">gestartet</span>
                ) : (
                  <span className="text-accent">
                    <Countdown iso={s.start_time} />
                  </span>
                )}
                {resolved && (
                  <div className="text-slate-400">
                    🏁 {stageWinnerLabel(s, riderName)}
                  </div>
                )}
                <div className={tipColor}>{tipLabel}</div>
              </div>
            </Link>
          </li>
        );
      })}
      {stages.length === 0 && (
        <p className="text-slate-400">
          Noch keine {stagesNounPlural(tour.kind)}.
        </p>
      )}
    </ul>
  );
}
