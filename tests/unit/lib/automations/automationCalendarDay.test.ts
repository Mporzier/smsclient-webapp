import { describe, expect, it } from "vitest";
import {
  effectiveAnnualFixedDay,
  effectiveAutomationDayInMonth,
  isValidMonthDay,
  maxDayInMonth,
  monthRecurrenceAnchorFromWhen,
} from "@/lib/automations/automationCalendarDay";

describe("automationCalendarDay validation", () => {
  it("maxDayInMonth and isValidMonthDay", () => {
    expect(maxDayInMonth(2)).toBe(29);
    expect(maxDayInMonth(4)).toBe(30);
    expect(isValidMonthDay(2, 29)).toBe(true);
    expect(isValidMonthDay(2, 30)).toBe(false);
    expect(isValidMonthDay(4, 31)).toBe(false);
  });
});

describe("effectiveAutomationDayInMonth — modes touchant un jour du mois", () => {
  it("date fixe annuelle clamp février / 29 fév.", () => {
    expect(
      effectiveAutomationDayInMonth(2025, 2, {
        kind: "fixed_date",
        fixedMonth: 2,
        fixedDay: 29,
      }),
    ).toBe(28);
    expect(
      effectiveAutomationDayInMonth(2024, 2, {
        kind: "fixed_date",
        fixedMonth: 2,
        fixedDay: 29,
      }),
    ).toBe(29);
    expect(
      effectiveAutomationDayInMonth(2025, 4, {
        kind: "fixed_date",
        fixedMonth: 4,
        fixedDay: 31,
      }),
    ).toBeNull();
  });

  it("récurrence mensuelle first / last / fixed", () => {
    expect(
      effectiveAutomationDayInMonth(2025, 2, {
        kind: "recurring",
        recurrenceUnit: "months",
        recurrenceMonthDayKind: "first",
      }),
    ).toBe(1);
    expect(
      effectiveAutomationDayInMonth(2025, 2, {
        kind: "recurring",
        recurrenceUnit: "months",
        recurrenceMonthDayKind: "last",
      }),
    ).toBe(28);
    expect(
      effectiveAutomationDayInMonth(2025, 2, {
        kind: "recurring",
        recurrenceUnit: "months",
        recurrenceMonthDayKind: "fixed",
        fixedDay: 30,
      }),
    ).toBe(28);
  });

  it("tous les X mois avec ancrage dernier jour", () => {
    expect(
      effectiveAutomationDayInMonth(2025, 4, {
        kind: "recurring",
        recurrenceUnit: "months",
        recurrenceMonthDayKind: "last",
      }),
    ).toBe(30);
  });

  it("modes sans jour du mois", () => {
    expect(
      effectiveAutomationDayInMonth(2025, 2, {
        kind: "recurring",
        recurrenceUnit: "weeks",
        recurrenceWeekday: 1,
      }),
    ).toBeNull();
    expect(
      effectiveAutomationDayInMonth(2025, 2, {
        kind: "recurring",
        recurrenceUnit: "days",
        recurrenceInterval: 7,
      }),
    ).toBeNull();
    expect(
      effectiveAutomationDayInMonth(2025, 2, {
        kind: "birthday",
      }),
    ).toBeNull();
  });

  it("legacy monthly fixedDay sans kind", () => {
    expect(
      effectiveAutomationDayInMonth(2025, 2, {
        kind: "recurring",
        recurrenceUnit: "months",
        fixedDay: 30,
      }),
    ).toBe(28);
  });
});

describe("effectiveAnnualFixedDay", () => {
  it("aligne avec effectiveAutomationDayInMonth", () => {
    expect(effectiveAnnualFixedDay(2025, 2, 29)).toBe(28);
  });
});

describe("monthRecurrenceAnchorFromWhen", () => {
  it("first, last, day", () => {
    expect(monthRecurrenceAnchorFromWhen("first", "1")).toEqual({
      ok: true,
      recurrenceMonthDayKind: "first",
    });
    expect(monthRecurrenceAnchorFromWhen("last", "1")).toEqual({
      ok: true,
      recurrenceMonthDayKind: "last",
    });
    expect(monthRecurrenceAnchorFromWhen("day", "15")).toEqual({
      ok: true,
      recurrenceMonthDayKind: "fixed",
      fixedDay: 15,
    });
  });
});
