import type { Stage } from "./types";

export interface WinnerTip {
  rider_id: string | null;
  team: string | null;
}

export function stageHasResult(stage: Stage): boolean {
  return stage.winner_rider_id != null || stage.winner_team != null;
}

export function stageWinnerMatch(stage: Stage, tip: WinnerTip): boolean {
  if (stage.type === "ttt")
    return stage.winner_team != null && tip.team === stage.winner_team;
  return stage.winner_rider_id != null && stage.winner_rider_id === tip.rider_id;
}

export function stageWinnerLabel(
  stage: Stage,
  riderName: Map<string, string>,
): string {
  if (stage.type === "ttt") return stage.winner_team ?? "—";
  return (stage.winner_rider_id && riderName.get(stage.winner_rider_id)) || "—";
}
