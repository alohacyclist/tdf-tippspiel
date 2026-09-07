import type { Tour } from "./types";

export type TourStatus = "upcoming" | "running" | "finished" | "unknown";

// A stage's start_time is its départ, so the race is still on for the rest of that
// day. Anything past the last stage plus this grace period counts as finished.
const LAST_STAGE_GRACE_MS = 12 * 60 * 60 * 1000;

// Derived from the stage dates, never from tours.is_active: the schema permits only
// one active row at a time, so that flag marks the default selection — not which of
// the season's races is currently on.
export function tourStatus(tour: Tour, now = Date.now()): TourStatus {
  if (!tour.starts_at || !tour.ends_at) return "unknown";
  if (now < Date.parse(tour.starts_at)) return "upcoming";
  if (now <= Date.parse(tour.ends_at) + LAST_STAGE_GRACE_MS) return "running";
  return "finished";
}

// Editions grouped by year, newest first — keeps the switcher usable once several
// races per season have accumulated.
export function groupByYear(tours: Tour[]): [number, Tour[]][] {
  const byYear = new Map<number, Tour[]>();
  for (const t of tours) {
    byYear.set(t.year, [...(byYear.get(t.year) ?? []), t]);
  }
  return [...byYear.entries()].sort((a, b) => b[0] - a[0]);
}
