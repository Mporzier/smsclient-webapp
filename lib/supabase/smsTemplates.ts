import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserSmsTemplateRow } from "@/lib/types/smsTemplate";
import {
  chunkList,
  LIST_PAGE_SIZE,
  paginateRange,
  POSTGREST_IN_CHUNK,
} from "@/lib/supabase/postgrestChunk";
import {
  templateSortToOrders,
  type ListSort,
} from "@/lib/proto/listSort";

export type UserSmsTemplateRecord = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  body: string;
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

function recordToRow(r: UserSmsTemplateRecord): UserSmsTemplateRow {
  return {
    id: r.id,
    title: r.title.trim(),
    description: r.description.trim(),
    body: r.body,
    createdLabel: formatFrDate(r.created_at),
  };
}

export async function fetchUserSmsTemplates(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: UserSmsTemplateRow[]; error: Error | null }> {
  const all: UserSmsTemplateRow[] = [];
  for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
    const { data, hasMore, error } = await fetchUserSmsTemplatesPage(
      supabase,
      userId,
      { offset, limit: LIST_PAGE_SIZE, search: "" },
    );
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

function applyTemplateListSearch<T extends { or: (filter: string) => T }>(
  query: T,
  search: string,
): T {
  const q = search.trim();
  if (!q) return query;
  const safe = escapeIlike(q);
  const p = `"%${safe.replace(/"/g, '\\"')}%"`;
  return query.or(`title.ilike.${p},description.ilike.${p},body.ilike.${p}`);
}

export async function fetchUserSmsTemplatesPage(
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
  data: UserSmsTemplateRow[];
  hasMore: boolean;
  totalCount?: number;
  error: Error | null;
}> {
  const limit = args.limit ?? LIST_PAGE_SIZE;
  const offset = Math.max(0, args.offset);
  const includeTotal = args.includeTotal ?? offset === 0;

  let query = supabase
    .from("user_sms_templates")
    .select("*", { count: includeTotal ? "exact" : undefined })
    .eq("user_id", userId);
  query = applyTemplateListSearch(query, args.search ?? "");

  for (const o of templateSortToOrders(args.sort)) {
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

  const rows = (data ?? []) as UserSmsTemplateRecord[];
  return {
    data: rows.map(recordToRow),
    hasMore: rows.length === limit,
    totalCount: includeTotal && typeof count === "number" ? count : undefined,
    error: null,
  };
}

export async function createUserSmsTemplate(
  supabase: SupabaseClient,
  userId: string,
  args: { title: string; description?: string; body: string },
): Promise<{ data: UserSmsTemplateRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("user_sms_templates")
    .insert({
      user_id: userId,
      title: args.title.trim(),
      description: args.description?.trim() ?? "",
      body: args.body.trim(),
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: recordToRow(data as UserSmsTemplateRecord), error: null };
}

export async function updateUserSmsTemplate(
  supabase: SupabaseClient,
  userId: string,
  templateId: string,
  args: { title: string; description?: string; body: string },
): Promise<{ data: UserSmsTemplateRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("user_sms_templates")
    .update({
      title: args.title.trim(),
      description: args.description?.trim() ?? "",
      body: args.body.trim(),
    })
    .eq("user_id", userId)
    .eq("id", templateId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: recordToRow(data as UserSmsTemplateRecord), error: null };
}

export async function countMatchingSmsTemplates(
  supabase: SupabaseClient,
  userId: string,
  args: { search?: string } = {},
): Promise<{ count: number; error: Error | null }> {
  let query = supabase
    .from("user_sms_templates")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  query = applyTemplateListSearch(query, args.search ?? "");
  const { count, error } = await query;
  if (error) return { count: 0, error: new Error(error.message) };
  return { count: typeof count === "number" ? count : 0, error: null };
}

export async function fetchMatchingSmsTemplateIds(
  supabase: SupabaseClient,
  userId: string,
  args: { search?: string } = {},
): Promise<{ data: string[]; error: Error | null }> {
  const page = await paginateRange<{ id: string }>(async (from, to) => {
    let query = supabase
      .from("user_sms_templates")
      .select("id")
      .eq("user_id", userId);
    query = applyTemplateListSearch(query, args.search ?? "");
    const res = await query.order("id", { ascending: true }).range(from, to);
    return {
      data: (res.data as { id: string }[] | null) ?? null,
      error: res.error,
    };
  });
  if (page.error) return { data: page.data.map((r) => r.id), error: page.error };
  return { data: page.data.map((r) => r.id), error: null };
}

export async function deleteUserSmsTemplate(
  supabase: SupabaseClient,
  userId: string,
  templateId: string,
): Promise<{ error: Error | null }> {
  return deleteUserSmsTemplates(supabase, userId, [templateId]);
}

export async function deleteUserSmsTemplates(
  supabase: SupabaseClient,
  userId: string,
  ids: string[],
): Promise<{ error: Error | null }> {
  if (ids.length === 0) return { error: null };
  for (const batch of chunkList(ids, POSTGREST_IN_CHUNK)) {
    const { error } = await supabase
      .from("user_sms_templates")
      .delete()
      .eq("user_id", userId)
      .in("id", batch);
    if (error) return { error: new Error(error.message) };
  }
  return { error: null };
}
