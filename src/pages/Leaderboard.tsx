import { Fragment, useEffect, useMemo, useState } from "react";
import { useApp } from "../lib/appContext";
import {
  getLeaderboard,
  getSeasonLeaderboard,
  listPlayerStageTips,
  listRiders,
  listStages,
  type PlayerStageTip,
} from "../lib/queries";
import type { LeaderboardRow, SeasonLeaderboardRow, Stage } from "../lib/types";
import { stageHasResult } from "../lib/stageResult";
import { tourTheme } from "../lib/theme";
import { Confetti } from "../components/Confetti";
import { PlayerStageBreakdown } from "../components/PlayerStageBreakdown";
import { SkeletonList } from "../components/Skeleton";

const COLS = 6;
// header label -> title tooltip, so the abbreviations are self-explanatory
const HEADERS: { label: string; title: string; align: "left" | "right" }[] = [
  { label: "#", title: "Rang", align: "left" },
  { label: "Name", title: "Spieler", align: "left" },
  {
    label: "Etap.",
    title: "Etappen-Punkte (bestimmen den Rang)",
    align: "right",
  },
  { label: "✓", title: "Richtig getippte Etappensieger", align: "right" },
  { label: "Sond.", title: "Punkte aus Sonderwertungen", align: "right" },
  { label: "Frag.", title: "Punkte aus Fragen", align: "right" },
];
type View = "tour" | "season";
// Both leaderboard shapes share the columns we render.
type Row = LeaderboardRow | SeasonLeaderboardRow;

export function Leaderboard() {
  const { tour } = useApp();
  const [view, setView] = useState<View>("tour");
  const [tourRows, setTourRows] = useState<LeaderboardRow[]>([]);
  const [seasonRows, setSeasonRows] = useState<SeasonLeaderboardRow[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [riderName, setRiderName] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const [openId, setOpenId] = useState<string | null>(null);
  const [tipsByUser, setTipsByUser] = useState<
    Record<string, PlayerStageTip[]>
  >({});
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  const [tipError, setTipError] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    Promise.all([getLeaderboard(tour.id), getSeasonLeaderboard(tour.year)])
      .then(([t, s]) => {
        setTourRows(t);
        setSeasonRows(s);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    Promise.all([listStages(tour.id), listRiders(tour.id)])
      .then(([s, r]) => {
        setStages(s);
        setRiderName(new Map(r.map((x) => [x.id, x.name])));
      })
      .catch((e) => setError(e.message));
  }, [tour.id, tour.year]);

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

  // Only the single-tour view drills into per-stage tips; the season view aggregates
  // across events, so its rows are not expandable.
  const rows: Row[] = view === "tour" ? tourRows : seasonRows;
  const expandable = view === "tour";

  // Rank by stage points only; ties share a rank.
  let lastPts = Number.NaN;
  let lastRank = 0;

  return (
    <div className="py-3">
      {celebrate && <Confetti colors={tourTheme(tour.pcs_slug).confetti} />}
      <h1 className="mb-2 text-xl font-bold text-slate-100">Rangliste</h1>

      <div className="mb-2 flex gap-1">
        {(["tour", "season"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-lg px-3 py-1 text-xs ${
              view === v
                ? "bg-accent font-semibold text-accent-contrast"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            {v === "tour" ? "Diese Tour" : `Saison ${tour.year}`}
          </button>
        ))}
      </div>

      <p className="mb-3 text-xs text-slate-500">
        {view === "tour"
          ? "Rang nach Etappen-Punkten. Zeile antippen für die Etappen-Tipps."
          : `Gesamtwertung ${tour.year} über alle Rennen.`}
      </p>

      {loading && <SkeletonList rows={6} height="h-9" />}

      <div className={`overflow-x-auto ${loading ? "hidden" : ""}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-500">
              {HEADERS.map((h) => (
                <th
                  key={h.label}
                  title={h.title}
                  scope="col"
                  className={`py-1 font-normal ${
                    h.align === "left" ? "pr-2 text-left" : "pl-2 text-right"
                  }`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              if (r.stage_points !== lastPts) {
                lastRank = i + 1;
                lastPts = r.stage_points;
              }
              const open = expandable && openId === r.user_id;
              return (
                <Fragment key={r.user_id}>
                  <tr
                    onClick={expandable ? () => toggle(r.user_id) : undefined}
                    onKeyDown={
                      expandable
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggle(r.user_id);
                            }
                          }
                        : undefined
                    }
                    role={expandable ? "button" : undefined}
                    tabIndex={expandable ? 0 : undefined}
                    aria-expanded={expandable ? open : undefined}
                    className={`border-b border-slate-900 ${
                      expandable
                        ? "cursor-pointer hover:bg-slate-900 focus:bg-slate-900 focus:outline-none"
                        : ""
                    }`}
                  >
                    <td className="py-2 pr-2 text-slate-500">{lastRank}</td>
                    <td className="py-2 pr-2 text-slate-200">
                      {expandable && (
                        <span className="mr-1 inline-block text-slate-600">
                          {open ? "▾" : "▸"}
                        </span>
                      )}
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
      {!loading && rows.length === 0 && (
        <p className="mt-2 text-slate-400">Noch keine Spieler.</p>
      )}

      <p className="mt-3 text-xs text-slate-600">
        Etap. = Etappen-Punkte (Rang) · ✓ = richtige Etappen · Sond. =
        Sonderwertungen · Frag. = Fragen
      </p>
    </div>
  );
}
