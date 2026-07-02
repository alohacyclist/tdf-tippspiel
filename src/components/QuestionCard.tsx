import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getQuestionResult,
  listQuestionAnswers,
  saveQuestionAnswer,
  type QuestionWithOptions,
  type RevealedAnswer,
} from "../lib/queries";
import type {
  QuestionAnswer,
  QuestionOption,
  QuestionResult,
} from "../lib/types";
import { formatLocal, isPast } from "../lib/time";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

interface Props {
  question: QuestionWithOptions;
  myAnswer: QuestionAnswer | null;
  tourId: string;
  userId: string;
  // Stage-attached questions reveal at the stage start_time (deadline is null).
  deadlineOverride?: string | null;
}

export function QuestionCard({
  question: q,
  myAnswer,
  tourId,
  userId,
  deadlineOverride,
}: Props) {
  const [optionId, setOptionId] = useState<string | null>(
    myAnswer?.option_id ?? null,
  );
  const [boolValue, setBoolValue] = useState<boolean | null>(
    myAnswer?.bool_value ?? null,
  );
  const [reveal, setReveal] = useState<RevealedAnswer[]>([]);
  const [result, setResult] = useState<QuestionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const effectiveDeadline = deadlineOverride ?? q.deadline;
  const past = isPast(effectiveDeadline);
  const editable = q.is_open && !past;
  const options = useMemo(
    () => [...q.options].sort((a, b) => a.sort_order - b.sort_order),
    [q.options],
  );

  // Flip to the reveal view the moment the deadline passes while mounted, so answer
  // buttons don't stay live past the deadline (the RLS write would just reject).
  useEffect(() => {
    if (past || !effectiveDeadline) return;
    const ms = new Date(effectiveDeadline).getTime() - Date.now();
    if (ms <= 0) return;
    const id = setTimeout(
      () => setTick((t) => t + 1),
      Math.min(ms + 500, 2 ** 31 - 1),
    );
    return () => clearTimeout(id);
  }, [past, effectiveDeadline]);

  const loadReveal = useCallback(() => {
    listQuestionAnswers(q.id)
      .then(setReveal)
      .catch((e) => setError(e.message));
    getQuestionResult(q.id)
      .then(setResult)
      .catch(() => {});
  }, [q.id]);

  useEffect(() => {
    if (past) loadReveal();
  }, [past, loadReveal]);

  // Poll (and refetch on tab focus) until the admin's result lands, then stop.
  useAutoRefresh(loadReveal, past && result === null);

  async function saveBool(v: boolean) {
    setError(null);
    const prev = boolValue;
    setBoolValue(v);
    try {
      await saveQuestionAnswer({
        tourId,
        userId,
        questionId: q.id,
        boolValue: v,
      });
    } catch (e) {
      setBoolValue(prev);
      setError(e instanceof Error ? e.message : "Fehler");
    }
  }

  async function saveOption(id: string) {
    setError(null);
    const prev = optionId;
    setOptionId(id);
    try {
      await saveQuestionAnswer({
        tourId,
        userId,
        questionId: q.id,
        optionId: id,
      });
    } catch (e) {
      setOptionId(prev);
      setError(e instanceof Error ? e.message : "Fehler");
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h3 className="font-semibold text-slate-100">{q.prompt}</h3>
        <span className="shrink-0 text-xs text-slate-500">
          {past ? "aufgedeckt" : `bis ${formatLocal(effectiveDeadline)}`}
        </span>
      </div>
      {q.help_text && (
        <p className="mb-2 text-xs text-slate-400">{q.help_text}</p>
      )}

      {editable ? (
        q.kind === "boolean" ? (
          <div className="mt-2 flex gap-2">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                onClick={() => saveBool(v)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                  boolValue === v
                    ? "border-yellow-400 bg-yellow-400/10 text-yellow-300"
                    : "border-slate-700 text-slate-200"
                }`}
              >
                {v ? "Ja" : "Nein"}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {options.map((o) => (
              <button
                key={o.id}
                onClick={() => saveOption(o.id)}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${
                  optionId === o.id
                    ? "border-yellow-400 bg-yellow-400/10 text-yellow-300"
                    : "border-slate-700 text-slate-200"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )
      ) : past ? (
        <QuestionReveal
          q={q}
          options={options}
          reveal={reveal}
          result={result}
        />
      ) : (
        <p className="text-sm text-slate-400">Noch nicht geöffnet.</p>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}

function QuestionReveal({
  q,
  options,
  reveal,
  result,
}: {
  q: QuestionWithOptions;
  options: QuestionOption[];
  reveal: RevealedAnswer[];
  result: QuestionResult | null;
}) {
  const correctLabel =
    q.kind === "boolean"
      ? result?.bool_value == null
        ? null
        : result.bool_value
          ? "Ja"
          : "Nein"
      : result?.option_id
        ? (options.find((o) => o.id === result.option_id)?.label ?? null)
        : null;

  const answerLabel = (a: RevealedAnswer) =>
    q.kind === "boolean"
      ? a.bool_value
        ? "Ja"
        : "Nein"
      : (a.option?.label ?? "—");

  const isCorrect = (a: RevealedAnswer) =>
    q.kind === "boolean"
      ? result?.bool_value != null && a.bool_value === result.bool_value
      : result?.option_id != null && a.option_id === result.option_id;

  return (
    <div className="mt-1">
      {correctLabel && (
        <p className="mb-2 rounded-lg bg-green-950 p-2 text-sm text-green-300">
          Richtig: {correctLabel}
        </p>
      )}
      <ul className="flex flex-col gap-1">
        {reveal.map((a) => (
          <li
            key={a.id}
            className="flex justify-between rounded-lg bg-slate-950 px-3 py-2 text-sm"
          >
            <span className="text-slate-400">
              {a.player?.display_name ?? "—"}
            </span>
            <span
              className={
                isCorrect(a) ? "font-semibold text-green-400" : "text-slate-200"
              }
            >
              {answerLabel(a)}
            </span>
          </li>
        ))}
        {reveal.length === 0 && (
          <p className="text-sm text-slate-400">Keine Antworten.</p>
        )}
      </ul>
    </div>
  );
}
