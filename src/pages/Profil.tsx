import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../lib/appContext";
import { getDisplayName, setDisplayName } from "../lib/queries";

export function Profil() {
  const { userId } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [initial, setInitial] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    getDisplayName(userId)
      .then((n) => {
        if (!active) return;
        setName(n ?? "");
        setInitial(n ?? "");
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  const trimmed = name.trim();
  const dirty = loaded && trimmed.length >= 2 && trimmed !== initial;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await setDisplayName(trimmed);
      setInitial(trimmed);
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes("duplicate")
          ? "Name bereits vergeben."
          : err instanceof Error
            ? err.message
            : "Fehler",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="py-3">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-muted hover:text-ink"
      >
        ← Zurück
      </button>
      <h1 className="mt-2 text-xl font-bold text-ink">Profil</h1>

      <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
        <label className="text-sm font-semibold text-ink">
          Anzeigename
        </label>
        <input
          required
          minLength={2}
          maxLength={24}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          disabled={!loaded}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent disabled:opacity-50"
        />
        <button
          disabled={busy || !dirty}
          className="rounded-lg bg-accent px-3 py-2 font-semibold text-accent-contrast disabled:opacity-50"
        >
          {saved ? "Gespeichert ✓" : "Speichern"}
        </button>
        {error && <p className="text-sm text-miss">{error}</p>}
        <p className="text-xs text-faint">
          2–24 Zeichen. Der Name ist eindeutig (Groß-/Kleinschreibung egal).
        </p>
      </form>
    </div>
  );
}
