import { describe, expect, it } from "vitest";
import type { Tour } from "./types";
import {
  entryKey,
  eventName,
  eventSpan,
  groupTours,
  tourEntries,
} from "./eventGroup";

function tour(p: Partial<Tour> & { id: string }): Tour {
  return {
    year: 2026,
    name: p.id,
    is_active: false,
    pcs_slug: p.id,
    kind: "one_day",
    event_group: null,
    event_group_name: null,
    starts_at: null,
    ends_at: null,
    ...p,
  };
}

const wm = (id: string, start: string) =>
  tour({
    id,
    event_group: "wm-2026",
    event_group_name: "WM Montréal 2026",
    starts_at: start,
    ends_at: start,
  });

const ittW = wm("itt-we", "2026-09-20T14:00:00Z");
const ittM = wm("itt", "2026-09-20T17:00:00Z");
const roadW = wm("road-we", "2026-09-26T14:00:00Z");
const roadM = wm("road", "2026-09-27T13:00:00Z");
const vuelta = tour({
  id: "vuelta",
  kind: "grand_tour",
  starts_at: "2026-08-22T15:00:00Z",
  ends_at: "2026-09-13T15:00:00Z",
});
// same group slug, different edition — must not be mixed in
const wm2027 = tour({
  id: "wm-2027",
  year: 2027,
  event_group: "wm-2026",
  event_group_name: "WM 2027",
});

const all = [wm2027, roadM, vuelta, ittM, roadW, ittW];

describe("groupTours", () => {
  it("returns every race of the championship in schedule order", () => {
    expect(groupTours(all, roadM).map((t) => t.id)).toEqual([
      "itt-we",
      "itt",
      "road-we",
      "road",
    ]);
  });

  it("is the same group whichever of its races is selected", () => {
    expect(groupTours(all, ittW)).toEqual(groupTours(all, roadM));
  });

  it("keeps editions apart", () => {
    expect(groupTours(all, wm2027).map((t) => t.id)).toEqual(["wm-2027"]);
  });

  it("treats a standalone race as a group of one", () => {
    expect(groupTours(all, vuelta).map((t) => t.id)).toEqual(["vuelta"]);
  });
});

describe("tourEntries", () => {
  it("collapses a championship into one switcher line", () => {
    const entries = tourEntries(all);
    expect(entries.map((e) => e.label)).toEqual([
      "WM 2027",
      "WM Montréal 2026",
      "vuelta",
    ]);
  });

  it("selects the first race of the event for the collapsed line", () => {
    const wmEntry = tourEntries(all).find(
      (e) => e.year === 2026 && e.primary.event_group,
    );
    expect(wmEntry?.primary.id).toBe("itt-we");
  });

  it("keys a grouped race by its group and a standalone race by its id", () => {
    expect(entryKey(roadM)).toBe("2026:wm-2026");
    expect(entryKey(vuelta)).toBe("vuelta");
  });
});

describe("eventSpan", () => {
  it("spans the first start to the last finish of the whole event", () => {
    expect(eventSpan(groupTours(all, roadM))).toEqual({
      starts_at: "2026-09-20T14:00:00Z",
      ends_at: "2026-09-27T13:00:00Z",
    });
  });
});

describe("eventName", () => {
  it("prefers the championship name over the single race", () => {
    expect(eventName(roadM)).toBe("WM Montréal 2026");
    expect(eventName(vuelta)).toBe("vuelta");
  });
});
