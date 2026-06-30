import { supabase } from "./supabase";
import type {
  Classification,
  ClassificationTip,
  LeaderboardRow,
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

export async function listMyStageTips(
  tourId: string,
  userId: string,
): Promise<StageTip[]> {
  return unwrap(
    await supabase
      .from("stage_tips")
      .select("*")
      .eq("tour_id", tourId)
      .eq("user_id", userId),
  );
}

export async function saveStageTip(args: {
  tourId: string;
  userId: string;
  stageId: string;
  riderId: string;
}): Promise<void> {
  const res = await supabase.from("stage_tips").upsert(
    {
      tour_id: args.tourId,
      user_id: args.userId,
      stage_id: args.stageId,
      rider_id: args.riderId,
    },
    { onConflict: "user_id,stage_id" },
  );
  if (res.error) throw new Error(res.error.message);
}

export interface RevealedTip {
  id: string;
  user_id: string;
  rider_id: string;
  rider: { name: string; team: string | null } | null;
  player: { display_name: string | null } | null;
}

export async function listStageTips(stageId: string): Promise<RevealedTip[]> {
  return unwrap(
    await supabase
      .from("stage_tips")
      .select(
        "id, user_id, rider_id, rider:riders(name, team), player:profiles(display_name)",
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

export async function getLeaderboard(
  tourId: string,
): Promise<LeaderboardRow[]> {
  return unwrap(
    await supabase
      .from("leaderboard")
      .select("*")
      .eq("tour_id", tourId)
      .order("total_points", { ascending: false })
      .order("correct_winners", { ascending: false }),
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
