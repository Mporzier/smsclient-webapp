import type { SupabaseClient } from "@supabase/supabase-js";
import {
  e164ToFrDisplay,
  frDisplayToE164,
} from "@/lib/proto/smsUtils";
import { formatParisCalendarDate } from "@/lib/proto/timezone";
import type { ContactRowData } from "@/lib/types/contact";
import type { CustomFieldValues } from "@/lib/types/customFields";

export type ClientRecord = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone_e164: string;
  /** Rétrocompat / miroir d’affichage (liste des noms de segments). */
  group_label: string;
  notes: string;
  birthday: string | null;
  custom_fields: CustomFieldValues | null;
  source: string;
  opt_in: boolean;
  stop_sms: boolean;
  last_sms_sent_at: string | null;
  last_sms_body: string | null;
  unsubscribed_at: string | null;
  created_at: string;
};

export type ContactFormSubmitPayload = {
  firstName: string;
  lastName: string;
  phoneDisplay: string;
  /** Noms de segments (`client_groups.name`) — plusieurs possibles. */
  groupLabels: string[];
  /** YYYY-MM-DD, vide pour effacer */
  birthday: string;
  notes: string;
  customFields: CustomFieldValues;
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

/** Date ISO (YYYY-MM-DD) depuis la colonne Postgres `date`. */
function birthdayFromDb(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(raw.trim());
  return m?.[1] ?? "";
}

function birthdayToDb(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

function customFieldsFromDb(
  raw: CustomFieldValues | null | undefined,
): CustomFieldValues {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: CustomFieldValues = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") out[k] = v;
    else if (v == null) out[k] = "";
    else out[k] = String(v);
  }
  return out;
}

function customFieldsToDb(values: CustomFieldValues | undefined): CustomFieldValues {
  const out: CustomFieldValues = {};
  if (!values) return out;
  for (const [k, v] of Object.entries(values)) {
    const t = (v ?? "").trim();
    if (t) out[k] = t;
  }
  return out;
}

function mirrorGroupColumn(labels: string[]): string {
  const n = normalizeGroupLabels(labels);
  if (n.length === 0) return "Non classé";
  return n.join(", ").slice(0, 500);
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
    created: formatParisCalendarDate(row.created_at),
    firstName,
    lastName,
    name,
    phone: e164ToFrDisplay(row.phone_e164),
    groups: mergedGroups,
    birthday: birthdayFromDb(row.birthday),
    notes: row.notes?.trim() ?? "",
    customFields: customFieldsFromDb(row.custom_fields),
    lastSms: formatParisCalendarDate(row.last_sms_sent_at),
    lastSmsBody: row.last_sms_body?.trim() ?? "",
    unsubscribed: formatParisCalendarDate(row.unsubscribed_at),
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
    .select("client_id, client_groups(name, deleted_at)")
    .in("client_id", clientIds);

  if (error) {
    return { map, error: new Error(error.message) };
  }
  for (const raw of data ?? []) {
    const row = raw as {
      client_id: string;
      client_groups:
        | { name: string; deleted_at: string | null }
        | { name: string; deleted_at: string | null }[]
        | null
        | undefined;
    };
    const cg = row.client_groups;
    const group = Array.isArray(cg) ? cg[0] : cg;
    if (group?.deleted_at) continue;
    const name = group?.name?.trim();
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

/** Numéros E164 déjà en base (non soft-deleted) — preview import CSV. */
export async function fetchExistingClientPhoneE164s(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: string[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("clients")
    .select("phone_e164")
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) {
    return { data: [], error: new Error(error.message) };
  }
  return {
    data: (data ?? [])
      .map((r) => (r as { phone_e164: string | null }).phone_e164)
      .filter((p): p is string => Boolean(p)),
    error: null,
  };
}

export async function fetchClients(
  supabase: SupabaseClient,
): Promise<{ data: ContactRowData[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .is("deleted_at", null)
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

  // Fallback : si last_sms_body est vide, on récupère la dernière campagne envoyée par le user
  const needsFallback = rows.some((r) => !r.last_sms_body && r.last_sms_sent_at);
  let fallbackBody: string | null = null;
  if (needsFallback) {
    const { data: campaign } = await supabase
      .from("sms_campaigns")
      .select("body")
      .in("status", ["sent", "scheduled"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    fallbackBody = (campaign as { body: string } | null)?.body ?? null;
  }

  return {
    data: rows.map((r) => {
      const row = r.last_sms_body ? r : { ...r, last_sms_body: r.last_sms_sent_at ? fallbackBody : null };
      return clientRecordToRow(row, memMap.get(r.id) ?? []);
    }),
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
    .eq("user_id", userId)
    .is("deleted_at", null);
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
      birthday: birthdayToDb(payload.birthday),
      notes: payload.notes.trim(),
      custom_fields: customFieldsToDb(payload.customFields),
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
          "Ce numéro est déjà enregistré pour votre compte.",
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
    .is("deleted_at", null)
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

/**
 * Remplace la liste des contacts d’un segment (supprime les anciennes
 * liaisons pour ce groupe, puis insère les nouvelles).
 */
export async function replaceGroupMembers(
  supabase: SupabaseClient,
  userId: string,
  groupId: string,
  clientIds: string[],
): Promise<{ error: Error | null }> {
  const { data: g, error: findErr } = await supabase
    .from("client_groups")
    .select("id")
    .eq("id", groupId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (findErr) {
    return { error: new Error(findErr.message) };
  }
  if (!g) {
    return { error: new Error("Groupe introuvable.") };
  }

  const { error: delErr } = await supabase
    .from("client_group_members")
    .delete()
    .eq("group_id", groupId);
  if (delErr) {
    return { error: new Error(delErr.message) };
  }

  const uniqueClientIds = [...new Set(clientIds)];
  if (uniqueClientIds.length === 0) {
    return { error: null };
  }

  const rows = uniqueClientIds.map((client_id) => ({
    client_id,
    group_id: groupId,
  }));
  const { error: insErr } = await supabase
    .from("client_group_members")
    .insert(rows);
  if (insErr) {
    return { error: new Error(insErr.message) };
  }
  return { error: null };
}

export type ImportBatchResult = {
  inserted: number;
  skippedDuplicateInFile: number;
  skippedDuplicateInDb: number;
  /** E164 des lignes ignorées (doublon fichier ou déjà en base). */
  duplicatePhoneE164s: string[];
  /** Contacts déjà en base rattachés au(x) groupe(s) du payload (additif). */
  linkedExistingToGroup: number;
  skippedInvalidRow: number;
  otherErrors: number;
};

async function linkExistingClientToGroupLabels(
  supabase: SupabaseClient,
  userId: string,
  phoneE164: string,
  groupLabels: string[],
): Promise<boolean> {
  const labels = normalizeGroupLabels(groupLabels);
  if (labels.length === 0) return false;

  const { data: existing, error: findErr } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", userId)
    .eq("phone_e164", phoneE164)
    .is("deleted_at", null)
    .maybeSingle();

  if (findErr || !existing?.id) return false;

  let linked = false;
  for (const name of labels) {
    const { error } = await addClientsToGroupByName(
      supabase,
      userId,
      [existing.id],
      name,
    );
    if (!error) linked = true;
  }
  return linked;
}

/**
 * Import ligne par ligne pour isoler les doublons et erreurs (MVP).
 * Si un numéro existe déjà et que le payload porte des `groupLabels`,
 * rattache le contact existant au(x) groupe(s) sans écraser les autres.
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
    duplicatePhoneE164s: [],
    linkedExistingToGroup: 0,
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
      result.duplicatePhoneE164s.push(e164);
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
        result.duplicatePhoneE164s.push(e164);
        const linked = await linkExistingClientToGroupLabels(
          supabase,
          userId,
          e164,
          payload.groupLabels,
        );
        if (linked) result.linkedExistingToGroup++;
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
      birthday: birthdayToDb(payload.birthday),
      notes: payload.notes.trim(),
      custom_fields: customFieldsToDb(payload.customFields),
      opt_in: payload.optIn,
      stop_sms: payload.stop,
    })
    .eq("id", clientId)
    .eq("user_id", userId);

  if (error) {
    if (error.code === "23505") {
      return {
        error: new Error(
          "Ce numéro est déjà enregistré pour votre compte.",
        ),
      };
    }
    return { error: new Error(error.message) };
  }
  return syncClientGroupMemberships(supabase, userId, clientId, labels);
}

/**
 * Met à jour `last_sms_sent_at` et `last_sms_body` sur les contacts ciblés par une campagne.
 */
export async function stampLastSmsOnContacts(
  supabase: SupabaseClient,
  contactIds: string[],
  smsBody: string,
): Promise<void> {
  if (contactIds.length === 0) return;
  const now = new Date().toISOString();
  const BATCH = 200;
  for (let i = 0; i < contactIds.length; i += BATCH) {
    const batch = contactIds.slice(i, i + BATCH);
    await supabase
      .from("clients")
      .update({ last_sms_sent_at: now, last_sms_body: smsBody })
      .in("id", batch);
  }
}

/**
 * Réabonne des contacts (opt-in SMS, lève STOP).
 * `unsubscribed_at` est effacé par trigger DB quand `stop_sms` passe à false.
 */
export async function resubscribeClients(
  supabase: SupabaseClient,
  userId: string,
  ids: string[],
): Promise<{ error: Error | null }> {
  if (ids.length === 0) return { error: null };
  const BATCH = 200;
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const { error } = await supabase
      .from("clients")
      .update({ opt_in: true, stop_sms: false })
      .in("id", batch)
      .eq("user_id", userId)
      .is("deleted_at", null);
    if (error) return { error: new Error(error.message) };
  }
  return { error: null };
}

export async function deleteClients(
  supabase: SupabaseClient,
  ids: string[],
): Promise<{ error: Error | null }> {
  if (ids.length === 0) return { error: null };
  const deletedAt = new Date().toISOString();
  const { error } = await supabase
    .from("clients")
    .update({ deleted_at: deletedAt })
    .in("id", ids)
    .is("deleted_at", null);
  return { error: error ? new Error(error.message) : null };
}
