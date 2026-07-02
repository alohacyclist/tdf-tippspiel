import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../lib/appContext";
import {
  listClassifications,
  listQuestions,
  listRiders,
  listStages,
  type QuestionWithOptions,
} from "../lib/queries";
import {
  adminCreateClassification,
  adminSetClassificationOpen,
  adminSetClassificationResults,
  adminSetStageResult,
} from "../lib/adminQueries";
import type { Classification, Rider, Stage } from "../lib/types";
import { formatLocal, isPast } from "../lib/time";
import { RiderCombobox } from "../components/RiderCombobox";
import { QuestionsSection } from "../components/AdminQuestions";

function toIso(local: string): string {
  return new Date(local).toISOString();
}

export function Admin() {
  const { tour, isAdmin } = useApp();
  const [stages, setStages] = useState<Stage[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [cls, setCls] = useState<Classification[]>([]);
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    try {
      const [s, r, c, q] = await Promise.all([
        listStages(tour.id),
        listRiders(tour.id),
        listClassifications(tour.id),
        listQuestions(tour.id),
      ]);
      setStages(s);
      setRiders(r);
      setCls(c);
      setQuestions(q);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour.id]);

  const stageById = useMemo(
    () => new Map(stages.map((s) => [s.id, s])),
    [stages],
  );
  const activeRiders = useMemo(
    () => riders.filter((r) => r.is_active),
    [riders],
  );

  if (!isAdmin) return <p className="py-4 text-red-400">Kein Zugriff.</p>;

  return (
    <div className="py-3">
      <Link to="/" className="text-sm text-slate-400">
        ← Etappen
      </Link>
      <h1 className="mt-2 text-xl font-bold text-slate-100">Admin</h1>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <CreateClassification tourId={tour.id} stages={stages} onDone={reload} />

      <h2 className="mb-2 mt-8 font-semibold text-slate-200">
        Wertungen verwalten
      </h2>
      <div className="flex flex-col gap-2">
        {cls.map((c) => (
          <ClassificationRow
            key={c.id}
            c={c}
            riders={activeRiders}
            deadline={
              c.stage_id
                ? (stageById.get(c.stage_id)?.start_time ?? null)
                : c.deadline
            }
            onDone={reload}
          />
        ))}
        {cls.length === 0 && (
          <p className="text-sm text-slate-400">Noch keine Wertungen.</p>
        )}
      </div>

      <StageResult stages={stages} riders={activeRiders} onDone={reload} />

      <QuestionsSection
        tourId={tour.id}
        stages={stages}
        questions={questions}
        stageById={stageById}
        onDone={reload}
      />
    </div>
  );
}

const TYPES = ["gc", "points", "kom", "youth", "custom"] as const;

