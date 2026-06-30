import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-2xl font-bold text-yellow-400">Tour-Tippspiel</h1>
      <p className="mb-6 text-slate-400">Anmelden per Magic-Link.</p>

      {sent ? (
        <p className="rounded-lg bg-slate-800 p-4 text-slate-200">
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
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-yellow-400"
          />
          <button
            disabled={busy}
            className="rounded-lg bg-yellow-400 px-3 py-2 font-semibold text-slate-900 disabled:opacity-50"
          >
            {busy ? '…' : 'Link senden'}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
      )}
    </div>
  )
}
