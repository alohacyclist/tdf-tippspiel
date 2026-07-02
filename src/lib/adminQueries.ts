import { supabase } from "./supabase";

// All admin writes go through is_admin-gated SECURITY DEFINER RPCs (public schema).
// The browser never uses the service-role key; a tampered bundle still cannot write
// because require_admin() re-checks server-side.
async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export function adminCreateClassification(a: {
  tourId: string;
  key: string;
  name: string;
  type: string;
  slots: number;
  ordered: boolean;
  points: number | null;
  stageId?: string | null;
  deadline?: string | null;
}): Promise<string> {
  return rpc("admin_create_classification", {
    p_tour_id: a.tourId,
    p_key: a.key,
    p_name: a.name,
    p_type: a.type,
    p_slots: a.slots,
    p_ordered: a.ordered,
    p_points: a.points,
    p_stage_id: a.stageId ?? null,
    p_deadline: a.deadline ?? null,
  });
}

export function adminUpdateClassification(a: {
  id: string;
  name: string;
  points: number | null;
  isOpen: boolean;
  deadline?: string | null;
}): Promise<void> {
  return rpc("admin_update_classification", {
    p_id: a.id,
    p_name: a.name,
    p_points: a.points,
    p_is_open: a.isOpen,
    p_deadline: a.deadline ?? null,
  });
}

export function adminSetClassificationOpen(
  id: string,
  open: boolean,
): Promise<void> {
  return rpc("admin_set_classification_open", { p_id: id, p_open: open });
}

export function adminSetClassificationResults(
  id: string,
  riderIds: string[],
): Promise<void> {
  return rpc("admin_set_classification_results", {
    p_id: id,
    p_riders: riderIds,
  });
}

export function adminSetStageResult(a: {
  stageId: string;
  winnerRiderId?: string | null;
  winnerTeam?: string | null;
  close: boolean;
}): Promise<void> {
  return rpc("admin_set_stage_result", {
    p_stage_id: a.stageId,
    p_winner_rider_id: a.winnerRiderId ?? null,
    p_winner_team: a.winnerTeam ?? null,
    p_close: a.close,
  });
}
