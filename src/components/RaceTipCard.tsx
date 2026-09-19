import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { saveStageTip, type MyStageTip } from "../lib/queries";
import type { Rider, Stage, StageType, Tour } from "../lib/types";
import { formatLocal, isPast } from "../lib/time";
import {
  stageHasResult,
  stageWinnerLabel,
  stageWinnerMatch,
} from "../lib/stageResult";
import { RiderCombobox } from "./RiderCombobox";
import { Countdown } from "./Countdown";

const TYPE_LABEL: Record<StageType, string> = {
  flat: "Flach",
  hilly: "Hügelig",
  mountain: "Berg",
  itt: "Einzelzeitfahren",
  ttt: "Mannschaftszeitfahren",
};

// One race of a championship, tippable in place: the whole point of the event
// board is that all four Worlds races are on one page, so the tip is saved from
// here instead of sending the player through the race switcher and the stage page.
// Every race is its own tour with its own startlist — hence tour + riders per card,
// and the tip is written with the stage's own tour_id (what the RLS policy checks).
export function RaceTipCard({
  tour,
  stage,
  riders,
  tip,
  userId,
  onSaved,
}: {
  tour: Tour;
  stage: Stage;
  riders: Rider[];
  tip: MyStageTip | undefined;
  userId: string;
  onSaved: (tip: MyStageTip) => void;
}) {
  const [pick, setPick] = useState<string | null>(tip?.rider_id ?? null);
  const [teamPick, setTeamPick] = useState<string | null>(tip?.team ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTtt = stage.type === "ttt";
  const started = isPast(stage.start_time);
  const resolved = stageHasResult(stage);
  const isVoid = stage.status === "void";

  const riderName = useMemo(
    () => new Map(riders.map((r) => [r.id, r.name])),
    [riders],
  );
  const activeRiders = useMemo(
    () => riders.filter((r) => r.is_active),
    [riders],
  );
  const teams = useMemo(
    () =>
      [
        ...new Set(
          activeRiders.map((r) => r.team).filter((t): t is string => !!t),
        ),
      ].sort(),
    [activeRiders],
  );

  const chosen = isTtt ? teamPick : pick;
  const myTipLabel = isTtt
    ? (tip?.team ?? null)
    : tip?.rider_id
      ? (riderName.get(tip.rider_id) ?? "—")
      : null;
  const dnf =
    !isTtt && tip?.rider_id
      ? riders.some((r) => r.id === tip.rider_id && !r.is_active)
      : false;
  const correct = tip ? stageWinnerMatch(stage, tip) : false;

  async function save() {
    if (!chosen) return;
    setError(null);
    setSaving(true);
    try {
      await saveStageTip({
        tourId: stage.tour_id,
        userId,
        stageId: stage.id,
        riderId: isTtt ? null : pick,
        team: isTtt ? teamPick : null,
      });
      onSaved({
        stage_id: stage.id,
        rider_id: isTtt ? null : pick,
        team: isTtt ? teamPick : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="border border-line bg-surface">
      <header className="flex items-start justify-between gap-3 border-b border-line px-3 py-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-ink">
            {stage.name ?? tour.name}
          </h3>
          <div className="data mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
            {stage.start_city && stage.finish_city && (
              <span>
                {stage.start_city} → {stage.finish_city}
              </span>
            )}
            {stage.distance_km != null && <span>{stage.distance_km} km</span>}
            {stage.type && <span>{TYPE_LABEL[stage.type]}</span>}
            <span>{formatLocal(stage.start_time)}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          {isVoid ? (
            <span className="label text-miss">abgebrochen</span>
          ) : started ? (
            <span className="label text-faint">
              {resolved ? "beendet" : "läuft"}
            </span>
          ) : (
            <span className="data text-sm font-semibold text-accent">
              <Countdown iso={stage.start_time} />
            </span>
          )}
        </div>
      </header>

      <div className="px-3 py-3">
        {!started ? (
          <>
            {dnf && (
              <p className="mb-2 bg-miss/10 p-2 text-sm text-miss">
                Dein getippter Fahrer ist nicht mehr am Start — bitte neu tippen.
              </p>
            )}
            {isTtt ? (
              <select
                value={teamPick ?? ""}
                onChange={(e) => setTeamPick(e.target.value || null)}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
              >
                <option value="">Mannschaft wählen…</option>
                {teams.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            ) : (
              <RiderCombobox
                riders={activeRiders}
                value={pick}
                onSelect={setPick}
              />
            )}
            <button
              onClick={save}
              disabled={!chosen || saving}
              className="mt-2 w-full rounded-lg bg-accent px-3 py-2 font-semibold text-accent-contrast disabled:opacity-50"
            >
              {saved ? "Gespeichert ✓" : saving ? "Speichert…" : "Tipp speichern"}
            </button>
            {error && <p className="mt-2 text-sm text-miss">{error}</p>}
          </>
        ) : (
          <div className="text-sm">
            {isVoid ? (
              <p className="text-miss">
                Rennen abgebrochen — es zählt für niemanden Punkte.
              </p>
            ) : resolved ? (
              <p className="text-muted">
                Sieger:{" "}
                <span className="font-semibold text-ink">
                  {stageWinnerLabel(stage, riderName)}
                </span>
              </p>
            ) : (
              <p className="text-muted">Läuft — Ergebnis steht noch aus.</p>
            )}
            <p className="mt-1">
              Dein Tipp:{" "}
              <span
                className={
                  isVoid
                    ? "text-faint"
                    : resolved
                      ? myTipLabel
                        ? correct
                          ? "text-hit"
                          : "text-miss"
                        : "text-faint"
                      : "text-ink"
                }
              >
                {myTipLabel ?? "kein Tipp"}
                {!isVoid && resolved && myTipLabel && (correct ? " ✓" : " ✗")}
              </span>
            </p>
          </div>
        )}
        <Link
          to={`/stage/${stage.id}`}
          className="mt-2 inline-block text-xs text-accent"
        >
          {started ? "Alle Tipps & Ergebnis" : "Details & Streckenprofil"} →
        </Link>
      </div>
    </article>
  );
}
