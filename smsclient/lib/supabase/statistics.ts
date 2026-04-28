import { fetchGroupsWithStats } from "@/lib/supabase/groups";
import type { StatisticsSnapshot } from "@/lib/types/statistics";
import type { SupabaseClient } from "@supabase/supabase-js";

type SmsCampaignStatRecord = {
  created_at: string;
  status: "draft" | "scheduled" | "sent" | "failed" | "cancelled";
  recipient_count: number;
  credits_estimated: number;
};

function formatNumberFr(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function buildUtcRange(dateFrom: string, dateTo: string): { fromIso: string; toIso: string } {
  const fromIso = new Date(`${dateFrom}T00:00:00.000Z`).toISOString();
  const toIso = new Date(`${dateTo}T23:59:59.999Z`).toISOString();
  return { fromIso, toIso };
}

function formatSeriesLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function emptySnapshot(): StatisticsSnapshot {
  return {
    kpis: {
      smsSent: 0,
      deliveryRate: null,
      stopCount: 0,
      creditsConsumed: 0,
    },
    campaignSeries: [],
    topGroups: [],
  };
}

export async function fetchStatisticsSnapshot(
  supabase: SupabaseClient,
  userId: string,
  range: { from: string; to: string },
): Promise<{ data: StatisticsSnapshot; error: Error | null }> {
  const { fromIso, toIso } = buildUtcRange(range.from, range.to);

  const { data: campaignsRaw, error: campaignsError } = await supabase
    .from("sms_campaigns")
    .select("created_at,status,recipient_count,credits_estimated")
    .eq("user_id", userId)
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
    .order("created_at", { ascending: true });

  if (campaignsError) {
    return { data: emptySnapshot(), error: new Error(campaignsError.message) };
  }
  const campaigns = (campaignsRaw ?? []) as SmsCampaignStatRecord[];

  const { count: stopCount, error: stopsError } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("stop_sms", true);

  if (stopsError) {
    return { data: emptySnapshot(), error: new Error(stopsError.message) };
  }

  const groupsResult = await fetchGroupsWithStats(supabase, userId);
  if (groupsResult.error) {
    return { data: emptySnapshot(), error: groupsResult.error };
  }

  let smsSent = 0;
  let creditsConsumed = 0;
  let sentRecipients = 0;
  let failedRecipients = 0;
  const byDay = new Map<string, { sent: number; failed: number; scheduled: number }>();

  for (const c of campaigns) {
    const recipients = Math.max(0, c.recipient_count ?? 0);
    const credits = Math.max(0, c.credits_estimated ?? 0);
    const isoDay = c.created_at.slice(0, 10);
    const bucket = byDay.get(isoDay) ?? { sent: 0, failed: 0, scheduled: 0 };

    if (c.status === "sent") {
      smsSent += recipients;
      sentRecipients += recipients;
      creditsConsumed += credits;
      bucket.sent += recipients;
    } else if (c.status === "failed") {
      failedRecipients += recipients;
      creditsConsumed += credits;
      bucket.failed += recipients;
    } else if (c.status === "scheduled") {
      bucket.scheduled += recipients;
    }
    byDay.set(isoDay, bucket);
  }

  const deliveryDenominator = sentRecipients + failedRecipients;
  const deliveryRate =
    deliveryDenominator > 0
      ? Number(((sentRecipients / deliveryDenominator) * 100).toFixed(1))
      : null;

  const campaignSeries = Array.from(byDay.entries())
    .map(([isoDay, counts]) => ({
      label: formatSeriesLabel(isoDay),
      sent: counts.sent,
      failed: counts.failed,
      scheduled: counts.scheduled,
    }))
    .slice(-12);

  const topGroups = [...groupsResult.data]
    .sort((a, b) => b.contactCount - a.contactCount)
    .slice(0, 5)
    .map((g) => ({
      groupName: g.name,
      contacts: g.contactCount,
    }));

  return {
    data: {
      kpis: {
        smsSent,
        deliveryRate,
        stopCount: stopCount ?? 0,
        creditsConsumed,
      },
      campaignSeries,
      topGroups,
    },
    error: null,
  };
}

export function formatStatsNumber(value: number): string {
  return formatNumberFr(value);
}
