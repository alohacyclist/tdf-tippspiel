import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../lib/appContext";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import {
  getMyStageTip,
  getStage,
  listClassifications,
  listMyAnswers,
  listMyClassificationTips,
  listQuestions,
  listRiders,
  listStages,
  listStageTips,
  saveStageTip,
  type QuestionWithOptions,
  type RevealedTip,
} from "../lib/queries";
import type {
  Classification,
  ClassificationTip,
  QuestionAnswer,
  Rider,
  Stage,
  StageType,
} from "../lib/types";
import { formatLocal, isPast } from "../lib/time";
import { RiderCombobox } from "../components/RiderCombobox";
import { Countdown } from "../components/Countdown";
import { StageProfile } from "../components/StageProfile";
import { ClassificationCard } from "../components/ClassificationCard";
import { QuestionCard } from "../components/QuestionCard";
import { pcsStageUrl } from "../lib/pcs";
import { stageLabel, stagesNounPlural } from "../lib/stageLabel";
import { SkeletonList } from "../components/Skeleton";

const TYPE_LABEL: Record<StageType, string> = {
  flat: "Flachetappe",
  hilly: "Hügeletappe",
  mountain: "Bergetappe",
  itt: "Einzelzeitfahren",
  ttt: "Mannschaftszeitfahren",
};

