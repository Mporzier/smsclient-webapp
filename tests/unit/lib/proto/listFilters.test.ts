import { describe, expect, it } from "vitest";
import {
  expandDatePreset,
  isListFilterValue,
  listFiltersKey,
  normalizeListFilters,
} from "@/lib/proto/listFilters";

describe("isListFilterValue", () => {
  it("accepts op-only empty filters", () => {
    expect(isListFilterValue({ op: "isEmpty" })).toBe(true);
  });
  it("rejects missing op", () => {
    expect(isListFilterValue({ value: "x" })).toBe(false);
  });
});

describe("normalizeListFilters", () => {
  it("drops unknown shape, empty string, empty array", () => {
    expect(
      normalizeListFilters([
        { id: "notes", value: { op: "contains", value: "  " } },
        { id: "source", value: { op: "in", value: [] } },
        { id: "notes", value: { op: "contains", value: "vip" } },
        { id: "select", value: { op: "contains", value: "x" } },
      ]),
    ).toEqual([{ id: "notes", op: "contains", value: "vip" }]);
  });

  it("keeps value-less ops", () => {
    expect(
      normalizeListFilters([{ id: "notes", value: { op: "isEmpty" } }]),
    ).toEqual([{ id: "notes", op: "isEmpty" }]);
  });

  it("drops select/actions/avatar ids", () => {
    expect(
      normalizeListFilters([
        { id: "actions", value: { op: "isNotEmpty" } },
      ]),
    ).toEqual([]);
  });
});

describe("expandDatePreset", () => {
  const now = new Date(2026, 8, 4, 15, 0, 0); // 4 sep 2026 local
  it("today -> on that civil day", () => {
    expect(expandDatePreset("today", now)).toEqual({
      op: "on",
      value: "2026-09-04",
    });
  });
  it("last7 inclusive 7 days", () => {
    expect(expandDatePreset("last7", now)).toEqual({
      op: "between",
      value: { from: "2026-08-29", to: "2026-09-04" },
    });
  });
  it("thisMonth is calendar month", () => {
    expect(expandDatePreset("thisMonth", now)).toEqual({
      op: "between",
      value: { from: "2026-09-01", to: "2026-09-30" },
    });
  });
});

describe("listFiltersKey", () => {
  it("stable for same filters", () => {
    const a = [{ id: "source", value: { op: "equals", value: "Import CSV" } }];
    expect(listFiltersKey(a)).toBe(listFiltersKey([...a]));
  });
});
