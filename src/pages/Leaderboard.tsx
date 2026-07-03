import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../lib/appContext";
import { getLeaderboard } from "../lib/queries";
import type { LeaderboardRow } from "../lib/types";

export function Leaderboard() {
  const { tour } = useApp();
  const navigate = useNavigate();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLeaderboard(tour.id)
      .then(setRows)
      .catch((e) => setError(e.message));
  }, [tour.id]);

  if (error) return <p className="py-4 text-red-400">{error}</p>;

  // Rank by stage points only (the official final result); ties share a rank.
  let lastPts = Number.NaN;
  let lastRank = 0;

  return (
    <div className="py-3">
      <h1 className="mb-1 text-xl font-bold text-slate-100">Rangliste</h1>
      <p className="mb-3 text-xs text-slate-500">
        Rang nach Etappen-Punkten. Sonderwertungen und Fragen zählen separat.
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
              return (
                <tr
                  key={r.user_id}
                  onClick={() => navigate(`/spieler/${r.user_id}`)}
                  className="cursor-pointer border-b border-slate-900 hover:bg-slate-900"
                >
                  <td className="py-2 pr-2 text-slate-500">{lastRank}</td>
                  <td className="py-2 pr-2 text-slate-200">
                    {r.display_name ?? "—"}
                    {lastRank === 1 && r.stage_points > 0 && (
                      <span className="ml-1">🍺</span>
                    )}
                  </td>
                  <td className="py-2 pl-2 text-right font-semibold text-yellow-400">
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
