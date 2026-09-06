import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../lib/appContext";
import {
  listClassifications,
  listProfiles,
  listQuestions,
  listRiders,
  listStages,
  type AdminProfile,
  type QuestionWithOptions,
} from "../lib/queries";
import {
  adminCreateClassification,
  adminDeleteClassification,
  adminSetClassificationOpen,
  adminSetClassificationResults,
  adminSetRiderActive,
  adminSetRole,
  adminSetStageResult,
  adminSetStageTip,
  adminSetStatus,
} from "../lib/adminQueries";
import type {
  Classification,
  ProfileRole,
  ProfileStatus,
  Rider,
  Stage,
} from "../lib/types";
import { formatLocal, isPast } from "../lib/time";
import { RiderCombobox } from "../components/RiderCombobox";
import { QuestionsSection } from "../components/AdminQuestions";

function toIso(local: string): string {
  return new Date(local).toISOString();
}

type AdminTab =
  "results" | "classifications" | "questions" | "riders" | "tips" | "users";

// Deterministic to-do list: what still needs an admin action right now. No
// scraping — derived from the data already loaded (started stage without a
// winner, past-deadline question without a result).
function AdminTodo({
  pendingStages,
  pendingQuestions,
  onPickStage,
  onPickQuestion,
}: {
  pendingStages: Stage[];
  pendingQuestions: QuestionWithOptions[];
  onPickStage: (id: string) => void;
  onPickQuestion: () => void;
}) {
  const count = pendingStages.length + pendingQuestions.length;
  return (
    <div className="mt-4 rounded-xl border border-line bg-surface p-4">
      <h2 className="mb-2 flex items-center gap-2 font-semibold text-ink">
        Zu erledigen
        {count > 0 && (
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-contrast">
            {count}
          </span>
        )}
      </h2>
      {count === 0 ? (
        <p className="text-sm text-faint">Alles erledigt ✓</p>
      ) : (
        <div className="flex flex-col gap-2">
          {pendingStages.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2"
            >
              <span className="min-w-0 truncate text-sm text-ink">
                Etappe {s.number} ·{" "}
                <span className="text-miss">Sieger fehlt</span>
                <span className="ml-1 text-xs text-faint">
                  {formatLocal(s.start_time)}
                </span>
              </span>
              <button
                onClick={() => onPickStage(s.id)}
                className="shrink-0 rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-accent-contrast"
              >
                Eintragen
              </button>
            </div>
          ))}
          {pendingQuestions.map((q) => (
            <div
              key={q.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2"
            >
              <span className="min-w-0 truncate text-sm text-ink">
                Frage · <span className="text-miss">Ergebnis fehlt</span>
                <span className="ml-1 text-xs text-faint">{q.prompt}</span>
              </span>
              <button
                onClick={onPickQuestion}
                className="shrink-0 rounded-lg bg-surface2 px-3 py-1 text-xs font-semibold text-ink"
              >
                Öffnen
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Admin() {
  const { tour, isAdmin, canEdit } = useApp();
  const [stages, setStages] = useState<Stage[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [cls, setCls] = useState<Classification[]>([]);
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    try {
      const [s, r, c, q, p] = await Promise.all([
        listStages(tour.id),
        listRiders(tour.id),
        listClassifications(tour.id),
        listQuestions(tour.id),
        isAdmin ? listProfiles() : Promise.resolve([]),
      ]);
      setStages(s);
      setRiders(r);
      setCls(c);
      setQuestions(q);
      setProfiles(p);
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

  const [tab, setTab] = useState<AdminTab>("results");
  const [resultStageId, setResultStageId] = useState("");

  // Started stages with no winner yet — the recurring "enter the result" task.
  const pendingStages = useMemo(
    () =>
      stages.filter(
        (s) =>
          s.status !== "void" &&
          isPast(s.start_time) &&
          !s.winner_rider_id &&
          !s.winner_team,
      ),
    [stages],
  );
  const pendingQuestions = useMemo(
    () =>
      questions.filter((q) => {
        const dl = q.stage_id
          ? (stageById.get(q.stage_id)?.start_time ?? null)
          : q.deadline;
        return isPast(dl) && !q.is_resolved;
      }),
    [questions, stageById],
  );

  function openStageResult(id: string) {
    setResultStageId(id);
    setTab("results");
  }

  const tabs: { key: AdminTab; label: string }[] = [
    { key: "results", label: "Ergebnisse" },
    { key: "classifications", label: "Wertungen" },
    { key: "questions", label: "Fragen" },
    { key: "riders", label: "Fahrer" },
    ...(isAdmin
      ? [
          { key: "tips" as AdminTab, label: "Tipps" },
          { key: "users" as AdminTab, label: "Nutzer" },
        ]
      : []),
  ];

  if (!canEdit) return <p className="py-4 text-miss">Kein Zugriff.</p>;

  return (
    <div className="py-3">
      <Link to="/" className="text-sm text-muted">
        ← Etappen
      </Link>
      <h1 className="mt-2 text-xl font-bold text-ink">Admin</h1>
      {error && <p className="mt-2 text-sm text-miss">{error}</p>}

      <AdminTodo
        pendingStages={pendingStages}
        pendingQuestions={pendingQuestions}
        onPickStage={openStageResult}
        onPickQuestion={() => setTab("questions")}
      />

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm ${
              tab === t.key
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "results" && (
          <StageResult
            stages={stages}
            riders={activeRiders}
            stageId={resultStageId}
            onStageId={setResultStageId}
            onDone={reload}
          />
        )}

        {tab === "classifications" && (
          <>
            <CreateClassification
              tourId={tour.id}
              stages={stages}
              onDone={reload}
            />
            <div className="mt-4 flex flex-col gap-2">
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
                  canDelete={isAdmin}
                  onDone={reload}
                />
              ))}
              {cls.length === 0 && (
                <p className="text-sm text-muted">Noch keine Wertungen.</p>
              )}
            </div>
          </>
        )}

        {tab === "questions" && (
          <QuestionsSection
            tourId={tour.id}
            stages={stages}
            questions={questions}
            stageById={stageById}
            isAdmin={isAdmin}
            onDone={reload}
          />
        )}

        {tab === "riders" && (
          <RidersSection riders={riders} stages={stages} onDone={reload} />
        )}

        {tab === "tips" && isAdmin && (
          <StageTipBackfill
            profiles={profiles}
            stages={stages}
            riders={riders}
            onDone={reload}
          />
        )}

        {tab === "users" && isAdmin && (
          <UsersSection profiles={profiles} onDone={reload} />
        )}
      </div>
    </div>
  );
}

function riderStatusLabel(r: Rider): string {
  if (r.is_active) return "aktiv";
  return r.dnf_stage != null
    ? `DNF · Etappe ${r.dnf_stage}`
    : "nicht gestartet";
}

function RidersSection({
  riders,
  stages,
  onDone,
}: {
  riders: Rider[];
  stages: Stage[];
  onDone: () => void;
}) {
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dnfStage, setDnfStage] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const query = q.trim().toLowerCase();
  // No search -> the riders currently out (to review/reactivate). With search ->
  // name matches (to mark someone DNF/DNS).
  const shown = useMemo(() => {
    const list = query
      ? riders.filter((r) => r.name.toLowerCase().includes(query))
      : riders.filter((r) => !r.is_active);
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [riders, query]);
  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => a.number - b.number),
    [stages],
  );

  async function apply(r: Rider, active: boolean, stageNum: number | null) {
    setBusyId(r.id);
    setError(null);
    try {
      await adminSetRiderActive(r.id, active, stageNum);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Fahrer suchen…"
        className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
      />
      {error && <p className="text-sm text-miss">{error}</p>}
      <p className="text-xs text-faint">
        {query
          ? "DNF = Aufgabe (mit Etappe), DNS = nicht gestartet — beide fliegen aus der Tipp-Auswahl."
          : "Aktuell nicht in der Auswahl (Aufgaben + Nicht-Starter). Suchen, um jemanden zu markieren."}
      </p>
      {shown.map((r) => {
        const busy = busyId === r.id;
        return (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2"
          >
            <span className="min-w-0 truncate text-sm text-ink">
              {r.name}
              <span className="ml-2 text-xs text-faint">{r.team}</span>
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`text-xs ${r.is_active ? "text-hit" : "text-miss"}`}
              >
                {riderStatusLabel(r)}
              </span>
              {r.is_active ? (
                <>
                  <select
                    value={dnfStage[r.id] ?? ""}
                    onChange={(e) =>
                      setDnfStage((p) => ({ ...p, [r.id]: e.target.value }))
                    }
                    className="rounded-lg border border-line bg-paper px-1.5 py-1 text-xs text-ink"
                    aria-label="DNF-Etappe"
                  >
                    <option value="">Etappe…</option>
                    {sortedStages.map((s) => (
                      <option key={s.id} value={s.number}>
                        E{s.number}
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={busy || !dnfStage[r.id]}
                    onClick={() => apply(r, false, Number(dnfStage[r.id]))}
                    className="rounded-lg bg-miss/15 px-2 py-1 text-xs font-semibold text-miss disabled:opacity-40"
                  >
                    DNF
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => apply(r, false, null)}
                    className="rounded-lg bg-surface2 px-2 py-1 text-xs font-semibold text-ink disabled:opacity-50"
                  >
                    DNS
                  </button>
                </>
              ) : (
                <button
                  disabled={busy}
                  onClick={() => apply(r, true, null)}
                  className="rounded-lg bg-surface2 px-3 py-1 text-xs font-semibold text-ink disabled:opacity-50"
                >
                  reaktivieren
                </button>
              )}
            </div>
          </div>
        );
      })}
      {shown.length === 0 && (
        <p className="text-sm text-muted">
          {query ? "Kein Treffer." : "Alle Fahrer aktiv."}
        </p>
      )}
    </div>
  );
}

function StageTipBackfill({
  profiles,
  stages,
  riders,
  onDone,
}: {
  profiles: AdminProfile[];
  stages: Stage[];
  riders: Rider[];
  onDone: () => void;
}) {
  const [userId, setUserId] = useState("");
  const [stageId, setStageId] = useState("");
  const [rider, setRider] = useState<string | null>(null);
  const [team, setTeam] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const players = useMemo(
    () => profiles.filter((p) => p.status === "active"),
    [profiles],
  );
  const stage = stages.find((s) => s.id === stageId) ?? null;
  const isTtt = stage?.type === "ttt";
  // full roster (not just active) so a past-stage tip on a since-abandoned rider works.
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
    setSaved(false);
    try {
      await adminSetStageTip({
        userId,
        stageId,
        riderId: isTtt ? null : rider,
        team: isTtt ? team : null,
      });
      setRider(null);
      setTeam("");
      setSaved(true);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = userId && stageId && (isTtt ? !!team : !!rider);

  return (
    <form
      onSubmit={submit}
      className="mt-8 flex flex-col gap-2 rounded-xl border border-line bg-surface p-4"
    >
      <h2 className="font-semibold text-ink">
        Etappensieger-Tipp nachtragen
      </h2>
      <p className="text-xs text-faint">
        Trägt einen Tipp für einen Spieler ein — auch nach Deadline.
      </p>
      <select
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
      >
        <option value="">Spieler wählen…</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.display_name ?? "—"}
          </option>
        ))}
      </select>
      <select
        value={stageId}
        onChange={(e) => {
          setStageId(e.target.value);
          setRider(null);
          setTeam("");
          setSaved(false);
        }}
        className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
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
            className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
          >
            <option value="">Mannschaft…</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        ) : (
          <RiderCombobox riders={riders} value={rider} onSelect={setRider} />
        ))}

      <button
        disabled={busy || !canSubmit}
        className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-contrast disabled:opacity-50"
      >
        Tipp speichern
      </button>
      {saved && <p className="text-sm text-hit">Gespeichert.</p>}
      {error && <p className="text-sm text-miss">{error}</p>}
    </form>
  );
}

