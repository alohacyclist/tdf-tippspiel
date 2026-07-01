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
  const [teamPick, setTeamPick] = useState<string | null>(null)
  const [reveal, setReveal] = useState<RevealedTip[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const isTtt = stage?.type === 'ttt'
  const started = isPast(stage?.start_time ?? null)
  const ridersById = useMemo(() => new Map(riders.map((r) => [r.id, r])), [riders])
  const activeRiders = useMemo(() => riders.filter((r) => r.is_active), [riders])
  const teams = useMemo(
    () =>
      [...new Set(activeRiders.map((r) => r.team).filter((t): t is string => !!t))].sort(),
    [activeRiders],
  )

  useEffect(() => {
    if (!stageId) return
    Promise.all([getStage(stageId), listRiders(tour.id), getMyStageTip(stageId, userId)])
      .then(([s, rs, tip]) => {
        setStage(s)
        setRiders(rs)
        setPick(tip?.rider_id ?? null)
        setTeamPick(tip?.team ?? null)
        if (s && isPast(s.start_time)) return listStageTips(stageId).then(setReveal)
      })
      .catch((e) => setError(e.message))
  }, [stageId, tour.id, userId])

  async function save() {
    if (!stageId) return
    const chosen = isTtt ? teamPick : pick
    if (!chosen) return
    setError(null)
    try {
      await saveStageTip({
        tourId: tour.id,
        userId,
        stageId,
        riderId: isTtt ? null : pick,
        team: isTtt ? teamPick : null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  if (error) return <p className="py-4 text-red-400">{error}</p>
  if (!stage) return <p className="py-4 text-slate-400">Laden…</p>

  const myRider = pick ? ridersById.get(pick) : null
  const dnf = !isTtt && myRider && !myRider.is_active
  const canSave = isTtt ? !!teamPick : !!pick

  return (
    <div className="py-3">
      <Link to="/" className="text-sm text-slate-400">
        ← Etappen
      </Link>
      <h1 className="mt-2 text-xl font-bold text-slate-100">
        Etappe {stage.number}
        {stage.start_city && stage.finish_city ? ` · ${stage.start_city} → ${stage.finish_city}` : ''}
        {isTtt && (
          <span className="ml-2 text-sm font-normal text-yellow-400">Mannschaftszeitfahren</span>
        )}
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
          <h2 className="mb-2 font-semibold text-slate-200">
            {isTtt ? 'Dein Team-Tipp (Sieger-Mannschaft)' : 'Dein Etappensieger-Tipp'}
          </h2>
          {dnf && (
            <p className="mb-2 rounded-lg bg-red-950 p-2 text-sm text-red-300">
              Dein getippter Fahrer ist ausgeschieden — bitte neu tippen.
            </p>
          )}
          {isTtt ? (
            <select
              value={teamPick ?? ''}
              onChange={(e) => setTeamPick(e.target.value || null)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-yellow-400"
            >
              <option value="">Mannschaft wählen…</option>
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          ) : (
            <RiderCombobox riders={activeRiders} value={pick} onSelect={setPick} />
          )}
          <button
            onClick={save}
            disabled={!canSave}
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
          {isTtt
            ? stage.winner_team && (
                <p className="mb-3 rounded-lg bg-green-950 p-2 text-sm text-green-300">
                  Sieger-Mannschaft: {stage.winner_team}
                </p>
              )
            : stage.winner_rider_id && (
                <p className="mb-3 rounded-lg bg-green-950 p-2 text-sm text-green-300">
                  Sieger: {ridersById.get(stage.winner_rider_id)?.name ?? '—'}
                </p>
              )}
          <ul className="flex flex-col gap-1">
            {reveal.map((t) => {
              const correct = isTtt
                ? stage.winner_team != null && t.team === stage.winner_team
                : stage.winner_rider_id === t.rider_id
              const label = isTtt ? (t.team ?? '—') : (t.rider?.name ?? '—')
              return (
                <li
                  key={t.id}
                  className="flex justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"
                >
                  <span className="text-slate-300">{t.player?.display_name ?? '—'}</span>
                  <span className={correct ? 'font-semibold text-green-400' : 'text-slate-200'}>
                    {label}
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
