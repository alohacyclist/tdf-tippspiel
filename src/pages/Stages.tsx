import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../lib/appContext";
import {
  listMyStageTips,
  listRiders,
  listStages,
  type MyStageTip,
} from "../lib/queries";
import type { Stage, Tour } from "../lib/types";
import { formatLocal, isPast, isToday } from "../lib/time";
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

interface RowData {
  tipLabel: string;
  tipColor: string;
  correct: boolean;
  resolved: boolean;
  started: boolean;
  hasTip: boolean;
  winner: string;
}

function describe(
  s: Stage,
  tip: MyStageTip | undefined,
  riderName: Map<string, string>,
): RowData {
  const resolved = stageHasResult(s);
  return {
    resolved,
    correct: tip ? stageWinnerMatch(s, tip) : false,
    started: isPast(s.start_time),
    hasTip: !!tip,
    winner: stageWinnerLabel(s, riderName),
    tipLabel: tip
      ? (tip.team ?? riderName.get(tip.rider_id ?? "") ?? "—")
      : "kein Tipp",
    tipColor: resolved
      ? tip && stageWinnerMatch(s, tip)
        ? "text-hit"
        : tip
          ? "text-miss"
          : "text-faint"
      : tip
        ? "text-muted"
        : "text-faint",
  };
}

// One row, shared by the featured block and the full list so the two can never
// drift apart.
function StageRow({
  stage: s,
  tour,
  data,
}: {
  stage: Stage;
  tour: Tour;
  data: RowData;
}) {
  return (
    <Link
      to={`/stage/${s.id}`}
      className="relative grid grid-cols-[auto_1fr_auto] items-center gap-3 overflow-hidden py-3 hover:bg-surface2"
    >
      <StageWatermark
        raceSlug={tour.pcs_slug}
        stageNumber={s.number}
        type={s.type}
      />
      {/* stage number as a race plate; one-day races have nothing to number */}
      {tour.kind !== "one_day" && (
        <div className="relative w-11 text-center">
          <div className="plate text-2xl leading-none text-ink">{s.number}</div>
          <div className="label mt-0.5 text-[0.5rem] text-faint">Etappe</div>
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
        {data.started ? (
          <span className="label text-faint">
            {data.resolved ? "beendet" : "läuft"}
          </span>
        ) : (
          <span className="data text-sm font-semibold text-accent">
            <Countdown iso={s.start_time} />
          </span>
        )}
        {data.resolved && (
          <div className="truncate text-xs text-muted">{data.winner}</div>
        )}
        <div className={`truncate text-xs ${data.tipColor}`}>
          {data.tipLabel}
          {data.resolved && data.hasTip && (data.correct ? " ✓" : " ✗")}
        </div>
      </div>
    </Link>
  );
}

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

  // Today's stage leads. On a rest day — or before the race starts — the next one
  // stands in, so the top of the page always answers "what is on".
  const today = stages.find((s) => isToday(s.start_time));
  const next = stages.find((s) => !isPast(s.start_time));
  const featured = today ?? next ?? null;

  return (
    <div>
      {featured && (
        <section className="mt-3 border-2 border-ink">
          <h2 className="label border-b border-line px-3 py-1.5 text-faint">
            {today ? "Heute" : "Als Nächstes"}
          </h2>
          <div className="px-3">
            <StageRow
              stage={featured}
              tour={tour}
              data={describe(featured, tips.get(featured.id), riderName)}
            />
          </div>
        </section>
      )}

      <ul className="mt-6 divide-y divide-line border-y border-line">
        {stages.map((s) => (
          <li key={s.id}>
            <StageRow
              stage={s}
              tour={tour}
              data={describe(s, tips.get(s.id), riderName)}
            />
          </li>
        ))}
        {stages.length === 0 && (
          <p className="py-3 text-muted">
            Noch keine {stagesNounPlural(tour.kind)}.
          </p>
        )}
      </ul>
    </div>
  );
}