function UsersSection({
  profiles,
  onDone,
}: {
  profiles: AdminProfile[];
  onDone: () => void;
}) {
  const { userId, refreshProfile } = useApp();
  const [error, setError] = useState<string | null>(null);
  const ROLES: ProfileRole[] = ["member", "editor", "admin"];
  const STATUSES: ProfileStatus[] = ["pending", "active", "blocked"];

  async function setRole(targetId: string, role: ProfileRole) {
    setError(null);
    try {
      await adminSetRole(targetId, role);
      // changing your own role flips isAdmin/canEdit — refresh so the UI follows.
      if (targetId === userId) await refreshProfile();
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    }
  }

  async function setStatus(targetId: string, status: ProfileStatus) {
    setError(null);
    try {
      await adminSetStatus(targetId, status);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    }
  }

  return (
    <>
      <h2 className="mb-2 mt-2 font-semibold text-ink">
        Nutzer & Rollen
      </h2>
      {error && <p className="mb-2 text-sm text-miss">{error}</p>}
      <div className="flex flex-col gap-2">
        {profiles.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2"
          >
            <span className="text-sm text-ink">
              {p.display_name ?? "—"}
            </span>
            <div className="flex gap-2">
              <select
                value={p.status}
                onChange={(e) =>
                  setStatus(p.id, e.target.value as ProfileStatus)
                }
                className="rounded-lg border border-line bg-paper px-2 py-1 text-sm text-ink"
                aria-label="Status"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={p.role}
                onChange={(e) => setRole(p.id, e.target.value as ProfileRole)}
                className="rounded-lg border border-line bg-paper px-2 py-1 text-sm text-ink"
                aria-label="Rolle"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {profiles.length === 0 && (
          <p className="text-sm text-muted">Keine Nutzer.</p>
        )}
      </div>
    </>
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
      className="mt-5 flex flex-col gap-2 rounded-xl border border-line bg-surface p-4"
    >
      <h2 className="font-semibold text-ink">Sonderwertung anlegen</h2>
      <div className="grid grid-cols-2 gap-2">
        <input
          placeholder="key (z.B. sprint_10)"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />
        <input
          placeholder="Name (Anzeige)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
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
          className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
        <label className="flex items-center gap-2 text-sm text-muted">
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
          className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
      </div>

      <div className="mt-1 flex gap-4 text-sm text-muted">
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
          className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
      ) : (
        <select
          value={stageId}
          onChange={(e) => setStageId(e.target.value)}
          className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
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
        className="mt-1 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-contrast disabled:opacity-50"
      >
        Anlegen
      </button>
      {error && <p className="text-sm text-miss">{error}</p>}
    </form>
  );
}

function ClassificationRow({
  c,
  riders,
  deadline,
  canDelete,
  onDone,
}: {
  c: Classification;
  riders: Rider[];
  deadline: string | null;
  canDelete: boolean;
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

  async function remove() {
    if (
      !window.confirm(
        `Wertung „${c.name}“ löschen? Tipps und Ergebnisse gehen verloren.`,
      )
    )
      return;
    setError(null);
    try {
      await adminDeleteClassification(c.id);
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
    <div className="rounded-lg border border-line bg-surface px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink">
          {c.name}
          <span className="ml-2 text-xs text-faint">
            {c.stage_id ? "Etappe" : "Tour"} · bis {formatLocal(deadline)}
          </span>
        </span>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={toggleOpen}
            className={`text-xs ${c.is_open ? "text-hit" : "text-muted"}`}
          >
            {c.is_open ? "offen" : "geschlossen"}
          </button>
          {canDelete && (
            <button onClick={remove} className="text-xs text-miss">
              löschen
            </button>
          )}
        </div>
      </div>

      {revealed && (
        <div className="mt-2 flex flex-col gap-2">
          {Array.from({ length: c.slots }, (_, i) => i + 1).map((slot) => (
            <div key={slot}>
              {c.ordered && (
                <div className="mb-1 text-xs text-muted">Platz {slot}</div>
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
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-contrast disabled:opacity-50"
          >
            Ergebnis speichern
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-sm text-miss">{error}</p>}
    </div>
  );
}

function StageResult({
  stages,
  riders,
  stageId,
  onStageId,
  onDone,
}: {
  stages: Stage[];
  riders: Rider[];
  stageId: string;
  onStageId: (id: string) => void;
  onDone: () => void;
}) {
  const [rider, setRider] = useState<string | null>(null);
  const [team, setTeam] = useState("");
  const [close, setClose] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRider(null);
    setTeam("");
  }, [stageId]);

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
      className="mt-8 flex flex-col gap-2 rounded-xl border border-line bg-surface p-4"
    >
      <h2 className="font-semibold text-ink">Etappen-Ergebnis</h2>
      <select
        value={stageId}
        onChange={(e) => onStageId(e.target.value)}
        className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
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
            className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
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

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={close}
          onChange={(e) => setClose(e.target.checked)}
        />
        Etappe schließen (status = finished)
      </label>
      <button
        disabled={busy || !canSubmit}
        className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-contrast disabled:opacity-50"
      >
        Speichern
      </button>
      {error && <p className="text-sm text-miss">{error}</p>}
    </form>
  );
}
