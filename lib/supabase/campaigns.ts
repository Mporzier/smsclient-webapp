import type { SupabaseClient } from "@supabase/supabase-js";
import type { CampaignRowData, CampaignTargetContact, SmsCampaignStatus } from "@/lib/types/campaign";
import { smsPartsFor } from "@/lib/proto/smsUtils";
import {
  campaignSortToOrders,
  type ListSort,
} from "@/lib/proto/listSort";

export type SmsCampaignRecord = {
  id: string;
  user_id: string;
  title: string;
  sender: string;
  body: string;
  status: SmsCampaignStatus;
  send_mode: "now" | "sched";
  recipient_count: number;
  sms_segments: number;
  credits_estimated: number;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  target_contacts: CampaignTargetContact[] | null;
  target_groups: string[] | null;
};

function formatFrDate(iso: string, withTime: boolean): string {
  return new Date(iso).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime
      ? { hour: "2-digit", minute: "2-digit" }
      : {}),
  });
}

function recordToRow(r: SmsCampaignRecord): CampaignRowData {
  const createdLabel = formatFrDate(r.created_at, false);
  let sendLabel = "—";
  if (r.status === "sent" && r.sent_at) {
    sendLabel = formatFrDate(r.sent_at, true);
  } else if (r.status === "scheduled") {
    sendLabel = r.scheduled_at
      ? formatFrDate(r.scheduled_at, true)
      : "Programmée";
  } else if (r.status === "failed") {
    sendLabel = r.sent_at
      ? `Échec · ${formatFrDate(r.sent_at, true)}`
      : "Échec";
  }

  return {
    id: r.id,
    createdLabel,
    name: r.title.trim() || "Sans titre",
    recipients: r.recipient_count,
    status: r.status,
    sendLabel,
    creditsLabel: r.credits_estimated > 0 ? String(r.credits_estimated) : "—",
    sender: r.sender,
    body: r.body,
    sendMode: r.send_mode,
    createdAt: r.created_at,
    sentAt: r.sent_at,
    scheduledAt: r.scheduled_at,
    targetContacts: r.target_contacts ?? undefined,
    targetGroups: r.target_groups ?? undefined,
  };
}

export async function fetchSmsCampaigns(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: CampaignRowData[]; error: Error | null }> {
  const all: CampaignRowData[] = [];
  for (let offset = 0; ; offset += 50) {
    const { data, hasMore, error } = await fetchSmsCampaignsPage(supabase, userId, {
      offset,
      limit: 50,
      search: "",
    });
    if (error) {
      if (all.length > 0) break;
      return { data: [], error };
    }
    all.push(...data);
    if (!hasMore) break;
  }
  return { data: all, error: null };
}

function escapeIlike(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function fetchSmsCampaignsPage(
  supabase: SupabaseClient,
  userId: string,
  args: {
    offset: number;
    limit?: number;
    search?: string;
    includeTotal?: boolean;
    sort?: ListSort | null;
  },
): Promise<{
  data: CampaignRowData[];
  hasMore: boolean;
  totalCount?: number;
  error: Error | null;
}> {
  const limit = args.limit ?? 50;
  const offset = Math.max(0, args.offset);
  const q = (args.search ?? "").trim();
  const includeTotal = args.includeTotal ?? offset === 0;

  let query = supabase
    .from("sms_campaigns")
    .select("*", { count: includeTotal ? "exact" : undefined })
    .eq("user_id", userId);

  if (q) {
    const safe = escapeIlike(q);
    const p = `"%${safe.replace(/"/g, '\\"')}%"`;
    query = query.or(`title.ilike.${p},sender.ilike.${p},body.ilike.${p}`);
  }

  for (const o of campaignSortToOrders(args.sort)) {
    query = query.order(o.column, {
      ascending: o.ascending,
      nullsFirst: false,
    });
  }

  const { data, error, count } = await query.range(
    offset,
    offset + limit - 1,
  );
  if (error) {
    return { data: [], hasMore: false, error: new Error(error.message) };
  }
  const rows = (data ?? []) as SmsCampaignRecord[];
  return {
    data: rows.map(recordToRow),
    hasMore: rows.length === limit,
    totalCount: includeTotal && typeof count === "number" ? count : undefined,
    error: null,
  };
}

export type NewSmsCampaignInput = {
  title: string;
  sender: string;
  body: string;
  sendMode: "now" | "sched";
  recipientCount: number;
  scheduledAt?: string | null;
  targetContacts?: CampaignTargetContact[];
  targetGroups?: string[];
};

/**
 * Enregistre une campagne finalisée depuis l’assistant (MVP : pas d’envoi réel, snapshot des crédits).
 */
export async function insertSmsCampaign(
  supabase: SupabaseClient,
  userId: string,
  input: NewSmsCampaignInput,
): Promise<{ error: Error | null }> {
  const parts = Math.max(1, smsPartsFor(input.body));
  const credits = parts * Math.max(0, input.recipientCount);
  const isNow = input.sendMode === "now";
  const nowIso = new Date().toISOString();
  const defaultScheduledAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const scheduledAt = input.scheduledAt ?? defaultScheduledAt;

  const { error: ensureAccountError } = await supabase
    .from("sms_credits_accounts")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
  if (ensureAccountError) {
    return { error: new Error(ensureAccountError.message) };
  }

  const { data: accountRow, error: accountError } = await supabase
    .from("sms_credits_accounts")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (accountError) {
    return { error: new Error(accountError.message) };
  }

  const previousBalance = (accountRow as { balance: number }).balance ?? 0;
  if (previousBalance < credits) {
    return { error: new Error("Crédits insuffisants pour envoyer cette campagne.") };
  }
  const nextBalance = Math.max(0, previousBalance - credits);
  const { error: setBalanceError } = await supabase
    .from("sms_credits_accounts")
    .update({ balance: nextBalance })
    .eq("user_id", userId);
  if (setBalanceError) {
    return { error: new Error(setBalanceError.message) };
  }

  const { error } = await supabase.from("sms_campaigns").insert({
    user_id: userId,
    title: input.title.trim() || "Sans titre",
    sender: input.sender.trim() || "SMS",
    body: input.body,
    send_mode: input.sendMode,
    recipient_count: input.recipientCount,
    sms_segments: parts,
    credits_estimated: credits,
    status: isNow ? "sent" : "scheduled",
    sent_at: isNow ? nowIso : null,
    scheduled_at: isNow ? null : scheduledAt,
    target_contacts: input.targetContacts ?? null,
    target_groups: input.targetGroups ?? null,
  });

  if (error) {
    await supabase
      .from("sms_credits_accounts")
      .update({ balance: previousBalance })
      .eq("user_id", userId);
    return { error: new Error(error.message) };
  }
  return { error: null };
}
