import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserSmsTemplateRow } from "@/lib/types/smsTemplate";
import { LIST_PAGE_SIZE } from "@/lib/supabase/postgrestChunk";

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

export async function fetchUserSmsTemplatesPage(
  supabase: SupabaseClient,
  userId: string,
  args: { offset: number; limit?: number; search?: string; includeTotal?: boolean },
): Promise<{
  data: UserSmsTemplateRow[];
  hasMore: boolean;
  totalCount?: number;
  error: Error | null;
}> {
  const limit = args.limit ?? LIST_PAGE_SIZE;
  const offset = Math.max(0, args.offset);
  const q = (args.search ?? "").trim();
  const includeTotal = args.includeTotal ?? offset === 0;

  let query = supabase
    .from("user_sms_templates")
    .select("*", { count: includeTotal ? "exact" : undefined })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    const safe = escapeIlike(q);
    const p = `"%${safe.replace(/"/g, '\\"')}%"`;
    query = query.or(`title.ilike.${p},description.ilike.${p},body.ilike.${p}`);
  }

  const { data, error, count } = await query;
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

export async function deleteUserSmsTemplate(
  supabase: SupabaseClient,
  userId: string,
  templateId: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("user_sms_templates")
    .delete()
    .eq("user_id", userId)
    .eq("id", templateId);

  return { error: error ? new Error(error.message) : null };
}
