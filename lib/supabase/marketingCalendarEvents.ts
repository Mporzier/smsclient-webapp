import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MarketingCalendarEvent,
  MarketingCalendarEventType,
} from "@/lib/types/marketingCalendarEvent";

export type MarketingCalendarEventRecord = {
  id: string;
  user_id: string;
  title: string;
  event_date: string;
  event_type: MarketingCalendarEventType;
  note: string | null;
  created_at: string;
};

function recordToEvent(row: MarketingCalendarEventRecord): MarketingCalendarEvent {
  const date =
    row.event_date.length >= 10
      ? row.event_date.slice(0, 10)
      : row.event_date;
  return {
    id: row.id,
    title: row.title.trim(),
    date,
    type: row.event_type,
    note: row.note?.trim() || undefined,
  };
}

export async function fetchMarketingCalendarEvents(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: MarketingCalendarEvent[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("marketing_calendar_events")
    .select("id, user_id, title, event_date, event_type, note, created_at")
    .eq("user_id", userId)
    .order("event_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  const rows = (data ?? []) as MarketingCalendarEventRecord[];
  return { data: rows.map(recordToEvent), error: null };
}

export async function insertMarketingCalendarEvent(
  supabase: SupabaseClient,
  userId: string,
  input: {
    title: string;
    date: string;
    type: MarketingCalendarEventType;
    note?: string;
  },
): Promise<{ data: MarketingCalendarEvent | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("marketing_calendar_events")
    .insert({
      user_id: userId,
      title: input.title.trim(),
      event_date: input.date,
      event_type: input.type,
      note: input.note?.trim() || null,
    })
    .select("id, user_id, title, event_date, event_type, note, created_at")
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return {
    data: recordToEvent(data as MarketingCalendarEventRecord),
    error: null,
  };
}
