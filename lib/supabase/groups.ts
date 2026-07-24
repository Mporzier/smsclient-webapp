import type { SupabaseClient } from "@supabase/supabase-js";
import type { GroupRowData } from "@/lib/types/group";
import {
  LIST_PAGE_SIZE,
  POSTGREST_IN_CHUNK,
  POSTGREST_PAGE,
  chunkList,
} from "@/lib/supabase/postgrestChunk";

export type ClientGroupRecord = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  last_campaign_at: string | null;
  created_at: string;
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

async function countMembersForGroups(
  supabase: SupabaseClient,
  groupIds: string[],
): Promise<{ counts: Map<string, number>; error: Error | null }> {
  const counts = new Map<string, number>();
  if (groupIds.length === 0) return { counts, error: null };

  for (const idChunk of chunkList(groupIds, POSTGREST_IN_CHUNK)) {
    for (let from = 0; ; from += POSTGREST_PAGE) {
      const { data: members, error: mErr } = await supabase
        .from("client_group_members")
        .select("group_id")
        .in("group_id", idChunk)
        .order("group_id", { ascending: true })
        .order("client_id", { ascending: true })
        .range(from, from + POSTGREST_PAGE - 1);

      if (mErr) {
        return { counts, error: new Error(mErr.message) };
      }
      const page = members ?? [];
      for (const row of page) {
        const gid = (row as { group_id: string }).group_id;
        counts.set(gid, (counts.get(gid) ?? 0) + 1);
      }
      if (page.length < POSTGREST_PAGE) break;
    }
  }
  return { counts, error: null };
}

export async function fetchGroupsPage(
  supabase: SupabaseClient,
  userId: string,
  args: {
    offset: number;
    limit?: number;
    search?: string;
    includeTotal?: boolean;
  },
): Promise<{
  data: GroupRowData[];
  hasMore: boolean;
  totalCount?: number;
  error: Error | null;
}> {
  const limit = args.limit ?? LIST_PAGE_SIZE;
  const offset = Math.max(0, args.offset);
  const q = (args.search ?? "").trim();
  const includeTotal = args.includeTotal ?? offset === 0;

  let query = supabase
    .from("client_groups")
    .select("id,name,description,last_campaign_at,created_at", {
      count: includeTotal ? "exact" : undefined,
    })
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  if (q) {
    const safe = escapeIlike(q);
    const p = `"%${safe.replace(/"/g, '\\"')}%"`;
    query = query.or(`name.ilike.${p},description.ilike.${p}`);
  }

  const { data: groups, error: gErr, count } = await query;
  if (gErr) {
    return { data: [], hasMore: false, error: new Error(gErr.message) };
  }

  const list = (groups ?? []) as Pick<
    ClientGroupRecord,
    "id" | "name" | "description" | "last_campaign_at" | "created_at"
  >[];

  const { counts, error: cErr } = await countMembersForGroups(
    supabase,
    list.map((g) => g.id),
  );
  if (cErr) {
    return { data: [], hasMore: false, error: cErr };
  }

  const rows: GroupRowData[] = list.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description?.trim() ?? "",
    contactCount: counts.get(g.id) ?? 0,
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
