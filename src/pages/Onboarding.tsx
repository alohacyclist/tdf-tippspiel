import { useState } from 'react'
import { setDisplayName } from '../lib/queries'

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await setDisplayName(name.trim())
      await onDone()
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes('duplicate')
          ? 'Name bereits vergeben.'
          : err instanceof Error
            ? err.message
            : 'Fehler',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-6">
      <h1 className="mb-4 text-xl font-bold text-yellow-400">Anzeigename wählen</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          required
          minLength={2}
          maxLength={24}
          placeholder="z.B. Bergziege"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-yellow-400"
        />
        <button
          disabled={busy}
          className="rounded-lg bg-yellow-400 px-3 py-2 font-semibold text-slate-900 disabled:opacity-50"
        >
          Weiter
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>
    </div>
  )
}
