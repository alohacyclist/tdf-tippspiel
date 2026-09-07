import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../lib/appContext";
import {
  getDisplayName,
  listClassifications,
  listPlayerClassificationTips,
  listPlayerStageTips,
  listStages,
  type PlayerClsTip,
  type PlayerStageTip,
} from "../lib/queries";
import type { Classification, Stage } from "../lib/types";
import { isPast } from "../lib/time";
import { stageWinnerMatch } from "../lib/stageResult";
import { stageLabel } from "../lib/stageLabel";

export function PlayerTips() {
  const { userId: playerId } = useParams();
  const { tour } = useApp();
  const [name, setName] = useState<string | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [stageTips, setStageTips] = useState<PlayerStageTip[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [clsTips, setClsTips] = useState<PlayerClsTip[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) return;
    Promise.all([
      getDisplayName(playerId),
      listStages(tour.id),
      listPlayerStageTips(tour.id, playerId),
      listClassifications(tour.id),
      listPlayerClassificationTips(tour.id, playerId),
    ])
      .then(([n, s, st, c, ct]) => {
        setName(n);
        setStages(s);
        setStageTips(st);
        setClassifications(c);
        setClsTips(ct);
      })
      .catch((e) => setError(e.message));
  }, [playerId, tour.id]);

  const tipByStage = useMemo(
    () => new Map(stageTips.map((t) => [t.stage_id, t])),
    [stageTips],
  );
  const tipsByCls = useMemo(() => {
    const m = new Map<string, PlayerClsTip[]>();
    for (const t of clsTips) {
      const arr = m.get(t.classification_id) ?? [];
      m.set(t.classification_id, [...arr, t]);
    }
    return m;
  }, [clsTips]);

  if (error) return <p className="py-4 text-miss">{error}</p>;

  return (
    <div className="py-3">
      <Link to="/rangliste" className="text-sm text-muted">
        ← Rangliste
      </Link>
      <h1 className="mt-2 text-xl font-bold text-ink">{name ?? "—"}</h1>

      <h2 className="mb-2 mt-5 font-semibold text-ink">Etappen-Tipps</h2>
      <ul className="flex flex-col gap-1">
        {stages.map((s) => {
          const tip = tipByStage.get(s.id);
          const started = isPast(s.start_time);
          const label = tip
            ? (tip.team ?? tip.rider?.name ?? "—")
            : started
              ? "kein Tipp"
              : "verdeckt";
          const correct = tip ? stageWinnerMatch(s, tip) : false;
          return (
            <li
              key={s.id}
              className="flex justify-between rounded-lg border border-line bg-surface px-3 py-2"
            >
              <Link
                to={`/stage/${s.id}`}
                className="text-muted hover:text-ink"
              >
                {stageLabel(tour.kind, s)}
              </Link>
              <span
                className={
                  correct
                    ? "font-semibold text-hit"
                    : tip
                      ? "text-ink"
                      : "text-faint"
                }
              >
                {label}
              </span>
            </li>
          );
        })}
        {stages.length === 0 && (
          <p className="text-muted">Keine Etappen.</p>
        )}
      </ul>

      <h2 className="mb-2 mt-6 font-semibold text-ink">Wertungs-Tipps</h2>
      <ul className="flex flex-col gap-1">
        {classifications.map((c) => {
          const picks = (tipsByCls.get(c.id) ?? [])
            .slice()
            .sort((a, b) => a.slot - b.slot);
          const revealed = isPast(c.deadline);
          return (
            <li
              key={c.id}
              className="rounded-lg border border-line bg-surface px-3 py-2"
            >
              <div className="text-sm font-medium text-muted">{c.name}</div>
              {picks.length > 0 ? (
                <ol className="mt-1 flex flex-col gap-0.5 text-sm text-ink">
                  {picks.map((p) => (
                    <li key={p.rider_id}>
                      {c.ordered && (
                        <span className="mr-1 text-faint">{p.slot}.</span>
                      )}
                      {p.rider?.name ?? "—"}
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="mt-1 text-sm text-faint">
                  {revealed ? "kein Tipp" : "verdeckt"}
                </div>
              )}
            </li>
          );
        })}
        {classifications.length === 0 && (
          <p className="text-muted">Keine Wertungen.</p>
        )}
      </ul>
    </div>
  );
}
