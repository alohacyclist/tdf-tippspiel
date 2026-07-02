import { useOutletContext } from "react-router-dom";
import type { Tour } from "./types";

export interface AppCtx {
  tour: Tour;
  userId: string;
  isAdmin: boolean;
}

export const useApp = () => useOutletContext<AppCtx>();
