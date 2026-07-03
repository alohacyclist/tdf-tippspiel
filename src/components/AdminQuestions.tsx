import { useState } from "react";
import {
  adminAddQuestionOption,
  adminClearQuestionResult,
  adminCreateQuestion,
  adminDeleteQuestion,
  adminDeleteQuestionOption,
  adminSetQuestionOpen,
  adminSetQuestionResult,
} from "../lib/adminQueries";
import type { QuestionWithOptions } from "../lib/queries";
import type { Stage } from "../lib/types";
import { formatLocal, isPast } from "../lib/time";

function toIso(local: string): string {
  return new Date(local).toISOString();
}

export function QuestionsSection({
  tourId,
  stages,
  questions,
  stageById,
  isAdmin,
  onDone,
}: {
  tourId: string;
  stages: Stage[];
  questions: QuestionWithOptions[];
  stageById: Map<string, Stage>;
  isAdmin: boolean;
  onDone: () => void;
}) {
  return (
    <>
      <CreateQuestion tourId={tourId} stages={stages} onDone={onDone} />

      <h2 className="mb-2 mt-8 font-semibold text-slate-200">
        Fragen verwalten
      </h2>
      <div className="flex flex-col gap-2">
        {questions.map((q) => (
          <QuestionRow
            key={q.id}
            q={q}
            deadline={
              q.stage_id
                ? (stageById.get(q.stage_id)?.start_time ?? null)
                : q.deadline
            }
            canDelete={isAdmin}
            onDone={onDone}
          />
        ))}
        {questions.length === 0 && (
          <p className="text-sm text-slate-400">Noch keine Fragen.</p>
        )}
      </div>
    </>
  );
}

function CreateQuestion({
  tourId,
  stages,
  onDone,
}: {
  tourId: string;
  stages: Stage[];
  onDone: () => void;
}) {
  const [kind, setKind] = useState<"boolean" | "choice">("boolean");
  const [prompt, setPrompt] = useState("");
  const [help, setHelp] = useState("");
  const [points, setPoints] = useState("10");
  const [attach, setAttach] = useState<"tour" | "stage">("tour");
  const [stageId, setStageId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanOptions = options.map((o) => o.trim()).filter(Boolean);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const id = await adminCreateQuestion({
        tourId,
        kind,
        prompt: prompt.trim(),
        points: points === "" ? 0 : Number(points),
        help: help.trim() || null,
        stageId: attach === "stage" ? stageId || null : null,
        deadline: attach === "tour" && deadline ? toIso(deadline) : null,
      });
      if (kind === "choice") {
        for (let i = 0; i < cleanOptions.length; i++) {
          await adminAddQuestionOption(id, cleanOptions[i], i);
        }
      }
      setPrompt("");
      setHelp("");
      setDeadline("");
      setStageId("");
      setOptions(["", ""]);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    prompt.trim() &&
    (attach === "tour" ? !!deadline : !!stageId) &&
    (kind !== "choice" || cleanOptions.length >= 2);

  return (
    <form
      onSubmit={submit}
      className="mt-8 flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4"
    >
      <h2 className="font-semibold text-slate-200">Frage anlegen</h2>
      <div className="flex gap-2">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as "boolean" | "choice")}
          className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
        >
          <option value="boolean">Ja / Nein</option>
          <option value="choice">Multiple-Choice</option>
        </select>
        <input
          type="number"
          placeholder="Punkte"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          className="w-24 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
        />
      </div>
      <input
        placeholder="Frage (Anzeige)"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-yellow-400"
      />
      <input
        placeholder="Hilfetext (optional)"
        value={help}
        onChange={(e) => setHelp(e.target.value)}
        className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
      />

      <div className="mt-1 flex gap-4 text-sm text-slate-300">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={attach === "tour"}
            onChange={() => setAttach("tour")}
          />
          Tour-weit
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={attach === "stage"}
            onChange={() => setAttach("stage")}
          />
          an Etappe
        </label>
      </div>
      {attach === "tour" ? (
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
        />
      ) : (
        <select
          value={stageId}
          onChange={(e) => setStageId(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
        >
          <option value="">Etappe wählen…</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              Etappe {s.number} · {formatLocal(s.start_time)}
            </option>
          ))}
        </select>
      )}

      {kind === "choice" && (
        <div className="flex flex-col gap-1">
          <div className="text-xs text-slate-400">
            Antwortmöglichkeiten (mind. 2)
          </div>
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) =>
                  setOptions(
                    options.map((o, j) => (j === i ? e.target.value : o)),
                  )
                }
                className="flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => setOptions(options.filter((_, j) => j !== i))}
                  className="rounded-lg border border-slate-700 px-2 text-sm text-red-400"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setOptions([...options, ""])}
            className="self-start text-xs text-yellow-400"
          >
            + Option
          </button>
        </div>
      )}

      <button
        disabled={busy || !canSubmit}
        className="mt-1 rounded-lg bg-yellow-400 px-3 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
      >
        Anlegen
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}

