import { useOutletContext } from 'react-router-dom'
import type { Tour } from './types'

export interface AppCtx {
  tour: Tour
  userId: string
}

export const useApp = () => useOutletContext<AppCtx>()
