import catalog from "@/lib/types/automationCatalog.json";
import seed from "@/lib/types/marketingCalendarSeed.json";
import {
  isValidBusinessActivityId,
  normalizeBusinessActivityId,
} from "@/lib/types/businessActivity";
import type {
  MarketingCalendarEvent,
  MarketingCalendarEventType,
} from "@/lib/types/marketingCalendarEvent";

export type MarketingCalendarSeedEvent = {
  id: string;
  title: string;
  /** ISO date `YYYY-MM-DD` for {@link MARKETING_CALENDAR_SEED.calendarYear}. */
  date: string;
  type: MarketingCalendarEventType;
  note?: string;
  activityGroups?: string[];
  businessActivityIds?: string[];
};

export type MarketingCalendarSeedFile = {
  version: number;
  calendarYear: number;
  locale: string;
  activityGroupsSource?: string;
  events: MarketingCalendarSeedEvent[];
};

const ACTIVITY_GROUPS = catalog.activityGroups as Record<string, string[]>;

export const MARKETING_CALENDAR_SEED = seed as MarketingCalendarSeedFile;

function expandSeedTargets(event: MarketingCalendarSeedEvent): Set<string> {
  const ids = new Set<string>();
  for (const groupKey of event.activityGroups ?? []) {
    const members = ACTIVITY_GROUPS[groupKey];
    if (!members) continue;
    for (const memberId of members) {
      if (memberId === "*") ids.add("*");
      else ids.add(memberId);
    }
  }
  for (const memberId of event.businessActivityIds ?? []) {
    ids.add(memberId);
  }
  return ids;
}

/** Même logique que {@link automationMatchesActivity} pour le catalogue automatisations. */
export function marketingSeedEventMatchesActivity(
  event: MarketingCalendarSeedEvent,
  activityId: string,
): boolean {
  const canonical = normalizeBusinessActivityId(activityId);
  if (!canonical || !isValidBusinessActivityId(canonical)) return false;
  const targets = expandSeedTargets(event);
  if (targets.size === 0) return true;
  if (targets.has("*")) return true;
  return targets.has(canonical);
}

function isUniversalSeedEvent(event: MarketingCalendarSeedEvent): boolean {
  if (event.activityGroups?.includes("all")) return true;
  const hasGroups = (event.activityGroups?.length ?? 0) > 0;
  const hasIds = (event.businessActivityIds?.length ?? 0) > 0;
  return !hasGroups && !hasIds;
}

export function marketingCalendarSeedEventsForActivity(
  activityId: string | null | undefined,
): MarketingCalendarSeedEvent[] {
  const id = (activityId ?? "").trim();
  if (!id || !normalizeBusinessActivityId(id)) {
    return MARKETING_CALENDAR_SEED.events.filter(isUniversalSeedEvent);
  }
  return MARKETING_CALENDAR_SEED.events.filter((event) =>
    marketingSeedEventMatchesActivity(event, id),
  );
}

export function marketingCalendarSeedAsMarketingEvents(
  activityId: string | null | undefined,
): MarketingCalendarEvent[] {
  return marketingCalendarSeedEventsForActivity(activityId).map((event) => ({
    id: `seed:${event.id}`,
    title: event.title,
    date: event.date,
    type: event.type,
    note: event.note,
  }));
}
