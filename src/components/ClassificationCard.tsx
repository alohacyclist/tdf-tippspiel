import { useEffect, useMemo, useState } from 'react'
import {
  listClassificationTips,
  saveClassificationTip,
  type RevealedClsTip,
} from '../lib/queries'
import type { Classification, ClassificationTip, Rider } from '../lib/types'
import { formatLocal, isPast } from '../lib/time'
import { RiderCombobox } from './RiderCombobox'

interface Props {
  classification: Classification
  riders: Rider[]
  myTips: ClassificationTip[]
  tourId: string
  userId: string
}

export function ClassificationCard({ classification: c, riders, myTips, tourId, userId }: Props) {
  const initial = useMemo(() => {
    const m: Record<number, string> = {}
    myTips.forEach((t) => (m[t.slot] = t.rider_id))
    return m
  }, [myTips])

  const [picks, setPicks] = useState<Record<number, string>>(initial)
  const [reveal, setReveal] = useState<RevealedClsTip[]>([])
  const [error, setError] = useState<string | null>(null)

  const past = isPast(c.deadline)
  const editable = c.is_open && !past
  const activeRiders = useMemo(() => riders.filter((r) => r.is_active), [riders])

  useEffect(() => {
    if (past) listClassificationTips(c.id).then(setReveal).catch((e) => setError(e.message))
  }, [past, c.id])

  async function pickSlot(slot: number, riderId: string) {
    setError(null)
    const prev = picks
    setPicks({ ...picks, [slot]: riderId })
    try {
      await saveClassificationTip({ tourId, userId, classificationId: c.id, slot, riderId })
    } catch (e) {
      setPicks(prev)
      setError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  const slotLabel = (slot: number) =>
    c.ordered ? `Platz ${slot}` : c.name

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="font-semibold text-slate-100">{c.name}</h3>
        <span className="text-xs text-slate-500">
          {past ? 'aufgedeckt' : `bis ${formatLocal(c.deadline)}`}
        </span>
      </div>

      {editable ? (
        <div className="mt-2 flex flex-col gap-3">
          {Array.from({ length: c.slots }, (_, i) => i + 1).map((slot) => {
            const exclude = new Set(
              Object.entries(picks)
                .filter(([s]) => Number(s) !== slot)
                .map(([, r]) => r),
            )
            return (
              <div key={slot}>
                {c.ordered && <div className="mb-1 text-xs text-slate-400">{slotLabel(slot)}</div>}
                <RiderCombobox
                  riders={activeRiders}
                  value={picks[slot] ?? null}
                  exclude={exclude}
                  onSelect={(r) => pickSlot(slot, r)}
                />
              </div>
            )
          })}
        </div>
      ) : past ? (
        <RevealList reveal={reveal} ordered={c.ordered} />
      ) : (
        <p className="text-sm text-slate-400">Noch nicht geöffnet.</p>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}

function RevealList({ reveal, ordered }: { reveal: RevealedClsTip[]; ordered: boolean }) {
  const byPlayer = new Map<string, RevealedClsTip[]>()
  for (const t of reveal) {
    const arr = byPlayer.get(t.user_id) ?? []
    arr.push(t)
    byPlayer.set(t.user_id, arr)
  }
  if (byPlayer.size === 0) return <p className="text-sm text-slate-400">Keine Tipps.</p>
  return (
    <ul className="mt-1 flex flex-col gap-1">
      {[...byPlayer.values()].map((tips) => (
        <li key={tips[0].user_id} className="rounded-lg bg-slate-950 px-3 py-2 text-sm">
          <span className="text-slate-400">{tips[0].player?.display_name ?? '—'}: </span>
          <span className="text-slate-200">
            {tips
              .sort((a, b) => a.slot - b.slot)
              .map((t) => (ordered ? `${t.slot}. ${t.rider?.name}` : t.rider?.name))
              .join(', ')}
          </span>
        </li>
      ))}
    </ul>
  )
}
