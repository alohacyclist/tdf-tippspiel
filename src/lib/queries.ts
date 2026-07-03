import { supabase } from "./supabase";
import type {
  Classification,
  ClassificationTip,
  LeaderboardRow,
  ProfileRole,
  ProfileStatus,
  Question,
  QuestionAnswer,
  QuestionOption,
  QuestionResult,
  Rider,
  Stage,
  StageTip,
  Tour,
} from "./types";

function unwrap<T>(res: {
  data: unknown;
  error: { message: string } | null;
}): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export async function getActiveTour(): Promise<Tour | null> {
  return unwrap(
    await supabase
      .from("tours")
      .select("*")
      .eq("is_active", true)
      .maybeSingle(),
  );
}

export async function listStages(tourId: string): Promise<Stage[]> {
  return unwrap(
    await supabase
      .from("stages")
      .select("*")
      .eq("tour_id", tourId)
      .order("number"),
  );
}

export async function getStage(stageId: string): Promise<Stage | null> {
  return unwrap(
    await supabase.from("stages").select("*").eq("id", stageId).maybeSingle(),
  );
}

export async function listActiveRiders(tourId: string): Promise<Rider[]> {
  return unwrap(
    await supabase
      .from("riders")
      .select("*")
      .eq("tour_id", tourId)
      .eq("is_active", true)
      .order("name"),
  );
}

export async function listRiders(tourId: string): Promise<Rider[]> {
  return unwrap(
    await supabase
      .from("riders")
      .select("*")
      .eq("tour_id", tourId)
      .order("name"),
  );
}

export async function getMyStageTip(
  stageId: string,
  userId: string,
): Promise<StageTip | null> {
  return unwrap(
    await supabase
      .from("stage_tips")
      .select("*")
      .eq("stage_id", stageId)
      .eq("user_id", userId)
      .maybeSingle(),
  );
}

export async function saveStageTip(args: {
  tourId: string;
  userId: string;
  stageId: string;
  riderId?: string | null;
  team?: string | null;
}): Promise<void> {
  const res = await supabase.from("stage_tips").upsert(
    {
      tour_id: args.tourId,
      user_id: args.userId,
      stage_id: args.stageId,
      rider_id: args.riderId ?? null,
      team: args.team ?? null,
    },
    { onConflict: "user_id,stage_id" },
  );
  if (res.error) throw new Error(res.error.message);
}

export interface RevealedTip {
  id: string;
  user_id: string;
  rider_id: string | null;
  team: string | null;
  rider: { name: string; team: string | null } | null;
  player: { display_name: string | null } | null;
}

export async function listStageTips(stageId: string): Promise<RevealedTip[]> {
  return unwrap(
    await supabase
      .from("stage_tips")
      .select(
        "id, user_id, rider_id, team, rider:riders(name, team), player:profiles(display_name)",
      )
      .eq("stage_id", stageId),
  );
}

export async function listClassifications(
  tourId: string,
): Promise<Classification[]> {
  return unwrap(
    await supabase
      .from("classifications")
      .select("*")
      .eq("tour_id", tourId)
      .order("created_at"),
  );
}

export async function listMyClassificationTips(
  tourId: string,
  userId: string,
): Promise<ClassificationTip[]> {
  return unwrap(
    await supabase
      .from("classification_tips")
      .select("*")
      .eq("tour_id", tourId)
      .eq("user_id", userId),
  );
}

export async function saveClassificationTip(args: {
  tourId: string;
  userId: string;
  classificationId: string;
  slot: number;
  riderId: string;
}): Promise<void> {
  const res = await supabase.from("classification_tips").upsert(
    {
      tour_id: args.tourId,
      user_id: args.userId,
      classification_id: args.classificationId,
      slot: args.slot,
      rider_id: args.riderId,
    },
    { onConflict: "user_id,classification_id,slot" },
  );
  if (res.error) throw new Error(res.error.message);
}

export interface RevealedClsTip {
  id: string;
  user_id: string;
  rider_id: string;
  slot: number;
  rider: { name: string } | null;
  player: { display_name: string | null } | null;
}

export async function listClassificationTips(
  classificationId: string,
): Promise<RevealedClsTip[]> {
  return unwrap(
    await supabase
      .from("classification_tips")
      .select(
        "id, user_id, rider_id, slot, rider:riders(name), player:profiles(display_name)",
      )
      .eq("classification_id", classificationId)
      .order("slot"),
  );
}

