import { Link } from "react-router-dom";
import type { PlayerStageTip } from "../lib/queries";
import type { Stage } from "../lib/types";
import { stageWinnerLabel, stageWinnerMatch } from "../lib/stageResult";

// Per-stage breakdown shown when a leaderboard row is expanded: actual winner
// plus the player's tip, coloured green on a hit and red on a miss. Only stages
// that already have a result are passed in.
export function PlayerStageBreakdown({
  userId,
  resolvedStages,
  riderName,
  tips,
  loading,
  error,
}: {
  userId: string;
  resolvedStages: Stage[];
  riderName: Map<string, string>;
  tips: PlayerStageTip[] | undefined;
  loading: boolean;
  error?: string;
}) {
  if (error) return <p className="py-2 text-xs text-red-400">{error}</p>;
  if (loading || !tips)
    return <p className="py-2 text-xs text-slate-500">Laden…</p>;
  if (resolvedStages.length === 0)
    return (
      <p className="py-2 text-xs text-slate-500">Noch keine Ergebnisse.</p>
    );

  const tipByStage = new Map(tips.map((t) => [t.stage_id, t]));

  return (
    <div className="rounded-lg bg-slate-900/60 px-3 py-2">
      <div className="flex items-baseline gap-2 border-b border-slate-800 pb-1 text-[10px] uppercase tracking-wide text-slate-600">
        <span className="w-8 shrink-0">Et.</span>
        <span className="flex-1">Sieger</span>
        <span className="flex-1 text-right">Tipp</span>
      </div>
      {resolvedStages.map((s) => {
        const tip = tipByStage.get(s.id);
        const winner = stageWinnerLabel(s, riderName);
        const tipLabel = tip
          ? (tip.team ?? tip.rider?.name ?? "—")
          : "kein Tipp";
        const correct = tip ? stageWinnerMatch(s, tip) : false;
        const tipColor = correct
          ? "text-green-400"
          : tip
            ? "text-red-400"
            : "text-slate-600";
        return (
          <div
            key={s.id}
            className="flex items-baseline gap-2 py-1 text-xs"
          >
            <span className="w-8 shrink-0 text-slate-500">{s.number}</span>
            <span className="flex-1 truncate text-slate-300">{winner}</span>
            <span className={`flex-1 truncate text-right ${tipColor}`}>
              {tipLabel}
            </span>
          </div>
        );
      })}
      <Link
        to={`/spieler/${userId}`}
        className="mt-1 inline-block text-xs text-slate-500 hover:text-slate-300"
      >
        Alle Tipps →
      </Link>
    </div>
  );
}
