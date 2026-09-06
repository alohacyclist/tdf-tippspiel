import { useCallback, useEffect, useState } from "react";

export type ThemeChoice = "system" | "light" | "dark";
const KEY = "ridtipp-theme";

function read(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

// "system" removes the attribute so the prefers-color-scheme block applies;
// an explicit choice stamps data-theme, which index.css lets win either way.
function apply(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
}

export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(read);

  useEffect(() => {
    apply(choice);
  }, [choice]);

  const cycle = useCallback(() => {
    setChoice((c) => {
      const next: ThemeChoice =
        c === "system" ? "light" : c === "light" ? "dark" : "system";
      try {
        if (next === "system") localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, next);
      } catch {
        /* storage unavailable — the choice just won't persist */
      }
      return next;
    });
  }, []);

  return { choice, cycle };
}
