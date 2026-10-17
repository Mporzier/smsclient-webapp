import type { SupabaseClient } from "@supabase/supabase-js";
import { buildShortUrl } from "@/lib/proto/shortLinks";
import { normalizeSmsLinkIconId } from "@/lib/proto/smsLinkIcons";
import type { LinkRowData } from "@/lib/types/link";
import {
  LIST_PAGE_SIZE,
  POSTGREST_IN_CHUNK,
  chunkList,
  paginateRange,
} from "@/lib/supabase/postgrestChunk";
import { normalizeListFilters } from "@/lib/proto/listFilters";
import type { ColumnFiltersState } from "@tanstack/react-table";
import {
  linkSortToOrders,
  type ListSort,
} from "@/lib/proto/listSort";
import type { ListColumnFilter } from "@/lib/proto/listFilters";
import { applyLinkListFilters } from "@/lib/supabase/linkListFilters";
import { attachFilterQuery } from "@/lib/supabase/listFilterSql";

export type SmsCampaignLinkRecord = {
  id: string;
  user_id: string;
  campaign_id: string | null;
  label: string;
  description: string;
  original_url: string;
  short_code: string;
  click_count: number;
  created_at: string;
  icon: string;
};

type CreateShortLinkRpcRow = {
  id: string;
  short_code: string;
  short_url: string;
  original_url: string;
  click_count: number;
  created_at: string;
};

function formatCreatedLabels(iso: string): {
  createdDateLabel: string;
  createdTimeLabel: string;
  createdLabel: string;
} {
  const d = new Date(iso);
  const createdDateLabel = d.toLocaleDateString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const createdTimeLabel = d.toLocaleTimeString("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  });
  return {
    createdDateLabel,
    createdTimeLabel,
    createdLabel: `${createdDateLabel} ${createdTimeLabel}`,
  };
}

function recordToRow(r: SmsCampaignLinkRecord): LinkRowData {
  const created = formatCreatedLabels(r.created_at);
  return {
    id: r.id,
    icon: normalizeSmsLinkIconId(r.icon),
    label: r.label.trim(),
    description: r.description?.trim() ?? "",
    originalUrl: r.original_url,
    shortCode: r.short_code,
    shortUrl: buildShortUrl(r.short_code),
    clickCount: r.click_count,
    ...created,
    campaignId: r.campaign_id,
  };
}

function applySmsLinksSearch<T extends { or: (filters: string) => T }>(
  query: T,
  rawSearch: string,
): T {
  const q = rawSearch.trim();
  if (!q) return query;
  const safe = escapeIlike(q);
  const p = `"%${safe.replace(/"/g, '\\"')}%"`;
  return query.or(
    `label.ilike.${p},description.ilike.${p},original_url.ilike.${p},short_code.ilike.${p}`,
  );
}

function linkFiltersFromState(
  filters?: ColumnFiltersState,
): ReturnType<typeof normalizeListFilters> {
  return normalizeListFilters(filters ?? []);
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
  args: {
    offset: number;
    limit?: number;
    search?: string;
    includeTotal?: boolean;
    sort?: ListSort | null;
    filters?: ListColumnFilter[];
  },
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
    .eq("user_id", userId);

  query = applySmsLinksSearch(query, q);

  query = attachFilterQuery(query, (q) =>
    applyLinkListFilters(q, args.filters ?? []),
  );

  for (const o of linkSortToOrders(args.sort)) {
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
    description?: string;
    icon?: string;
  },
): Promise<{ data: LinkRowData | null; error: Error | null }> {
  const { data, error } = await supabase.rpc("create_sms_short_link", {
    p_original_url: args.originalUrl.trim(),
    p_campaign_id: args.campaignId ?? null,
    p_label: args.label?.trim() ?? "",
    p_icon: normalizeSmsLinkIconId(args.icon),
    p_description: args.description?.trim() ?? "",
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
      icon: normalizeSmsLinkIconId(args.icon),
      label: args.label?.trim() ?? "",
      description: args.description?.trim() ?? "",
      originalUrl: row.original_url,
      shortCode: row.short_code,
      shortUrl: row.short_url || buildShortUrl(row.short_code),
      clickCount: row.click_count ?? 0,
      ...formatCreatedLabels(row.created_at),
      campaignId: args.campaignId ?? null,
    },
    error: null,
  };
}

export async function countMatchingSmsLinks(
  supabase: SupabaseClient,
  userId: string,
  args: { search?: string; filters?: ColumnFiltersState } = {},
): Promise<{ count: number; error: Error | null }> {
  let query = supabase
    .from("sms_campaign_links")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  query = applySmsLinksSearch(query, args.search ?? "");
  query = attachFilterQuery(query, (q) =>
    applyLinkListFilters(q, linkFiltersFromState(args.filters)),
  );
  const { count, error } = await query;
  if (error) return { count: 0, error: new Error(error.message) };
  return { count: typeof count === "number" ? count : 0, error: null };
}

export async function fetchMatchingSmsLinkIds(
  supabase: SupabaseClient,
  userId: string,
  args: { search?: string; filters?: ColumnFiltersState } = {},
): Promise<{ data: string[]; error: Error | null }> {
  const page = await paginateRange<{ id: string }>(async (from, to) => {
    let query = supabase
      .from("sms_campaign_links")
      .select("id")
      .eq("user_id", userId);
    query = applySmsLinksSearch(query, args.search ?? "");
    query = attachFilterQuery(query, (q) =>
      applyLinkListFilters(q, linkFiltersFromState(args.filters)),
    );
    const res = await query.order("id", { ascending: true }).range(from, to);
    return {
      data: (res.data as { id: string }[] | null) ?? null,
      error: res.error,
    };
  });
  if (page.error) return { data: page.data.map((r) => r.id), error: page.error };
  return { data: page.data.map((r) => r.id), error: null };
}

export async function deleteSmsLink(
  supabase: SupabaseClient,
  userId: string,
  linkId: string,
): Promise<{ error: Error | null }> {
  return deleteSmsLinks(supabase, userId, [linkId]);
}

export async function deleteSmsLinks(
  supabase: SupabaseClient,
  userId: string,
  ids: string[],
): Promise<{ error: Error | null }> {
  if (ids.length === 0) return { error: null };
  for (const batch of chunkList(ids, POSTGREST_IN_CHUNK)) {
    const { error } = await supabase
      .from("sms_campaign_links")
      .delete()
      .eq("user_id", userId)
      .in("id", batch);
    if (error) return { error: new Error(error.message) };
  }
  return { error: null };
}