export function StageDetail() {
  const { stageId } = useParams();
  const { tour, userId } = useApp();
  const [stage, setStage] = useState<Stage | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [pick, setPick] = useState<string | null>(null);
  const [teamPick, setTeamPick] = useState<string | null>(null);
  const [reveal, setReveal] = useState<RevealedTip[]>([]);
  const [clsList, setClsList] = useState<Classification[]>([]);
  const [clsTips, setClsTips] = useState<ClassificationTip[]>([]);
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const stageClassifications = useMemo(
    () => clsList.filter((c) => c.stage_id === stageId),
    [clsList, stageId],
  );
  const stageQuestions = useMemo(
    () => questions.filter((q) => q.stage_id === stageId),
    [questions, stageId],
  );

  const isTtt = stage?.type === "ttt";
  const started = isPast(stage?.start_time ?? null);
  const ridersById = useMemo(
    () => new Map(riders.map((r) => [r.id, r])),
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

  useEffect(() => {
    if (!stageId) return;
    Promise.all([
      getStage(stageId),
      listStages(tour.id),
      listRiders(tour.id),
      getMyStageTip(stageId, userId),
      listClassifications(tour.id),
      listMyClassificationTips(tour.id, userId),
      listQuestions(tour.id),
      listMyAnswers(tour.id, userId),
    ])
      .then(([s, all, rs, tip, cls, ctips, qs, ans]) => {
        setStage(s);
        setStages(all);
        setRiders(rs);
        setPick(tip?.rider_id ?? null);
        setTeamPick(tip?.team ?? null);
        setClsList(cls);
        setClsTips(ctips);
        setQuestions(qs);
        setAnswers(ans);
        setReveal([]);
        if (s && isPast(s.start_time))
          return listStageTips(stageId).then(setReveal);
      })
      .catch((e) => setError(e.message));
  }, [stageId, tour.id, userId]);

  const { prev, next } = useMemo(() => {
    const i = stages.findIndex((s) => s.id === stageId);
    return {
      prev: i > 0 ? stages[i - 1] : null,
      next: i >= 0 && i < stages.length - 1 ? stages[i + 1] : null,
    };
  }, [stages, stageId]);

  // After the start, poll (and refetch on tab focus) for the winner + revealed tips
  // until the admin has entered a result, then stop.
  const loadResult = useCallback(() => {
    if (!stageId) return;
    getStage(stageId)
      .then((s) => s && setStage(s))
      .catch(() => {});
    listStageTips(stageId)
      .then(setReveal)
      .catch(() => {});
  }, [stageId]);

  const awaitingResult =
    stage != null &&
    isPast(stage.start_time) &&
    stage.winner_rider_id === null &&
    stage.winner_team === null;

  useAutoRefresh(loadResult, awaitingResult);

  async function save() {
    if (!stageId) return;
    const chosen = isTtt ? teamPick : pick;
    if (!chosen) return;
    setError(null);
    try {
      await saveStageTip({
        tourId: tour.id,
        userId,
        stageId,
        riderId: isTtt ? null : pick,
        team: isTtt ? teamPick : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    }
  }

  if (error) return <p className="py-4 text-red-400">{error}</p>;
  if (!stage)
    return (
      <div className="py-4">
        <SkeletonList rows={4} height="h-20" />
      </div>
    );

  const myRider = pick ? ridersById.get(pick) : null;
  const dnf = !isTtt && myRider && !myRider.is_active;
  const canSave = isTtt ? !!teamPick : !!pick;

  return (
    <div className="py-3">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-slate-400">
          ← {stagesNounPlural(tour.kind)}
        </Link>
        <div className="flex gap-3 text-sm">
          {prev ? (
            <Link to={`/stage/${prev.id}`} className="text-accent">
              ← Etappe {prev.number}
            </Link>
          ) : (
            <span className="text-slate-600">← Etappe</span>
          )}
          {next ? (
            <Link to={`/stage/${next.id}`} className="text-accent">
              Etappe {next.number} →
            </Link>
          ) : (
            <span className="text-slate-600">Etappe →</span>
          )}
        </div>
      </div>
      <h1 className="mt-2 text-xl font-bold text-slate-100">
        {stageLabel(tour.kind, stage)}
        {stage.start_city && stage.finish_city
          ? ` · ${stage.start_city} → ${stage.finish_city}`
          : ""}
        {isTtt && (
          <span className="ml-2 text-sm font-normal text-accent">
            Mannschaftszeitfahren
          </span>
        )}
      </h1>
      <p className="text-sm text-slate-400">
        Start: {formatLocal(stage.start_time)}{" "}
        {!started && (
          <>
            (<Countdown iso={stage.start_time} />)
          </>
        )}
      </p>

      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
        {stage.type && <span>{TYPE_LABEL[stage.type]}</span>}
        {stage.distance_km != null && <span>{stage.distance_km} km</span>}
      </div>

      <StageProfile
        raceSlug={tour.pcs_slug}
        stageNumber={stage.number}
        year={tour.year}
        oneDay={tour.kind === "one_day"}
      />

      {!started ? (
        <div className="mt-5">
          <h2 className="mb-2 font-semibold text-slate-200">
            {isTtt
              ? "Dein Team-Tipp (Sieger-Mannschaft)"
              : "Dein Etappensieger-Tipp"}
          </h2>
          {dnf && (
            <p className="mb-2 rounded-lg bg-red-950 p-2 text-sm text-red-300">
              Dein getippter Fahrer ist ausgeschieden — bitte neu tippen.
            </p>
          )}
          {isTtt ? (
            <select
              value={teamPick ?? ""}
              onChange={(e) => setTeamPick(e.target.value || null)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-accent"
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
            disabled={!canSave}
            className="mt-3 w-full rounded-lg bg-accent px-3 py-2 font-semibold text-accent-contrast disabled:opacity-50"
          >
            {saved ? "Gespeichert ✓" : "Tipp speichern"}
          </button>
          <p className="mt-2 text-xs text-slate-500">
            Änderbar bis zum Start. Fremde Tipps werden erst ab Start sichtbar.
          </p>
        </div>
      ) : (
        <div className="mt-5">
          <h2 className="mb-2 font-semibold text-slate-200">
            Tipps & Ergebnis
          </h2>
          <a
            href={pcsStageUrl(
              tour.pcs_slug,
              tour.year,
              stage.number,
              tour.kind === "one_day",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 inline-block text-sm text-accent"
          >
            Vollständiges Ergebnis auf procyclingstats ↗
          </a>
          {isTtt
            ? stage.winner_team && (
                <p className="mb-3 rounded-lg bg-green-950 p-2 text-sm text-green-300">
                  Sieger-Mannschaft: {stage.winner_team}
                </p>
              )
            : stage.winner_rider_id && (
                <p className="mb-3 rounded-lg bg-green-950 p-2 text-sm text-green-300">
                  Sieger: {ridersById.get(stage.winner_rider_id)?.name ?? "—"}
                </p>
              )}
          <ul className="flex flex-col gap-1">
            {reveal.map((t) => {
              const correct = isTtt
                ? stage.winner_team != null && t.team === stage.winner_team
                : stage.winner_rider_id === t.rider_id;
              const label = isTtt ? (t.team ?? "—") : (t.rider?.name ?? "—");
              return (
                <li
                  key={t.id}
                  className="flex justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"
                >
                  <span className="text-slate-300">
                    {t.player?.display_name ?? "—"}
                  </span>
                  <span
                    className={
                      correct
                        ? "font-semibold text-green-400"
                        : "text-slate-200"
                    }
                  >
                    {label}
                  </span>
                </li>
              );
            })}
            {reveal.length === 0 && (
              <p className="text-slate-400">Keine Tipps abgegeben.</p>
            )}
          </ul>
        </div>
      )}

      {stageClassifications.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          <h2 className="font-semibold text-slate-200">Etappen-Wertungen</h2>
          {stageClassifications.map((c) => (
            <ClassificationCard
              key={c.id}
              classification={c}
              riders={riders}
              myTips={clsTips.filter((t) => t.classification_id === c.id)}
              tourId={tour.id}
              userId={userId}
              deadlineOverride={stage.start_time}
            />
          ))}
        </div>
      )}

      {stageQuestions.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          <h2 className="font-semibold text-slate-200">Etappen-Fragen</h2>
          {stageQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              myAnswer={answers.find((a) => a.question_id === q.id) ?? null}
              tourId={tour.id}
              userId={userId}
              deadlineOverride={stage.start_time}
            />
          ))}
        </div>
      )}
    </div>
  );
}
