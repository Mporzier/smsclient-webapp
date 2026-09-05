import type { SupabaseClient } from "@supabase/supabase-js";
import type { GroupRowData } from "@/lib/types/group";
import {
  groupSortToOrders,
  type ListSort,
} from "@/lib/proto/listSort";
import { type ListColumnFilter } from "@/lib/proto/listFilters";
import { applyGroupListFilters } from "@/lib/supabase/groupListFilters";
import { attachFilterQuery } from "@/lib/supabase/listFilterSql";
import {
  LIST_PAGE_SIZE,
  POSTGREST_IN_CHUNK,
  chunkList,
  paginateRange,
} from "@/lib/supabase/postgrestChunk";

export type ClientGroupRecord = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  last_campaign_at: string | null;
  created_at: string;
  member_count: number;
};

function formatDateFr(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Liste les groupes du compte avec le nombre de contacts (table de liaison `client_group_members`).
 * @deprecated Préférer `fetchGroupsPage` pour les listes UI.
 */
export async function fetchGroupsWithStats(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: GroupRowData[]; error: Error | null }> {
  const all: GroupRowData[] = [];
  for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
    const { data, hasMore, error } = await fetchGroupsPage(supabase, userId, {
      offset,
      limit: LIST_PAGE_SIZE,
      search: "",
      includeTotal: false,
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

function applyGroupListSearch<T extends { or: (filters: string) => T }>(
  query: T,
  search: string,
): T {
  const q = search.trim();
  if (!q) return query;
  const safe = escapeIlike(q);
  const p = `"%${safe.replace(/"/g, '\\"')}%"`;
  return query.or(`name.ilike.${p},description.ilike.${p}`);
}

export async function fetchGroupsPage(
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
  data: GroupRowData[];
  hasMore: boolean;
  totalCount?: number;
  error: Error | null;
}> {
  const limit = args.limit ?? LIST_PAGE_SIZE;
  const offset = Math.max(0, args.offset);
  const includeTotal = args.includeTotal ?? offset === 0;

  let query = supabase
    .from("client_groups")
    .select("id,name,description,last_campaign_at,created_at,member_count", {
      count: includeTotal ? "exact" : undefined,
    })
    .eq("user_id", userId)
    .is("deleted_at", null);

  query = applyGroupListSearch(query, args.search ?? "");
  query = attachFilterQuery(query, (q) =>
    applyGroupListFilters(q, args.filters ?? []),
  );

  for (const o of groupSortToOrders(args.sort)) {
    query = query.order(o.column, {
      ascending: o.ascending,
      nullsFirst: false,
    });
  }

  const { data: groups, error: gErr, count } = await query.range(
    offset,
    offset + limit - 1,
  );
  if (gErr) {
    return { data: [], hasMore: false, error: new Error(gErr.message) };
  }

  const list = (groups ?? []) as Pick<
    ClientGroupRecord,
    | "id"
    | "name"
    | "description"
    | "last_campaign_at"
    | "created_at"
    | "member_count"
  >[];

  const rows: GroupRowData[] = list.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description?.trim() ?? "",
    contactCount: g.member_count ?? 0,
    lastCampaignLabel: g.last_campaign_at
      ? formatDateFr(g.last_campaign_at)
      : "—",
    lastCampaignAt: g.last_campaign_at,
    createdLabel: formatDateFr(g.created_at),
    createdAt: g.created_at,
  }));

  return {
    data: rows,
    hasMore: list.length === limit,
    totalCount: includeTotal && typeof count === "number" ? count : undefined,
    error: null,
  };
}

export async function countMatchingGroups(
  supabase: SupabaseClient,
  userId: string,
  args: { search?: string; filters?: ListColumnFilter[] } = {},
): Promise<{ count: number; error: Error | null }> {
  let query = supabase
    .from("client_groups")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("deleted_at", null);
  query = applyGroupListSearch(query, args.search ?? "");
  query = attachFilterQuery(query, (q) =>
    applyGroupListFilters(q, args.filters ?? []),
  );
  const { count, error } = await query;
  if (error) return { count: 0, error: new Error(error.message) };
  return { count: typeof count === "number" ? count : 0, error: null };
}

export async function fetchMatchingGroups(
  supabase: SupabaseClient,
  userId: string,
  args: { search?: string; filters?: ListColumnFilter[] } = {},
): Promise<{ data: { id: string; name: string }[]; error: Error | null }> {
  return paginateRange<{ id: string; name: string }>(async (from, to) => {
    let query = supabase
      .from("client_groups")
      .select("id,name")
      .eq("user_id", userId)
      .is("deleted_at", null);
    query = applyGroupListSearch(query, args.search ?? "");
    query = attachFilterQuery(query, (q) =>
      applyGroupListFilters(q, args.filters ?? []),
    );
    const res = await query.order("id", { ascending: true }).range(from, to);
    return {
      data: (res.data as { id: string; name: string }[] | null) ?? null,
      error: res.error,
    };
  });
}

export async function insertClientGroup(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  description: string,
): Promise<{ error: Error | null }> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { error: new Error("Le nom du groupe est obligatoire.") };
  }

  const { error } = await supabase.from("client_groups").insert({
    user_id: userId,
    name: trimmed,
    description: description.trim(),
  });

  if (error) {
    if (error.code === "23505") {
      return {
        error: new Error("Un groupe avec ce nom existe déjà."),
      };
    }
    return { error: new Error(error.message) };
  }
  return { error: null };
}

