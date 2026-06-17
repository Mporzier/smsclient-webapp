import type { SupabaseClient } from "@supabase/supabase-js";
import { buildShortUrl } from "@/lib/proto/shortLinks";
import type { LinkRowData } from "@/lib/types/link";

export type SmsCampaignLinkRecord = {
  id: string;
  user_id: string;
  campaign_id: string | null;
  label: string;
  original_url: string;
  short_code: string;
  click_count: number;
  created_at: string;
};

type CreateShortLinkRpcRow = {
  id: string;
  short_code: string;
  short_url: string;
  original_url: string;
  click_count: number;
  created_at: string;
};

function formatFrDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function recordToRow(r: SmsCampaignLinkRecord): LinkRowData {
  return {
    id: r.id,
    label: r.label.trim(),
    originalUrl: r.original_url,
    shortCode: r.short_code,
    shortUrl: buildShortUrl(r.short_code),
    clickCount: r.click_count,
    createdLabel: formatFrDate(r.created_at),
    campaignId: r.campaign_id,
  };
}

export async function fetchSmsLinks(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: LinkRowData[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("sms_campaign_links")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  return {
    data: (data as SmsCampaignLinkRecord[]).map(recordToRow),
    error: null,
  };
}

export async function createSmsShortLink(
  supabase: SupabaseClient,
  args: {
    originalUrl: string;
    campaignId?: string | null;
    label?: string;
  },
): Promise<{ data: LinkRowData | null; error: Error | null }> {
  const { data, error } = await supabase.rpc("create_sms_short_link", {
    p_original_url: args.originalUrl.trim(),
    p_campaign_id: args.campaignId ?? null,
    p_label: args.label?.trim() ?? "",
  });

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | CreateShortLinkRpcRow
    | undefined;
  if (!row?.id) {
    return { data: null, error: new Error("Création du lien impossible.") };
  }

  return {
    data: {
      id: row.id,
      label: args.label?.trim() ?? "",
      originalUrl: row.original_url,
      shortCode: row.short_code,
      shortUrl: row.short_url || buildShortUrl(row.short_code),
      clickCount: row.click_count ?? 0,
      createdLabel: formatFrDate(row.created_at),
      campaignId: args.campaignId ?? null,
    },
    error: null,
  };
}

export async function deleteSmsLink(
  supabase: SupabaseClient,
  userId: string,
  linkId: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("sms_campaign_links")
    .delete()
    .eq("user_id", userId)
    .eq("id", linkId);

  return { error: error ? new Error(error.message) : null };
}
