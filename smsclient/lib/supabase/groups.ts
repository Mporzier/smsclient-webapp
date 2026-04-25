import type { SupabaseClient } from "@supabase/supabase-js";
import type { GroupRowData } from "@/lib/types/group";

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
 */
export async function fetchGroupsWithStats(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: GroupRowData[]; error: Error | null }> {
  const { data: groups, error: gErr } = await supabase
    .from("client_groups")
    .select("id,name,description,last_campaign_at,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (gErr) {
    return { data: [], error: new Error(gErr.message) };
  }

  const list = (groups ?? []) as Pick<
    ClientGroupRecord,
    "id" | "name" | "description" | "last_campaign_at" | "created_at"
  >[];

  const groupIds = list.map((g) => g.id);
  const counts = new Map<string, number>();
  if (groupIds.length > 0) {
    const { data: members, error: mErr } = await supabase
      .from("client_group_members")
      .select("group_id")
      .in("group_id", groupIds);

    if (mErr) {
      return { data: [], error: new Error(mErr.message) };
    }
    for (const row of members ?? []) {
      const gid = (row as { group_id: string }).group_id;
      counts.set(gid, (counts.get(gid) ?? 0) + 1);
    }
  }

  const rows: GroupRowData[] = list.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description?.trim() ?? "",
    contactCount: counts.get(g.id) ?? 0,
    lastCampaignLabel: g.last_campaign_at
      ? formatDateFr(g.last_campaign_at)
      : "—",
    createdLabel: formatDateFr(g.created_at),
  }));

  return { data: rows, error: null };
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