function CreateClassification({
  tourId,
  stages,
  onDone,
}: {
  tourId: string;
  stages: Stage[];
  onDone: () => void;
}) {
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("custom");
  const [slots, setSlots] = useState(1);
  const [ordered, setOrdered] = useState(false);
  const [points, setPoints] = useState("");
  const [attach, setAttach] = useState<"tour" | "stage">("tour");
  const [stageId, setStageId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminCreateClassification({
        tourId,
        key: key.trim(),
        name: name.trim(),
        type,
        slots,
        ordered,
        points: points === "" ? null : Number(points),
        stageId: attach === "stage" ? stageId || null : null,
        deadline: attach === "tour" && deadline ? toIso(deadline) : null,
      });
      setKey("");
      setName("");
      setPoints("");
      setDeadline("");
      setStageId("");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    key.trim() && name.trim() && (attach === "tour" ? !!deadline : !!stageId);

  return (
    <form
      onSubmit={submit}
      className="mt-5 flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4"
    >
      <h2 className="font-semibold text-slate-200">Sonderwertung anlegen</h2>
      <div className="grid grid-cols-2 gap-2">
        <input
          placeholder="key (z.B. sprint_10)"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-yellow-400"
        />
        <input
          placeholder="Name (Anzeige)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-yellow-400"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          max={10}
          value={slots}
          onChange={(e) => setSlots(Number(e.target.value))}
          className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
        />
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={ordered}
            onChange={(e) => setOrdered(e.target.checked)}
          />
          geordnet (Plätze)
        </label>
        <input
          type="number"
          placeholder="Punkte (optional)"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
        />
      </div>

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

function ClassificationRow({
  c,
  riders,
  deadline,
  onDone,
}: {
  c: Classification;
  riders: Rider[];
  deadline: string | null;
  onDone: () => void;
}) {
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const revealed = isPast(deadline);

  async function toggleOpen() {
    setError(null);
    try {
      await adminSetClassificationOpen(c.id, !c.is_open);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    }
  }

  async function saveResults() {
    // Build in slot (=rank) order. For ordered classifications the ranks must be
    // contiguous from Platz 1 — a gap would shift every later rider up a rank.
    const ids: string[] = [];
    let gap = false;
    for (let slot = 1; slot <= c.slots; slot++) {
      const r = picks[slot];
      if (r) {
        if (gap && c.ordered) {
          setError("Geordnete Wertung: Plätze lückenlos ab Platz 1 ausfüllen.");
          return;
        }
        ids.push(r);
      } else {
        gap = true;
      }
    }
    if (ids.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      await adminSetClassificationResults(c.id, ids);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-200">
          {c.name}
          <span className="ml-2 text-xs text-slate-500">
            {c.stage_id ? "Etappe" : "Tour"} · bis {formatLocal(deadline)}
          </span>
        </span>
        <button
          onClick={toggleOpen}
          className={`text-xs ${c.is_open ? "text-green-400" : "text-slate-400"}`}
        >
          {c.is_open ? "offen" : "geschlossen"}
        </button>
      </div>

      {revealed && (
        <div className="mt-2 flex flex-col gap-2">
          {Array.from({ length: c.slots }, (_, i) => i + 1).map((slot) => (
            <div key={slot}>
              {c.ordered && (
                <div className="mb-1 text-xs text-slate-400">Platz {slot}</div>
              )}
              <RiderCombobox
                riders={riders}
                value={picks[slot] ?? null}
                exclude={
                  new Set(
                    Object.entries(picks)
                      .filter(([s]) => Number(s) !== slot)
                      .map(([, r]) => r),
                  )
                }
                onSelect={(r) => setPicks({ ...picks, [slot]: r })}
              />
            </div>
          ))}
          <button
            onClick={saveResults}
            disabled={busy}
            className="rounded-lg bg-yellow-400 px-3 py-1.5 text-sm font-semibold text-slate-900 disabled:opacity-50"
          >
            Ergebnis speichern
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}

function StageResult({
  stages,
  riders,
  onDone,
}: {
  stages: Stage[];
  riders: Rider[];
  onDone: () => void;
}) {
  const [stageId, setStageId] = useState("");
  const [rider, setRider] = useState<string | null>(null);
  const [team, setTeam] = useState("");
  const [close, setClose] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stage = stages.find((s) => s.id === stageId) ?? null;
  const isTtt = stage?.type === "ttt";
  const teams = useMemo(
    () =>
      [
        ...new Set(riders.map((r) => r.team).filter((t): t is string => !!t)),
      ].sort(),
    [riders],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminSetStageResult({
        stageId,
        winnerRiderId: isTtt ? null : rider,
        winnerTeam: isTtt ? team : null,
        close,
      });
      setRider(null);
      setTeam("");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = stageId && (isTtt ? !!team : !!rider);

  return (
    <form
      onSubmit={submit}
      className="mt-8 flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4"
    >
      <h2 className="font-semibold text-slate-200">Etappen-Ergebnis</h2>
      <select
        value={stageId}
        onChange={(e) => {
          setStageId(e.target.value);
          setRider(null);
          setTeam("");
        }}
        className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
      >
        <option value="">Etappe wählen…</option>
        {stages.map((s) => (
          <option key={s.id} value={s.id}>
            Etappe {s.number} · {formatLocal(s.start_time)}
          </option>
        ))}
      </select>

      {stage &&
        (isTtt ? (
          <select
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            <option value="">Sieger-Mannschaft…</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        ) : (
          <RiderCombobox riders={riders} value={rider} onSelect={setRider} />
        ))}

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={close}
          onChange={(e) => setClose(e.target.checked)}
        />
        Etappe schließen (status = finished)
      </label>
      <button
        disabled={busy || !canSubmit}
        className="rounded-lg bg-yellow-400 px-3 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
      >
        Speichern
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
