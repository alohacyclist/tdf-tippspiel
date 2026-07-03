import { useOutletContext } from "react-router-dom";
import type { Tour } from "./types";

export interface AppCtx {
  tour: Tour;
  userId: string;
  isAdmin: boolean;
  canEdit: boolean;
  refreshProfile: () => Promise<void>;
}

export const useApp = () => useOutletContext<AppCtx>();
