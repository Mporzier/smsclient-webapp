import { e164ToFrDisplay } from "@/lib/proto/smsUtils";
import type { DeletedContactRow, DeletedGroupRow } from "@/lib/types/trash";
import type { SupabaseClient } from "@supabase/supabase-js";

function formatDeletedFr(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function fetchDeletedContacts(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: DeletedContactRow[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, first_name, last_name, phone_e164, group_label, deleted_at")
    .eq("user_id", userId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  const rows = data ?? [];
  return {
    data: rows.map((row) => {
      const firstName = row.first_name?.trim() ?? "";
      const lastName = row.last_name?.trim() ?? "";
      const name =
        [firstName, lastName].filter(Boolean).join(" ") || firstName || "—";
      return {
        id: row.id,
        name,
        phone: e164ToFrDisplay(row.phone_e164),
        groupsLabel: row.group_label?.trim() || "—",
        deletedLabel: formatDeletedFr(row.deleted_at as string),
      };
    }),
    error: null,
  };
}

export async function fetchDeletedGroups(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: DeletedGroupRow[]; error: Error | null }> {
  const { data: groups, error: gErr } = await supabase
    .from("client_groups")
    .select("id, name, description, deleted_at")
    .eq("user_id", userId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (gErr) {
    return { data: [], error: new Error(gErr.message) };
  }

  const list = groups ?? [];
  const groupIds = list.map((g) => g.id);
  const counts = new Map<string, number>();

  if (groupIds.length > 0) {
    const { data: members, error: mErr } = await supabase
      .from("client_group_members")
      .select("group_id, clients!inner(deleted_at)")
      .in("group_id", groupIds);

    if (mErr) {
      return { data: [], error: new Error(mErr.message) };
    }

    for (const row of members ?? []) {
      const client = row.clients as { deleted_at: string | null } | { deleted_at: string | null }[];
      const deletedAt = Array.isArray(client) ? client[0]?.deleted_at : client?.deleted_at;
      if (deletedAt) continue;
      const gid = row.group_id as string;
      counts.set(gid, (counts.get(gid) ?? 0) + 1);
    }
  }

  return {
    data: list.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description?.trim() ?? "",
      contactCount: counts.get(g.id) ?? 0,
      deletedLabel: formatDeletedFr(g.deleted_at as string),
    })),
    error: null,
  };
}

export async function restoreClients(
  supabase: SupabaseClient,
  userId: string,
  ids: string[],
): Promise<{ restored: number; error: Error | null }> {
  if (ids.length === 0) return { restored: 0, error: null };

  const { data, error } = await supabase
    .from("clients")
    .update({ deleted_at: null })
    .eq("user_id", userId)
    .in("id", ids)
    .not("deleted_at", "is", null)
    .select("id");

  if (error) {
    if (error.code === "23505") {
      return {
        restored: 0,
        error: new Error(
          "Impossible de restaurer : un contact actif utilise déjà ce numéro.",
        ),
      };
    }
    return { restored: 0, error: new Error(error.message) };
  }

  return { restored: data?.length ?? 0, error: null };
}

export async function restoreGroups(
  supabase: SupabaseClient,
  userId: string,
  ids: string[],
): Promise<{ restored: number; error: Error | null }> {
  if (ids.length === 0) return { restored: 0, error: null };

  const { data, error } = await supabase
    .from("client_groups")
    .update({ deleted_at: null })
    .eq("user_id", userId)
    .in("id", ids)
    .not("deleted_at", "is", null)
    .select("id");

  if (error) {
    if (error.code === "23505") {
      return {
        restored: 0,
        error: new Error(
          "Impossible de restaurer : un groupe actif porte déjà ce nom.",
        ),
      };
    }
    return { restored: 0, error: new Error(error.message) };
  }

  return { restored: data?.length ?? 0, error: null };
}
