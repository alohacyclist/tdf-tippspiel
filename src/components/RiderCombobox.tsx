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
      <div className="rounded-lg bg-surface2 px-3 py-2 text-ink">
        {selected ? riderLabel(selected) : '—'}
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
        placeholder={selected ? riderLabel(selected) : 'Fahrer suchen…'}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
      />
      {open && (
        <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-line bg-surface shadow-xl">
          {matches.length === 0 && <li className="px-3 py-2 text-muted">Kein Fahrer</li>}
          {matches.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className={`flex w-full flex-col items-start px-3 py-2 text-left hover:bg-surface2 ${
                  r.id === value ? 'bg-surface2' : ''
                }`}
                onClick={() => {
                  onSelect(r.id)
                  setQuery('')
                  setOpen(false)
                }}
              >
                <span className="text-ink">{r.name}</span>
                <span className="text-xs text-muted">{r.team ?? ''}</span>
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
