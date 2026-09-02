import { e164ToFrDisplay } from "@/lib/proto/smsUtils";
import { trashPurgeAtIso } from "@/lib/proto/trashRetention";
import type {
  DeletedContactRow,
  DeletedGroupRow,
  TrashRestoreResult,
} from "@/lib/types/trash";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  POSTGREST_IN_CHUNK,
  POSTGREST_PAGE,
  chunkList,
} from "@/lib/supabase/postgrestChunk";

let deletedFrFormatter: Intl.DateTimeFormat | null = null;

function formatDeletedFr(iso: string): string {
  deletedFrFormatter ??= new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return deletedFrFormatter.format(new Date(iso));
}

function trashLabels(deletedAt: string): {
  deletedLabel: string;
  expiresLabel: string;
} {
  return {
    deletedLabel: formatDeletedFr(deletedAt),
    expiresLabel: formatDeletedFr(trashPurgeAtIso(deletedAt)),
  };
}

export async function fetchDeletedContacts(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: DeletedContactRow[]; error: Error | null }> {
  const rows: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone_e164: string;
    group_label: string | null;
    deleted_at: string;
  }[] = [];

  for (let from = 0; ; from += POSTGREST_PAGE) {
    const { data, error } = await supabase
      .from("clients")
      .select("id, first_name, last_name, phone_e164, group_label, deleted_at")
      .eq("user_id", userId)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + POSTGREST_PAGE - 1);

    if (error) {
      return { data: [], error: new Error(error.message) };
    }
    const page = data ?? [];
    rows.push(...(page as typeof rows));
    if (page.length < POSTGREST_PAGE) break;
  }

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
        ...trashLabels(row.deleted_at),
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
    for (const idChunk of chunkList(groupIds, POSTGREST_IN_CHUNK)) {
      for (let from = 0; ; from += POSTGREST_PAGE) {
        const { data: members, error: mErr } = await supabase
          .from("client_group_members")
          .select("group_id, clients!inner(deleted_at)")
          .in("group_id", idChunk)
          .is("clients.deleted_at", null)
          .order("group_id", { ascending: true })
          .order("client_id", { ascending: true })
          .range(from, from + POSTGREST_PAGE - 1);

        if (mErr) {
          return { data: [], error: new Error(mErr.message) };
        }

        const page = members ?? [];
        for (const row of page) {
          const gid = row.group_id as string;
          counts.set(gid, (counts.get(gid) ?? 0) + 1);
        }
        if (page.length < POSTGREST_PAGE) break;
      }
    }
  }

  return {
    data: list.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description?.trim() ?? "",
      contactCount: counts.get(g.id) ?? 0,
      ...trashLabels(g.deleted_at as string),
    })),
    error: null,
  };
}

/** Code Postgres unique_violation — numéro / nom déjà pris par une ligne active. */
const UNIQUE_VIOLATION = "23505";

type RestoreOutcome = TrashRestoreResult & { error: Error | null };

/**
 * Restaure ligne par ligne après un conflit d'unicité sur le lot : sinon un
 * seul doublon bloquerait toute la sélection.
 */
async function restoreOneByOne(
  supabase: SupabaseClient,
  table: "clients" | "client_groups",
  userId: string,
  ids: string[],
): Promise<RestoreOutcome> {
  let restored = 0;
  let duplicates = 0;

  for (const id of ids) {
    const { data, error } = await supabase
      .from(table)
      .update({ deleted_at: null })
      .eq("user_id", userId)
      .eq("id", id)
      .not("deleted_at", "is", null)
      .select("id");

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        duplicates += 1;
        continue;
      }
      return { restored, duplicates, error: new Error(error.message) };
    }
    restored += data?.length ?? 0;
  }

  return { restored, duplicates, error: null };
}

async function restoreRows(
  supabase: SupabaseClient,
  table: "clients" | "client_groups",
  userId: string,
  ids: string[],
): Promise<RestoreOutcome> {
  if (ids.length === 0) return { restored: 0, duplicates: 0, error: null };

  let restored = 0;
  let duplicates = 0;

  for (const batch of chunkList(ids, POSTGREST_IN_CHUNK)) {
    const { data, error } = await supabase
      .from(table)
      .update({ deleted_at: null })
      .eq("user_id", userId)
      .in("id", batch)
      .not("deleted_at", "is", null)
      .select("id");

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        const fallback = await restoreOneByOne(supabase, table, userId, batch);
        restored += fallback.restored;
        duplicates += fallback.duplicates;
        if (fallback.error) {
          return { restored, duplicates, error: fallback.error };
        }
        continue;
      }
      return { restored, duplicates, error: new Error(error.message) };
    }
    restored += data?.length ?? 0;
  }

  return { restored, duplicates, error: null };
}

export function restoreClients(
  supabase: SupabaseClient,
  userId: string,
  ids: string[],
): Promise<RestoreOutcome> {
  return restoreRows(supabase, "clients", userId, ids);
}

export function restoreGroups(
  supabase: SupabaseClient,
  userId: string,
  ids: string[],
): Promise<RestoreOutcome> {
  return restoreRows(supabase, "client_groups", userId, ids);
}
