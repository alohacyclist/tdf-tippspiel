export type ProfileStatus = 'pending' | 'active' | 'blocked'

export interface Profile {
  id: string
  display_name: string | null
  status: ProfileStatus
  is_admin: boolean
}

export interface Tour {
  id: string
  year: number
  name: string
  is_active: boolean
}

export type StageType = 'flat' | 'hilly' | 'mountain' | 'itt' | 'ttt'
export type StageStatus = 'upcoming' | 'started' | 'finished' | 'void'

export interface Stage {
  id: string
  tour_id: string
  number: number
  date: string | null
  start_time: string | null
  name: string | null
  start_city: string | null
  finish_city: string | null
  type: StageType | null
  distance_km: number | null
  status: StageStatus
  winner_rider_id: string | null
  winner_team: string | null
}

export interface Rider {
  id: string
  tour_id: string
  pcs_slug: string
  name: string
  team: string | null
  country: string | null
  bib: number | null
  is_active: boolean
  dnf_stage: number | null
}

export interface StageTip {
  id: string
  tour_id: string
  user_id: string
  stage_id: string
  rider_id: string
}

export type ClassificationType = 'gc' | 'points' | 'kom' | 'youth' | 'custom'

export interface Classification {
  id: string
  tour_id: string
  key: string
  name: string
  type: ClassificationType
  slots: number
  ordered: boolean
  deadline: string
  is_open: boolean
}

export interface ClassificationTip {
  id: string
  tour_id: string
  user_id: string
  classification_id: string
  rider_id: string
  slot: number
}

export interface LeaderboardRow {
  tour_id: string
  user_id: string
  display_name: string | null
  total_points: number
  correct_winners: number
}
