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

export function adminDeleteClassification(id: string): Promise<void> {
  return rpc("admin_delete_classification", { p_id: id });
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

// --- Free-form questions (Phase 2) ---

export function adminCreateQuestion(a: {
  tourId: string;
  kind: "boolean" | "choice";
  prompt: string;
  points: number;
  stageId?: string | null;
  deadline?: string | null;
  help?: string | null;
}): Promise<string> {
  return rpc("admin_create_question", {
    p_tour_id: a.tourId,
    p_kind: a.kind,
    p_prompt: a.prompt,
    p_points: a.points,
    p_stage_id: a.stageId ?? null,
    p_deadline: a.deadline ?? null,
    p_help: a.help ?? null,
  });
}

export function adminAddQuestionOption(
  questionId: string,
  label: string,
  sort: number,
): Promise<string> {
  return rpc("admin_add_question_option", {
    p_question_id: questionId,
    p_label: label,
    p_sort: sort,
  });
}

export function adminDeleteQuestionOption(optionId: string): Promise<void> {
  return rpc("admin_delete_question_option", { p_option_id: optionId });
}

export function adminUpdateQuestion(a: {
  id: string;
  prompt: string;
  points: number;
  isOpen: boolean;
  deadline?: string | null;
}): Promise<void> {
  return rpc("admin_update_question", {
    p_id: a.id,
    p_prompt: a.prompt,
    p_points: a.points,
    p_is_open: a.isOpen,
    p_deadline: a.deadline ?? null,
  });
}

export function adminSetQuestionOpen(id: string, open: boolean): Promise<void> {
  return rpc("admin_set_question_open", { p_id: id, p_open: open });
}

export function adminSetQuestionResult(a: {
  id: string;
  bool?: boolean | null;
  optionId?: string | null;
}): Promise<void> {
  return rpc("admin_set_question_result", {
    p_id: a.id,
    p_bool: a.bool ?? null,
    p_option_id: a.optionId ?? null,
  });
}

export function adminClearQuestionResult(id: string): Promise<void> {
  return rpc("admin_clear_question_result", { p_id: id });
}

export function adminDeleteQuestion(id: string): Promise<void> {
  return rpc("admin_delete_question", { p_id: id });
}
