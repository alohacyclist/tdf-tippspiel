import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../lib/appContext";
import { getLeaderboard } from "../lib/queries";
import type { LeaderboardRow } from "../lib/types";

export function Leaderboard() {
  const { tour } = useApp();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLeaderboard(tour.id)
      .then(setRows)
      .catch((e) => setError(e.message));
  }, [tour.id]);

  if (error) return <p className="py-4 text-red-400">{error}</p>;

  let lastPts = Number.NaN;
  let lastRank = 0;

  return (
    <div className="py-3">
      <h1 className="mb-3 text-xl font-bold text-slate-100">Rangliste</h1>
      <ul className="flex flex-col gap-1">
        {rows.map((r, i) => {
          if (r.total_points !== lastPts) {
            lastRank = i + 1;
            lastPts = r.total_points;
          }
          return (
            <li key={r.user_id}>
              <Link
                to={`/spieler/${r.user_id}`}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 hover:border-slate-600"
              >
                <span className="text-slate-300">
                  <span className="mr-2 text-slate-500">{lastRank}.</span>
                  {r.display_name ?? "—"}
                  {lastRank === 1 && <span className="ml-1">🍺</span>}
                </span>
                <span className="font-semibold text-yellow-400">
                  {r.total_points} Pkt
                </span>
              </Link>
            </li>
          );
        })}
        {rows.length === 0 && (
          <p className="text-slate-400">Noch keine Spieler.</p>
        )}
      </ul>
    </div>
  );
}
