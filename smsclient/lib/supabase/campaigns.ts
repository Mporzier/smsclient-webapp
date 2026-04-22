import type { SupabaseClient } from "@supabase/supabase-js";
import type { CampaignRowData, SmsCampaignStatus } from "@/lib/types/campaign";
import { smsPartsFor } from "@/lib/proto/smsUtils";

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
  };
}

export async function fetchSmsCampaigns(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: CampaignRowData[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("sms_campaigns")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }
  const rows = (data ?? []) as SmsCampaignRecord[];
  return { data: rows.map(recordToRow), error: null };
}

export type NewSmsCampaignInput = {
  title: string;
  sender: string;
  body: string;
  sendMode: "now" | "sched";
  recipientCount: number;
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
    scheduled_at: isNow ? null : null,
  });

  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}
