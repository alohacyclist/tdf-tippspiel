import { useState } from "react";
import { supabase } from "../lib/supabase";

export function Login({ expired = false }: { expired?: boolean }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-2xl font-bold text-accent">
        ridtipp
      </h1>
      <p className="mb-6 text-muted">Anmelden per Magic-Link.</p>

      {expired && !sent && (
        <p className="mb-4 rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-warn">
          Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.
        </p>
      )}

      {sent ? (
        <p className="rounded-lg bg-surface2 p-4 text-ink">
          Link gesendet an <strong>{email}</strong>. Postfach prüfen.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="deine@email.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
          />
          <button
            disabled={busy}
            className="rounded-lg bg-accent px-3 py-2 font-semibold text-accent-contrast disabled:opacity-50"
          >
            {busy ? "…" : "Link senden"}
          </button>
          {error && <p className="text-sm text-miss">{error}</p>}
        </form>
      )}
    </div>
  );
}
