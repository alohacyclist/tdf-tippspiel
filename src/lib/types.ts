export type ProfileStatus = "pending" | "active" | "blocked";
export type ProfileRole = "member" | "editor" | "admin";

export interface Profile {
  id: string;
  display_name: string | null;
  status: ProfileStatus;
  role: ProfileRole;
}

export type TourKind = "grand_tour" | "one_day";

export interface Tour {
  id: string;
  year: number;
  name: string;
  is_active: boolean;
  pcs_slug: string;
  kind: TourKind;
  // earliest stage start (derived in listTours); null if no stages seeded yet.
  starts_at: string | null;
}

export type StageType = "flat" | "hilly" | "mountain" | "itt" | "ttt";
export type StageStatus = "upcoming" | "started" | "finished" | "void";

export interface Stage {
  id: string;
  tour_id: string;
  number: number;
  date: string | null;
  start_time: string | null;
  name: string | null;
  start_city: string | null;
  finish_city: string | null;
  type: StageType | null;
  distance_km: number | null;
  status: StageStatus;
  winner_rider_id: string | null;
  winner_team: string | null;
}

export interface Rider {
  id: string;
  tour_id: string;
  pcs_slug: string;
  name: string;
  team: string | null;
  country: string | null;
  bib: number | null;
  is_active: boolean;
  dnf_stage: number | null;
}

export interface StageTip {
  id: string;
  tour_id: string;
  user_id: string;
  stage_id: string;
  rider_id: string | null;
  team: string | null;
}

export type ClassificationType = "gc" | "points" | "kom" | "youth" | "custom";

export interface Classification {
  id: string;
  tour_id: string;
  stage_id: string | null;
  key: string;
  name: string;
  type: ClassificationType;
  slots: number;
  ordered: boolean;
  deadline: string | null;
  is_open: boolean;
  points: number | null;
}

export interface ClassificationTip {
  id: string;
  tour_id: string;
  user_id: string;
  classification_id: string;
  rider_id: string;
  slot: number;
}

export type QuestionKind = "boolean" | "choice";

export interface Question {
  id: string;
  tour_id: string;
  stage_id: string | null;
  kind: QuestionKind;
  prompt: string;
  help_text: string | null;
  points: number;
  deadline: string | null;
  is_open: boolean;
  is_resolved: boolean;
  sort_order: number;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  label: string;
  sort_order: number;
}

export interface QuestionAnswer {
  id: string;
  tour_id: string;
  user_id: string;
  question_id: string;
  option_id: string | null;
  bool_value: boolean | null;
}

export interface QuestionResult {
  question_id: string;
  option_id: string | null;
  bool_value: boolean | null;
}

export interface LeaderboardRow {
  tour_id: string;
  user_id: string;
  display_name: string | null;
  correct_winners: number;
  stage_points: number;
  special_points: number;
  question_points: number;
}

export interface SeasonLeaderboardRow {
  year: number;
  user_id: string;
  display_name: string | null;
  correct_winners: number;
  stage_points: number;
  special_points: number;
  question_points: number;
}
