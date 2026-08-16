import { Fragment, useEffect, useMemo, useState } from "react";
import { useApp } from "../lib/appContext";
import {
  getLeaderboard,
  listPlayerStageTips,
  listRiders,
  listStages,
  type PlayerStageTip,
} from "../lib/queries";
import type { LeaderboardRow, Stage } from "../lib/types";
import { stageHasResult } from "../lib/stageResult";
import { tourTheme } from "../lib/theme";
import { Confetti } from "../components/Confetti";
import { PlayerStageBreakdown } from "../components/PlayerStageBreakdown";

const COLS = 6;

export function Leaderboard() {
  const { tour } = useApp();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [riderName, setRiderName] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const [openId, setOpenId] = useState<string | null>(null);
  const [tipsByUser, setTipsByUser] = useState<
    Record<string, PlayerStageTip[]>
  >({});
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  const [tipError, setTipError] = useState<Record<string, string>>({});

  useEffect(() => {
    getLeaderboard(tour.id)
      .then(setRows)
      .catch((e) => setError(e.message));
    Promise.all([listStages(tour.id), listRiders(tour.id)])
      .then(([s, r]) => {
        setStages(s);
        setRiderName(new Map(r.map((x) => [x.id, x.name])));
      })
      .catch((e) => setError(e.message));
  }, [tour.id]);

  // Fire confetti on the first Rangliste visit per tour per browser session.
  useEffect(() => {
    const key = `grandtour-confetti:${tour.id}`;
    try {
      if (sessionStorage.getItem(key)) {
        setCelebrate(false);
        return;
      }
      sessionStorage.setItem(key, "1");
      setCelebrate(true);
    } catch {
      setCelebrate(true);
    }
  }, [tour.id]);

  const resolvedStages = useMemo(() => stages.filter(stageHasResult), [stages]);

  function toggle(userId: string) {
    if (openId === userId) {
      setOpenId(null);
      return;
    }
    setOpenId(userId);
    if (tipsByUser[userId] || loadingUser === userId) return;
    setLoadingUser(userId);
    listPlayerStageTips(tour.id, userId)
      .then((t) => setTipsByUser((prev) => ({ ...prev, [userId]: t })))
      .catch((e) => setTipError((prev) => ({ ...prev, [userId]: e.message })))
      .finally(() => setLoadingUser((l) => (l === userId ? null : l)));
  }

  if (error) return <p className="py-4 text-red-400">{error}</p>;

  // Rank by stage points only (the official final result); ties share a rank.
  let lastPts = Number.NaN;
  let lastRank = 0;

  return (
    <div className="py-3">
      {celebrate && <Confetti colors={tourTheme(tour.pcs_slug).confetti} />}
      <h1 className="mb-1 text-xl font-bold text-slate-100">Rangliste</h1>
      <p className="mb-3 text-xs text-slate-500">
        Rang nach Etappen-Punkten. Zeile antippen für die Etappen-Tipps.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-500">
              <th className="py-1 pr-2 text-left font-normal">#</th>
              <th className="py-1 pr-2 text-left font-normal">Name</th>
              <th className="py-1 pl-2 text-right font-normal">Etap.</th>
              <th className="py-1 pl-2 text-right font-normal">✓</th>
              <th className="py-1 pl-2 text-right font-normal">Sond.</th>
              <th className="py-1 pl-2 text-right font-normal">Frag.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              if (r.stage_points !== lastPts) {
                lastRank = i + 1;
                lastPts = r.stage_points;
              }
              const open = openId === r.user_id;
              return (
                <Fragment key={r.user_id}>
                  <tr
                    onClick={() => toggle(r.user_id)}
                    className="cursor-pointer border-b border-slate-900 hover:bg-slate-900"
                  >
                    <td className="py-2 pr-2 text-slate-500">{lastRank}</td>
                    <td className="py-2 pr-2 text-slate-200">
                      <span className="mr-1 inline-block text-slate-600">
                        {open ? "▾" : "▸"}
                      </span>
                      {r.display_name ?? "—"}
                      {lastRank === 1 && r.stage_points > 0 && (
                        <span className="ml-1">🍺</span>
                      )}
                    </td>
                    <td className="py-2 pl-2 text-right font-semibold text-accent">
                      {r.stage_points}
                    </td>
                    <td className="py-2 pl-2 text-right text-slate-400">
                      {r.correct_winners}
                    </td>
                    <td className="py-2 pl-2 text-right text-slate-300">
                      {r.special_points}
                    </td>
                    <td className="py-2 pl-2 text-right text-slate-300">
                      {r.question_points}
                    </td>
                  </tr>
                  {open && (
                    <tr>
                      <td colSpan={COLS} className="pb-3">
                        <PlayerStageBreakdown
                          userId={r.user_id}
                          resolvedStages={resolvedStages}
                          riderName={riderName}
                          tips={tipsByUser[r.user_id]}
                          loading={loadingUser === r.user_id}
                          error={tipError[r.user_id]}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <p className="mt-2 text-slate-400">Noch keine Spieler.</p>
      )}

      <p className="mt-3 text-xs text-slate-600">
        Etap. = Etappen-Punkte (Rang) · ✓ = richtige Etappen · Sond. =
        Sonderwertungen · Frag. = Fragen
      </p>
    </div>
  );
}
