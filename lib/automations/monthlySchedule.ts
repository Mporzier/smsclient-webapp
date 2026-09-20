import type { AutomationRecurrenceMonthDayKind } from "@/lib/types/automation";

/** Dernier jour calendaire d'un mois (month 1 = janvier). */
export function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Jour d'envoi effectif pour une récurrence « le N du mois » (N entre 1 et 31).
 * Si le mois est plus court (février, ou jour 31 en avril…), retourne le dernier jour du mois.
 */
export function effectiveDayOfMonth(
  year: number,
  month: number,
  targetDay: number,
): number {
  const day = Math.min(Math.max(1, Math.trunc(targetDay)), 31);
  return Math.min(day, lastDayOfMonth(year, month));
}

export const MONTHLY_SHORT_MONTH_HINT =
  "Si le mois compte moins de jours (ex. février), l'envoi a lieu le dernier jour du mois.";

export function effectiveDayOfMonthForKind(
  year: number,
  month: number,
  kind: AutomationRecurrenceMonthDayKind,
  fixedDay?: number | null,
): number {
  if (kind === "first") return 1;
  if (kind === "last") return lastDayOfMonth(year, month);
  return effectiveDayOfMonth(year, month, fixedDay ?? 1);
}
