import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../lib/appContext'
import { listMyStageTips, listStages } from '../lib/queries'
import type { Stage } from '../lib/types'
import { formatLocal, isPast } from '../lib/time'
import { Countdown } from '../components/Countdown'

export function Stages() {
  const { tour, userId } = useApp()
  const [stages, setStages] = useState<Stage[]>([])
  const [tipped, setTipped] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listStages(tour.id), listMyStageTips(tour.id, userId)])
      .then(([s, tips]) => {
        setStages(s)
        setTipped(new Set(tips.map((t) => t.stage_id)))
      })
      .catch((e) => setError(e.message))
  }, [tour.id, userId])

  if (error) return <p className="text-red-400">{error}</p>

  return (
    <ul className="flex flex-col gap-2 py-2">
      {stages.map((s) => {
        const started = isPast(s.start_time)
        return (
          <li key={s.id}>
            <Link
              to={`/stage/${s.id}`}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-3"
            >
              <div>
                <div className="font-semibold text-slate-100">
                  Etappe {s.number}
                  {s.start_city && s.finish_city ? ` · ${s.start_city} → ${s.finish_city}` : ''}
                </div>
                <div className="text-xs text-slate-400">{formatLocal(s.start_time)}</div>
              </div>
              <div className="text-right text-xs">
                {started ? (
                  <span className="text-slate-500">gestartet</span>
                ) : (
                  <span className="text-yellow-400">
                    <Countdown iso={s.start_time} />
                  </span>
                )}
                <div className={tipped.has(s.id) ? 'text-green-400' : 'text-slate-500'}>
                  {tipped.has(s.id) ? '✓ getippt' : 'kein Tipp'}
                </div>
              </div>
            </Link>
          </li>
        )
      })}
      {stages.length === 0 && <p className="text-slate-400">Noch keine Etappen.</p>}
    </ul>
  )
}
