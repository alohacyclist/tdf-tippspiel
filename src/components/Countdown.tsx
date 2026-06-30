import { useEffect, useState } from 'react'
import { countdown } from '../lib/time'

export function Countdown({ iso }: { iso: string | null }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])
  return <span>{countdown(iso)}</span>
}
