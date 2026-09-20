import type {
  AutomationKind,
  AutomationRecurrenceMonthDayKind,
  AutomationRecurrenceUnit,
} from "@/lib/types/automation";
import {
  effectiveDayOfMonthForKind,
  lastDayOfMonth,
} from "@/lib/automations/monthlySchedule";

/** Max jour pour un mois (février = 29, via année bissextile de référence). */
export function maxDayInMonth(month: number): number {
  const m = Math.min(Math.max(1, Math.trunc(month)), 12);
  return lastDayOfMonth(2000, m);
}

export function isValidMonthDay(month: number, day: number): boolean {
  const d = Math.trunc(day);
  return d >= 1 && d <= maxDayInMonth(month);
}

/** Date fixe annuelle : clamp au dernier jour du mois (29 fév. → 28 en année non bissextile). */
export function effectiveAnnualFixedDay(
  year: number,
  month: number,
  fixedDay: number,
): number {
  return effectiveDayOfMonthForKind(year, month, "fixed", fixedDay);
}

export function inferRecurrenceMonthDayKind(
  kind: AutomationRecurrenceMonthDayKind | null | undefined,
  fixedDay: number | null | undefined,
): AutomationRecurrenceMonthDayKind | null {
  if (kind === "first" || kind === "last" || kind === "fixed") return kind;
  if (fixedDay != null) return "fixed";
  return null;
}

export type AutomationCalendarParts = {
  kind: AutomationKind;
  fixedMonth?: number | null;
  fixedDay?: number | null;
  recurrenceUnit?: AutomationRecurrenceUnit | null;
  recurrenceMonthDayKind?: AutomationRecurrenceMonthDayKind | null;
};

/**
 * Jour d'envoi effectif dans un mois donné, ou null si le mode ne cible pas un jour du mois
 * (ex. hebdo, tous les X jours).
 */
export function effectiveAutomationDayInMonth(
  year: number,
  month: number,
  parts: AutomationCalendarParts,
): number | null {
  if (parts.kind === "fixed_date") {
    if (parts.fixedMonth !== month || parts.fixedDay == null) return null;
    return effectiveAnnualFixedDay(year, month, parts.fixedDay);
  }

  if (parts.kind !== "recurring" || parts.recurrenceUnit !== "months") {
    return null;
  }

  const monthDayKind = inferRecurrenceMonthDayKind(
    parts.recurrenceMonthDayKind,
    parts.fixedDay,
  );
  if (monthDayKind == null) return null;

  return effectiveDayOfMonthForKind(
    year,
    month,
    monthDayKind,
    parts.fixedDay,
  );
}

export type MonthRecurrenceAnchor =
  | { ok: true; recurrenceMonthDayKind: AutomationRecurrenceMonthDayKind; fixedDay?: number }
  | { ok: false; message: string };

/** Champs DB pour ancrage mensuel (chaque mois ou tous les X mois). */
export function monthRecurrenceAnchorFromWhen(
  when: "first" | "last" | "day",
  dayStr: string,
): MonthRecurrenceAnchor {
  if (when === "first") {
    return { ok: true, recurrenceMonthDayKind: "first" };
  }
  if (when === "last") {
    return { ok: true, recurrenceMonthDayKind: "last" };
  }
  const day = Number.parseInt(dayStr, 10);
  if (!Number.isFinite(day) || day < 1 || day > 31) {
    return { ok: false, message: "Choisissez un jour du mois." };
  }
  return {
    ok: true,
    recurrenceMonthDayKind: "fixed",
    fixedDay: day,
  };
}
