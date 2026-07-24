import type { SupabaseClient } from "@supabase/supabase-js";
import { buildShortUrl } from "@/lib/proto/shortLinks";
import type { LinkRowData } from "@/lib/types/link";
import { LIST_PAGE_SIZE } from "@/lib/supabase/postgrestChunk";

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
  const all: LinkRowData[] = [];
  for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
    const { data, hasMore, error } = await fetchSmsLinksPage(supabase, userId, {
      offset,
      limit: LIST_PAGE_SIZE,
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

export async function fetchSmsLinksPage(
  supabase: SupabaseClient,
  userId: string,
  args: { offset: number; limit?: number; search?: string; includeTotal?: boolean },
): Promise<{
  data: LinkRowData[];
  hasMore: boolean;
  totalCount?: number;
  error: Error | null;
}> {
  const limit = args.limit ?? LIST_PAGE_SIZE;
  const offset = Math.max(0, args.offset);
  const q = (args.search ?? "").trim();
  const includeTotal = args.includeTotal ?? offset === 0;

  let query = supabase
    .from("sms_campaign_links")
    .select("*", { count: includeTotal ? "exact" : undefined })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    const safe = escapeIlike(q);
    const p = `"%${safe.replace(/"/g, '\\"')}%"`;
    query = query.or(
      `label.ilike.${p},original_url.ilike.${p},short_code.ilike.${p}`,
    );
  }

  const { data, error, count } = await query;
  if (error) {
    return { data: [], hasMore: false, error: new Error(error.message) };
  }

  const rows = (data ?? []) as SmsCampaignLinkRecord[];
  return {
    data: rows.map(recordToRow),
    hasMore: rows.length === limit,
    totalCount: includeTotal && typeof count === "number" ? count : undefined,
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
