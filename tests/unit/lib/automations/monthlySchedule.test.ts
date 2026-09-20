import { describe, expect, it } from "vitest";
import {
  effectiveDayOfMonth,
  effectiveDayOfMonthForKind,
  lastDayOfMonth,
} from "@/lib/automations/monthlySchedule";
import { automationScheduleLabel } from "@/lib/automations/scheduleLabel";

describe("monthlySchedule", () => {
  it("lastDayOfMonth", () => {
    expect(lastDayOfMonth(2024, 2)).toBe(29);
    expect(lastDayOfMonth(2025, 2)).toBe(28);
    expect(lastDayOfMonth(2025, 4)).toBe(30);
  });

  it("effectiveDayOfMonth clamps to last day when month is shorter", () => {
    expect(effectiveDayOfMonth(2025, 2, 30)).toBe(28);
    expect(effectiveDayOfMonth(2024, 2, 30)).toBe(29);
    expect(effectiveDayOfMonth(2025, 4, 31)).toBe(30);
    expect(effectiveDayOfMonth(2025, 3, 15)).toBe(15);
  });

  it("effectiveDayOfMonthForKind first and last", () => {
    expect(effectiveDayOfMonthForKind(2025, 2, "first")).toBe(1);
    expect(effectiveDayOfMonthForKind(2025, 2, "last")).toBe(28);
    expect(effectiveDayOfMonthForKind(2024, 2, "last")).toBe(29);
  });
});

describe("automationScheduleLabel monthly", () => {
  it("includes day of month", () => {
    expect(
      automationScheduleLabel("recurring", {
        recurrenceUnit: "months",
        recurrenceInterval: 1,
        fixedDay: 30,
      }),
    ).toBe("Chaque mois le 30");
  });

  it("first and last labels", () => {
    expect(
      automationScheduleLabel("recurring", {
        recurrenceUnit: "months",
        recurrenceInterval: 1,
        recurrenceMonthDayKind: "first",
      }),
    ).toBe("Chaque mois (premier jour)");
    expect(
      automationScheduleLabel("recurring", {
        recurrenceUnit: "months",
        recurrenceInterval: 1,
        recurrenceMonthDayKind: "last",
      }),
    ).toBe("Chaque mois (dernier jour)");
  });
});
