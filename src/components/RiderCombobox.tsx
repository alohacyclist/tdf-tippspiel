import { useMemo, useState } from 'react'
import type { Rider } from '../lib/types'

interface Props {
  riders: Rider[]
  value: string | null
  onSelect: (riderId: string) => void
  disabled?: boolean
  exclude?: Set<string>
}

export function RiderCombobox({ riders, value, onSelect, disabled, exclude }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const selected = riders.find((r) => r.id === value) ?? null

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return riders
      .filter((r) => !exclude?.has(r.id) || r.id === value)
      .filter((r) => !q || r.name.toLowerCase().includes(q) || (r.team ?? '').toLowerCase().includes(q))
      .slice(0, 40)
  }, [riders, query, exclude, value])

  if (disabled) {
    return (
      <div className="rounded-lg bg-slate-800 px-3 py-2 text-slate-200">
        {selected ? riderLabel(selected) : '—'}
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-yellow-400"
        placeholder={selected ? riderLabel(selected) : 'Fahrer suchen…'}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
      />
      {open && (
        <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
          {matches.length === 0 && <li className="px-3 py-2 text-slate-400">Kein Fahrer</li>}
          {matches.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className={`flex w-full flex-col items-start px-3 py-2 text-left hover:bg-slate-800 ${
                  r.id === value ? 'bg-slate-800' : ''
                }`}
                onClick={() => {
                  onSelect(r.id)
                  setQuery('')
                  setOpen(false)
                }}
              >
                <span className="text-slate-100">{r.name}</span>
                <span className="text-xs text-slate-400">{r.team ?? ''}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function riderLabel(r: Rider): string {
  return r.team ? `${r.name} · ${r.team}` : r.name
}
