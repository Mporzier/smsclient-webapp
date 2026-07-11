export type StatsPeriodPreset = "today" | "week" | "month" | "year" | "custom";

export type StatsDateRange = { from: string; to: string };

export const STATS_PERIOD_PRESET_LABELS: Record<
  Exclude<StatsPeriodPreset, "custom">,
  string
> = {
  today: "Aujourd'hui",
  week: "Cette semaine",
  month: "Ce mois",
  year: "Cette année",
};

function fmtFr(iso: string) {
  const [yy, mm, dd] = iso.split("-");
  return `${dd}/${mm}/${yy}`;
}

export function formatStatsPeriodLabel(
  period: StatsPeriodPreset,
  from: string,
  to: string,
): string {
  if (period !== "custom") return STATS_PERIOD_PRESET_LABELS[period];
  return `${fmtFr(from)} → ${fmtFr(to)}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIsoDateLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function statsTodayRange(): StatsDateRange {
  const t = toIsoDateLocal(new Date());
  return { from: t, to: t };
}

/** Lundi → aujourd'hui (semaine en cours). */
export function statsWeekRange(): StatsDateRange {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - diffToMonday,
  );
  return { from: toIsoDateLocal(monday), to: toIsoDateLocal(now) };
}

export function statsMonthRange(): StatsDateRange {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  return { from: toIsoDateLocal(first), to: toIsoDateLocal(last) };
}

export function statsYearRange(): StatsDateRange {
  const now = new Date();
  const first = new Date(now.getFullYear(), 0, 1);
  return { from: toIsoDateLocal(first), to: toIsoDateLocal(now) };
}

export function statsPeriodRange(
  preset: Exclude<StatsPeriodPreset, "custom">,
): StatsDateRange {
  switch (preset) {
    case "today":
      return statsTodayRange();
    case "week":
      return statsWeekRange();
    case "month":
      return statsMonthRange();
    case "year":
      return statsYearRange();
  }
}
