import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../lib/appContext'
import {
  getMyStageTip,
  getStage,
  listRiders,
  listStageTips,
  saveStageTip,
  type RevealedTip,
} from '../lib/queries'
import type { Rider, Stage } from '../lib/types'
import { formatLocal, isPast } from '../lib/time'
import { RiderCombobox } from '../components/RiderCombobox'
import { Countdown } from '../components/Countdown'

export function StageDetail() {
  const { stageId } = useParams()
  const { tour, userId } = useApp()
  const [stage, setStage] = useState<Stage | null>(null)
  const [riders, setRiders] = useState<Rider[]>([])
  const [pick, setPick] = useState<string | null>(null)
  const [reveal, setReveal] = useState<RevealedTip[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const started = isPast(stage?.start_time ?? null)
  const ridersById = useMemo(() => new Map(riders.map((r) => [r.id, r])), [riders])
  const activeRiders = useMemo(() => riders.filter((r) => r.is_active), [riders])

  useEffect(() => {
    if (!stageId) return
    Promise.all([getStage(stageId), listRiders(tour.id), getMyStageTip(stageId, userId)])
      .then(([s, rs, tip]) => {
        setStage(s)
        setRiders(rs)
        setPick(tip?.rider_id ?? null)
        if (s && isPast(s.start_time)) return listStageTips(stageId).then(setReveal)
      })
      .catch((e) => setError(e.message))
  }, [stageId, tour.id, userId])

  async function save() {
    if (!stageId || !pick) return
    setError(null)
    try {
      await saveStageTip({ tourId: tour.id, userId, stageId, riderId: pick })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  if (error) return <p className="py-4 text-red-400">{error}</p>
  if (!stage) return <p className="py-4 text-slate-400">Laden…</p>

  const myRider = pick ? ridersById.get(pick) : null
  const dnf = myRider && !myRider.is_active

  return (
    <div className="py-3">
      <Link to="/" className="text-sm text-slate-400">
        ← Etappen
      </Link>
      <h1 className="mt-2 text-xl font-bold text-slate-100">
        Etappe {stage.number}
        {stage.start_city && stage.finish_city ? ` · ${stage.start_city} → ${stage.finish_city}` : ''}
      </h1>
      <p className="text-sm text-slate-400">
        Start: {formatLocal(stage.start_time)}{' '}
        {!started && (
          <>
            (<Countdown iso={stage.start_time} />)
          </>
        )}
      </p>

      {!started ? (
        <div className="mt-5">
          <h2 className="mb-2 font-semibold text-slate-200">Dein Etappensieger-Tipp</h2>
          {dnf && (
            <p className="mb-2 rounded-lg bg-red-950 p-2 text-sm text-red-300">
              Dein getippter Fahrer ist ausgeschieden — bitte neu tippen.
            </p>
          )}
          <RiderCombobox riders={activeRiders} value={pick} onSelect={setPick} />
          <button
            onClick={save}
            disabled={!pick}
            className="mt-3 w-full rounded-lg bg-yellow-400 px-3 py-2 font-semibold text-slate-900 disabled:opacity-50"
          >
            {saved ? 'Gespeichert ✓' : 'Tipp speichern'}
          </button>
          <p className="mt-2 text-xs text-slate-500">
            Änderbar bis zum Start. Fremde Tipps werden erst ab Start sichtbar.
          </p>
        </div>
      ) : (
        <div className="mt-5">
          <h2 className="mb-2 font-semibold text-slate-200">Tipps & Ergebnis</h2>
          {stage.winner_rider_id && (
            <p className="mb-3 rounded-lg bg-green-950 p-2 text-sm text-green-300">
              Sieger: {ridersById.get(stage.winner_rider_id)?.name ?? '—'}
            </p>
          )}
          <ul className="flex flex-col gap-1">
            {reveal.map((t) => {
              const correct =
                stage.winner_rider_id === t.rider_id ||
                (stage.type === 'ttt' &&
                  stage.winner_team != null &&
                  t.rider?.team === stage.winner_team)
              return (
                <li
                  key={t.id}
                  className="flex justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"
                >
                  <span className="text-slate-300">{t.player?.display_name ?? '—'}</span>
                  <span className={correct ? 'font-semibold text-green-400' : 'text-slate-200'}>
                    {t.rider?.name ?? '—'}
                  </span>
                </li>
              )
            })}
            {reveal.length === 0 && <p className="text-slate-400">Keine Tipps abgegeben.</p>}
          </ul>
        </div>
      )}
    </div>
  )
}
