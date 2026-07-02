import { useEffect, useRef } from "react";

// Re-runs `load` on an interval while `active`, and whenever the tab regains focus.
// Used to auto-refresh reveal data (results, winners, other players' picks) without a
// manual reload. Keep `active` false once the awaited value has arrived so it stops.
export function useAutoRefresh(
  load: () => void,
  active: boolean,
  intervalMs = 30000,
) {
  const ref = useRef(load);
  ref.current = load;

  useEffect(() => {
    if (!active) return;
    const run = () => ref.current();
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    const id = setInterval(run, intervalMs);
    window.addEventListener("focus", run);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", run);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, intervalMs]);
}
