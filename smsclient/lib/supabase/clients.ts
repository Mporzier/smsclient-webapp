import type { SupabaseClient } from "@supabase/supabase-js";
import {
  e164ToFrDisplay,
  frDisplayToE164,
} from "@/lib/proto/smsUtils";
import type { ContactRowData } from "@/lib/types/contact";

export type ClientRecord = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone_e164: string;
  /** Rétrocompat / miroir d’affichage (liste des noms de segments). */
  group_label: string;
  notes: string;
  source: string;
  opt_in: boolean;
  stop_sms: boolean;
  last_sms_sent_at: string | null;
  created_at: string;
};

export type ContactFormSubmitPayload = {
  firstName: string;
  lastName: string;
  phoneDisplay: string;
  /** Noms de segments (`client_groups.name`) — plusieurs possibles. */
  groupLabels: string[];
  notes: string;
  optIn: boolean;
  stop: boolean;
};

/** Libellés uniques, sans « Non classé ». */
export function normalizeGroupLabels(raw: string[]): string[] {
  const s = new Set<string>();
  for (const x of raw) {
    const t = x.trim();
    if (t && t !== "Non classé") s.add(t);
  }
  return Array.from(s).sort((a, b) => a.localeCompare(b, "fr"));
}

function mirrorGroupColumn(labels: string[]): string {
  const n = normalizeGroupLabels(labels);
  if (n.length === 0) return "Non classé";
  return n.join(", ").slice(0, 500);
}

