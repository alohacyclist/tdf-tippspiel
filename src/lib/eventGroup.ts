import type { Tour } from "./types";

// A championship (the Worlds) is several tours: one race, one startlist, one
// scoring weight each — tied together by tours.event_group. The UI treats such a
// group as ONE event: all its races are listed and tipped on a single page.

// Every race of the group `tour` belongs to, in schedule order (earliest first,
// undated last). A standalone race is a group of one, so callers need no branch.
export function groupTours(tours: Tour[], tour: Tour): Tour[] {
  if (!tour.event_group) return [tour];
  return tours
    .filter((t) => t.event_group === tour.event_group && t.year === tour.year)
    .sort(byStart);
}

export function byStart(a: Tour, b: Tour): number {
  if (!a.starts_at) return 1;
  if (!b.starts_at) return -1;
  return Date.parse(a.starts_at) - Date.parse(b.starts_at);
}

// What a page calls the current selection: the championship, or the single race.
export function eventName(tour: Tour): string {
  return tour.event_group_name ?? tour.name;
}

// Span of a whole group, in the shape tourStatus() reads — so a championship gets
// "Vorschau"/"Läuft" from its first and last race, not from whichever of its races
// happens to be selected.
export function eventSpan(group: Tour[]): {
  starts_at: string | null;
  ends_at: string | null;
} {
  const starts = group.map((t) => t.starts_at).filter((s): s is string => !!s);
  const ends = group.map((t) => t.ends_at).filter((s): s is string => !!s);
  return {
    starts_at: starts.sort()[0] ?? null,
    ends_at: ends.sort()[ends.length - 1] ?? null,
  };
}

// One entry per line in the race switcher: a standalone race, or a whole
// championship collapsed into a single line. `primary` is the race the app
// selects for the entry — the first one of the event; every page that cares about
// the whole event derives it again from tours.event_group.
export interface TourEntry {
  key: string;
  label: string;
  year: number;
  primary: Tour;
}

// Keyed per edition: groupTours() ties races together by group AND year, so two
// editions sharing a group slug stay two lines in the switcher.
export function entryKey(tour: Tour): string {
  return tour.event_group ? `${tour.year}:${tour.event_group}` : tour.id;
}

export function tourEntries(tours: Tour[]): TourEntry[] {
  const byKey = new Map<string, TourEntry>();
  const out: TourEntry[] = [];
  for (const t of tours) {
    const key = entryKey(t);
    const seen = byKey.get(key);
    if (!seen) {
      const entry = { key, label: eventName(t), year: t.year, primary: t };
      byKey.set(key, entry);
      out.push(entry);
    } else if (byStart(t, seen.primary) < 0) {
      seen.primary = t;
    }
  }
  return out;
}