export async function getDisplayName(userId: string): Promise<string | null> {
  const row = unwrap<{ display_name: string | null } | null>(
    await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle(),
  );
  return row?.display_name ?? null;
}

export interface PlayerStageTip {
  stage_id: string;
  rider_id: string | null;
  team: string | null;
  rider: { name: string } | null;
}

// RLS reveals another player's stage tip only at/after that stage's start.
export async function listPlayerStageTips(
  tourId: string,
  userId: string,
): Promise<PlayerStageTip[]> {
  return unwrap(
    await supabase
      .from("stage_tips")
      .select("stage_id, rider_id, team, rider:riders(name)")
      .eq("tour_id", tourId)
      .eq("user_id", userId),
  );
}

export interface PlayerClsTip {
  classification_id: string;
  slot: number;
  rider_id: string;
  rider: { name: string } | null;
}

// RLS reveals another player's classification tips only at/after the deadline.
export async function listPlayerClassificationTips(
  tourId: string,
  userId: string,
): Promise<PlayerClsTip[]> {
  return unwrap(
    await supabase
      .from("classification_tips")
      .select("classification_id, slot, rider_id, rider:riders(name)")
      .eq("tour_id", tourId)
      .eq("user_id", userId)
      .order("slot"),
  );
}

export interface AdminProfile {
  id: string;
  display_name: string | null;
  role: ProfileRole;
  status: ProfileStatus;
}

// Active members can already read all profiles (RLS); the admin UI shows role + status.
export async function listProfiles(): Promise<AdminProfile[]> {
  return unwrap(
    await supabase
      .from("profiles")
      .select("id, display_name, role, status")
      .order("display_name"),
  );
}

export async function getLeaderboard(
  tourId: string,
): Promise<LeaderboardRow[]> {
  return unwrap(
    await supabase
      .from("leaderboard")
      .select("*")
      .eq("tour_id", tourId)
      .order("stage_points", { ascending: false })
      .order("correct_winners", { ascending: false }),
  );
}

export interface QuestionWithOptions extends Question {
  options: QuestionOption[];
}

export async function listQuestions(
  tourId: string,
): Promise<QuestionWithOptions[]> {
  return unwrap(
    await supabase
      .from("question")
      .select("*, options:question_option(*)")
      .eq("tour_id", tourId)
      .order("sort_order"),
  );
}

export async function listMyAnswers(
  tourId: string,
  userId: string,
): Promise<QuestionAnswer[]> {
  return unwrap(
    await supabase
      .from("question_answer")
      .select("*")
      .eq("tour_id", tourId)
      .eq("user_id", userId),
  );
}

export async function saveQuestionAnswer(a: {
  tourId: string;
  userId: string;
  questionId: string;
  optionId?: string | null;
  boolValue?: boolean | null;
}): Promise<void> {
  const res = await supabase.from("question_answer").upsert(
    {
      tour_id: a.tourId,
      user_id: a.userId,
      question_id: a.questionId,
      option_id: a.optionId ?? null,
      bool_value: a.boolValue ?? null,
    },
    { onConflict: "user_id,question_id" },
  );
  if (res.error) throw new Error(res.error.message);
}

export interface RevealedAnswer {
  id: string;
  user_id: string;
  option_id: string | null;
  bool_value: boolean | null;
  option: { label: string } | null;
  player: { display_name: string | null } | null;
}

// RLS reveals other players' answers only at/after the (derived) deadline.
export async function listQuestionAnswers(
  questionId: string,
): Promise<RevealedAnswer[]> {
  return unwrap(
    await supabase
      .from("question_answer")
      .select(
        "id, user_id, option_id, bool_value, option:question_option(label), player:profiles(display_name)",
      )
      .eq("question_id", questionId),
  );
}

export async function getQuestionResult(
  questionId: string,
): Promise<QuestionResult | null> {
  return unwrap(
    await supabase
      .from("question_result")
      .select("*")
      .eq("question_id", questionId)
      .maybeSingle(),
  );
}

export async function setDisplayName(name: string): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Nicht eingeloggt");
  const res = await supabase
    .from("profiles")
    .update({ display_name: name })
    .eq("id", id);
  if (res.error) throw new Error(res.error.message);
}