function formatCreatedFr(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatLastSms(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function clientRecordToRow(
  row: ClientRecord,
  groups: string[],
): ContactRowData {
  const firstName = row.first_name.trim();
  const lastName = row.last_name.trim();
  const name =
    [firstName, lastName].filter(Boolean).join(" ") || firstName || "—";
  const mergedGroups =
    groups.length > 0
      ? normalizeGroupLabels(groups)
      : row.group_label.trim() &&
          row.group_label.trim() !== "Non classé"
        ? normalizeGroupLabels(
            row.group_label.split(",").map((x) => x.trim()),
          )
        : [];
  return {
    id: row.id,
    created: formatCreatedFr(row.created_at),
    firstName,
    lastName,
    name,
    phone: e164ToFrDisplay(row.phone_e164),
    groups: mergedGroups,
    notes: row.notes?.trim() ?? "",
    lastSms: formatLastSms(row.last_sms_sent_at),
    source: row.source,
    optIn: row.opt_in,
    stopSms: row.stop_sms,
  };
}

async function fetchMembershipsByClientIds(
  supabase: SupabaseClient,
  clientIds: string[],
): Promise<{ map: Map<string, string[]>; error: Error | null }> {
  const map = new Map<string, string[]>();
  if (clientIds.length === 0) {
    return { map, error: null };
  }
  const { data, error } = await supabase
    .from("client_group_members")
    .select("client_id, client_groups(name)")
    .in("client_id", clientIds);

  if (error) {
    return { map, error: new Error(error.message) };
  }
  for (const raw of data ?? []) {
    const row = raw as {
      client_id: string;
      client_groups:
        | { name: string }
        | { name: string }[]
        | null
        | undefined;
    };
    const cg = row.client_groups;
    const nameRaw = Array.isArray(cg) ? cg[0]?.name : cg?.name;
    const name = nameRaw?.trim();
    if (!name) continue;
    const list = map.get(row.client_id) ?? [];
    list.push(name);
    map.set(row.client_id, list);
  }
  for (const [k, v] of map) {
    map.set(k, normalizeGroupLabels(v));
  }
  return { map, error: null };
}

export async function fetchClients(
  supabase: SupabaseClient,
): Promise<{ data: ContactRowData[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }
  const rows = (data ?? []) as ClientRecord[];
  const ids = rows.map((r) => r.id);
  const { map: memMap, error: e2 } = await fetchMembershipsByClientIds(
    supabase,
    ids,
  );
  if (e2) {
    return { data: [], error: e2 };
  }
  return {
    data: rows.map((r) => clientRecordToRow(r, memMap.get(r.id) ?? [])),
    error: null,
  };
}

function payloadToE164(payload: ContactFormSubmitPayload): string {
  const e164 = frDisplayToE164(payload.phoneDisplay);
  if (!e164) {
    throw new Error("Numéro mobile français invalide.");
  }
  return e164;
}

async function syncClientGroupMemberships(
  supabase: SupabaseClient,
  userId: string,
  clientId: string,
  labels: string[],
): Promise<{ error: Error | null }> {
  const normalized = normalizeGroupLabels(labels);
  const { error: delErr } = await supabase
    .from("client_group_members")
    .delete()
    .eq("client_id", clientId);
  if (delErr) {
    return { error: new Error(delErr.message) };
  }
  if (normalized.length === 0) {
    return { error: null };
  }
  const { data: groups, error: gErr } = await supabase
    .from("client_groups")
    .select("id,name")
    .eq("user_id", userId);
  if (gErr) {
    return { error: new Error(gErr.message) };
  }
  const byName = new Map(
    (groups ?? []).map((g: { id: string; name: string }) => [g.name, g.id]),
  );
  const rows: { client_id: string; group_id: string }[] = [];
  for (const name of normalized) {
    const gid = byName.get(name);
    if (gid) {
      rows.push({ client_id: clientId, group_id: gid });
    }
  }
  if (rows.length === 0) {
    return { error: null };
  }
  const { error: insErr } = await supabase
    .from("client_group_members")
    .insert(rows);
  if (insErr) {
    return { error: new Error(insErr.message) };
  }
  return { error: null };
}

export async function insertClient(
  supabase: SupabaseClient,
  userId: string,
  payload: ContactFormSubmitPayload,
  options?: { source?: string },
): Promise<{ error: Error | null }> {
  const phone_e164 = payloadToE164(payload);
  const labels = normalizeGroupLabels(payload.groupLabels);
  const group_label = mirrorGroupColumn(labels);

  const { data: inserted, error } = await supabase
    .from("clients")
    .insert({
      user_id: userId,
      first_name: payload.firstName.trim(),
      last_name: payload.lastName.trim(),
      phone_e164,
      group_label,
      notes: payload.notes.trim(),
      source: options?.source ?? "Ajout manuel",
      opt_in: payload.optIn,
      stop_sms: payload.stop,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error: new Error(
          "Ce numéro est déjà enregistré pour ton compte.",
        ),
      };
    }
    return { error: new Error(error.message) };
  }
  if (!inserted?.id) {
    return { error: new Error("Insertion sans identifiant.") };
  }
  return syncClientGroupMemberships(supabase, userId, inserted.id, labels);
}

/**
 * Ajoute des contacts à un segment existant (sans retirer les autres appartenances).
 */
export async function addClientsToGroupByName(
  supabase: SupabaseClient,
  userId: string,
  clientIds: string[],
  groupName: string,
): Promise<{ error: Error | null }> {
  const name = groupName.trim();
  if (!name || clientIds.length === 0) {
    return { error: null };
  }
  const { data: g, error: findErr } = await supabase
    .from("client_groups")
    .select("id")
    .eq("user_id", userId)
    .eq("name", name)
    .maybeSingle();

  if (findErr) {
    return { error: new Error(findErr.message) };
  }
  if (!g) {
    return {
      error: new Error(`Groupe « ${name} » introuvable.`),
    };
  }
  const uniqueClientIds = [...new Set(clientIds)];
  for (const client_id of uniqueClientIds) {
    const { error } = await supabase.from("client_group_members").insert({
      client_id,
      group_id: g.id,
    });
    if (error && error.code !== "23505") {
      return { error: new Error(error.message) };
    }
  }
  return { error: null };
}

export type ImportBatchResult = {
  inserted: number;
  skippedDuplicateInFile: number;
  skippedDuplicateInDb: number;
  skippedInvalidRow: number;
  otherErrors: number;
};

/**
 * Import ligne par ligne pour isoler les doublons et erreurs (MVP).
 */
export async function insertClientsFromImport(
  supabase: SupabaseClient,
  userId: string,
  payloads: ContactFormSubmitPayload[],
): Promise<ImportBatchResult> {
  const seen = new Set<string>();
  const result: ImportBatchResult = {
    inserted: 0,
    skippedDuplicateInFile: 0,
    skippedDuplicateInDb: 0,
    skippedInvalidRow: 0,
    otherErrors: 0,
  };

  for (const payload of payloads) {
    const e164 = frDisplayToE164(payload.phoneDisplay);
    if (!e164) {
      result.skippedInvalidRow++;
      continue;
    }
    if (seen.has(e164)) {
      result.skippedDuplicateInFile++;
      continue;
    }
    seen.add(e164);

    const { error } = await insertClient(supabase, userId, payload, {
      source: "Import CSV",
    });
    if (error) {
      if (
        error.message.includes("déjà") ||
        error.message.includes("duplicate")
      ) {
        result.skippedDuplicateInDb++;
      } else {
        result.otherErrors++;
      }
    } else {
      result.inserted++;
    }
  }

  return result;
}

export async function updateClient(
  supabase: SupabaseClient,
  userId: string,
  clientId: string,
  payload: ContactFormSubmitPayload,
): Promise<{ error: Error | null }> {
  const phone_e164 = payloadToE164(payload);
  const labels = normalizeGroupLabels(payload.groupLabels);
  const group_label = mirrorGroupColumn(labels);

  const { error } = await supabase
    .from("clients")
    .update({
      first_name: payload.firstName.trim(),
      last_name: payload.lastName.trim(),
      phone_e164,
      group_label,
      notes: payload.notes.trim(),
      opt_in: payload.optIn,
      stop_sms: payload.stop,
    })
    .eq("id", clientId)
    .eq("user_id", userId);

  if (error) {
    if (error.code === "23505") {
      return {
        error: new Error(
          "Ce numéro est déjà enregistré pour ton compte.",
        ),
      };
    }
    return { error: new Error(error.message) };
  }
  return syncClientGroupMemberships(supabase, userId, clientId, labels);
}