function QuestionRow({
  q,
  deadline,
  canDelete,
  onDone,
}: {
  q: QuestionWithOptions;
  deadline: string | null;
  canDelete: boolean;
  onDone: () => void;
}) {
  const [optLabel, setOptLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const revealed = isPast(deadline);
  const options = [...q.options].sort((a, b) => a.sort_order - b.sort_order);

  async function act(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    }
  }

  async function addOption() {
    const label = optLabel.trim();
    if (!label) return;
    setError(null);
    try {
      await adminAddQuestionOption(q.id, label, options.length);
      setOptLabel(""); // clear only after a successful add
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    }
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-slate-200">
          {q.prompt}
          <span className="ml-2 text-xs text-slate-500">
            {q.kind === "boolean" ? "Ja/Nein" : "Choice"} ·{" "}
            {q.stage_id ? "Etappe" : "Tour"} · bis {formatLocal(deadline)}
            {q.is_resolved && " · ✓ aufgelöst"}
          </span>
        </span>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={() => act(() => adminSetQuestionOpen(q.id, !q.is_open))}
            className={`text-xs ${q.is_open ? "text-green-400" : "text-slate-400"}`}
          >
            {q.is_open ? "offen" : "zu"}
          </button>
          {canDelete && (
            <button
              onClick={() => act(() => adminDeleteQuestion(q.id))}
              className="text-xs text-red-400"
            >
              löschen
            </button>
          )}
        </div>
      </div>

      {q.kind === "choice" && (
        <div className="mt-2 flex flex-col gap-1">
          {options.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-slate-300">{o.label}</span>
              {canDelete && (
                <button
                  onClick={() => act(() => adminDeleteQuestionOption(o.id))}
                  className="text-xs text-red-400"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <div className="mt-1 flex gap-2">
            <input
              placeholder="Neue Option…"
              value={optLabel}
              onChange={(e) => setOptLabel(e.target.value)}
              className="flex-1 rounded-lg border border-slate-600 bg-slate-950 px-2 py-1 text-sm text-slate-100"
            />
            <button
              onClick={addOption}
              className="rounded-lg bg-slate-700 px-2 py-1 text-sm text-slate-100"
            >
              +
            </button>
          </div>
        </div>
      )}

      {revealed && (
        <div className="mt-2 border-t border-slate-800 pt-2">
          <div className="mb-1 text-xs text-slate-400">Ergebnis</div>
          {q.kind === "boolean" ? (
            <div className="flex gap-2">
              <button
                onClick={() =>
                  act(() => adminSetQuestionResult({ id: q.id, bool: true }))
                }
                className="flex-1 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200"
              >
                Ja
              </button>
              <button
                onClick={() =>
                  act(() => adminSetQuestionResult({ id: q.id, bool: false }))
                }
                className="flex-1 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200"
              >
                Nein
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {options.map((o) => (
                <button
                  key={o.id}
                  onClick={() =>
                    act(() =>
                      adminSetQuestionResult({ id: q.id, optionId: o.id }),
                    )
                  }
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-left text-sm text-slate-200"
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
          {q.is_resolved && (
            <button
              onClick={() => act(() => adminClearQuestionResult(q.id))}
              className="mt-1 text-xs text-slate-400"
            >
              Ergebnis zurücksetzen
            </button>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
