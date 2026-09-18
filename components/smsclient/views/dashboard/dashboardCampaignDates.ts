import type { CampaignRowData } from "@/lib/types/campaign";
import type {
  MarketingCalendarEvent,
  MarketingCalendarEventType,
} from "@/lib/types/marketingCalendarEvent";
import { isSameDay, parseISO, startOfDay } from "date-fns";

export type DashboardCalendarDayItem =
  | {
      source: "campaign";
      id: string;
      name: string;
      date: Date;
      kind: "scheduled" | "past";
    }
  | {
      source: "marketing";
      id: string;
      name: string;
      date: Date;
      eventType: MarketingCalendarEventType;
      note?: string;
      /** `seed` = catalogue statique ; `user` = Supabase. */
      origin: "user" | "seed";
    };

export function calendarCampaignsFromRows(
  rows: CampaignRowData[],
): DashboardCalendarDayItem[] {
  const items: DashboardCalendarDayItem[] = [];

  for (const row of rows) {
    if (row.status === "scheduled" && row.scheduledAt) {
      const date = new Date(row.scheduledAt);
      if (!Number.isNaN(date.getTime())) {
        items.push({
          source: "campaign",
          id: row.id,
          name: row.name,
          date,
          kind: "scheduled",
        });
      }
      continue;
    }
    if (row.status === "sent" && row.sentAt) {
      const date = new Date(row.sentAt);
      if (!Number.isNaN(date.getTime())) {
        items.push({
          source: "campaign",
          id: row.id,
          name: row.name,
          date,
          kind: "past",
        });
      }
    }
  }

  return items;
}

export function calendarItemsFromMarketingEvents(
  events: MarketingCalendarEvent[],
): DashboardCalendarDayItem[] {
  const items: DashboardCalendarDayItem[] = [];
  for (const event of events) {
    const date = parseISO(event.date);
    if (Number.isNaN(date.getTime())) continue;
    const origin = event.id.startsWith("seed:") ? "seed" : "user";
    items.push({
      source: "marketing",
      id: event.id,
      name: event.title,
      date,
      eventType: event.type,
      note: event.note,
      origin,
    });
  }
  return items;
}

export function mergeDashboardCalendarItems(
  campaigns: CampaignRowData[],
  marketingEvents: MarketingCalendarEvent[],
  seedMarketingEvents: MarketingCalendarEvent[] = [],
): DashboardCalendarDayItem[] {
  const seenSeed = new Set<string>();
  const dedupedSeed = seedMarketingEvents.filter((event) => {
    if (seenSeed.has(event.id)) return false;
    seenSeed.add(event.id);
    return true;
  });
  const userOnly = marketingEvents.filter((event) => !event.id.startsWith("seed:"));

  return [
    ...calendarCampaignsFromRows(campaigns),
    ...calendarItemsFromMarketingEvents(dedupedSeed),
    ...calendarItemsFromMarketingEvents(userOnly),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function campaignsOnDay(
  items: DashboardCalendarDayItem[],
  day: Date,
): DashboardCalendarDayItem[] {
  return items.filter((item) => isSameDay(item.date, day));
}

export function dayKey(date: Date): number {
  return startOfDay(date).getTime();
}

export function campaignsByDayKey(
  items: DashboardCalendarDayItem[],
): Map<number, DashboardCalendarDayItem[]> {
  const map = new Map<number, DashboardCalendarDayItem[]>();
  for (const item of items) {
    const key = dayKey(item.date);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}