export async function updateClientGroup(
  supabase: SupabaseClient,
  userId: string,
  groupId: string,
  payload: { name: string; description: string },
): Promise<{ error: Error | null }> {
  const trimmedName = payload.name.trim();
  if (!trimmedName) {
    return { error: new Error("Le nom du groupe est obligatoire.") };
  }
  const { error } = await supabase
    .from("client_groups")
    .update({
      name: trimmedName,
      description: payload.description.trim(),
    })
    .eq("id", groupId)
    .eq("user_id", userId);
  if (error) {
    if (error.code === "23505") {
      return { error: new Error("Un groupe avec ce nom existe déjà.") };
    }
    return { error: new Error(error.message) };
  }
  return { error: null };
}

export async function createClientGroupWithMembers(
  supabase: SupabaseClient,
  name: string,
  description: string,
  clientIds: string[],
): Promise<{ groupId: string | null; error: Error | null }> {
  const trimmed = name.trim();
  if (!trimmed) {
    return {
      groupId: null,
      error: new Error("Le nom du groupe est obligatoire."),
    };
  }

  const uniqueClientIds = [...new Set(clientIds)];
  const { data, error } = await supabase.rpc(
    "create_client_group_with_members",
    {
      p_name: trimmed,
      p_description: description.trim(),
      p_client_ids: uniqueClientIds,
    },
  );

  if (error) {
    if (error.code === "23505") {
      return {
        groupId: null,
        error: new Error("Un groupe avec ce nom existe déjà."),
      };
    }
    return { groupId: null, error: new Error(error.message) };
  }

  const groupId = typeof data === "string" ? data : null;
  if (!groupId) {
    return { groupId: null, error: new Error("Insertion sans identifiant.") };
  }
  return { groupId, error: null };
}

export async function deleteGroups(
  supabase: SupabaseClient,
  ids: string[],
): Promise<{ error: Error | null }> {
  if (ids.length === 0) return { error: null };
  const deletedAt = new Date().toISOString();
  for (const batch of chunkList(ids, POSTGREST_IN_CHUNK)) {
    const { error } = await supabase
      .from("client_groups")
      .update({ deleted_at: deletedAt })
      .in("id", batch)
      .is("deleted_at", null);
    if (error) return { error: new Error(error.message) };
  }
  return { error: null };
}
