import type { SupabaseClient } from "@supabase/supabase-js";
import {
  e164ToFrDisplay,
  frDisplayToE164,
} from "@/lib/proto/smsUtils";
import { formatParisCalendarDate } from "@/lib/proto/timezone";
import type { ContactRowData } from "@/lib/types/contact";
import type { CustomFieldValues } from "@/lib/types/customFields";
import {
  contactSortToOrders,
  type ContactListSort,
} from "@/lib/proto/contactSort";
import {
  POSTGREST_IN_CHUNK,
  POSTGREST_INSERT_CHUNK,
  LIST_PAGE_SIZE,
  chunkList,
  paginateRange,
} from "@/lib/supabase/postgrestChunk";
import { applyClientListSearch } from "@/lib/supabase/clientSearch";

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
    createdAt: row.created_at,
    firstName,
    lastName,
    name,
    phone: e164ToFrDisplay(row.phone_e164),
    groups: mergedGroups,
    birthday: birthdayFromDb(row.birthday),
    notes: row.notes?.trim() ?? "",
    customFields: customFieldsFromDb(row.custom_fields),
    lastSms: formatParisCalendarDate(row.last_sms_sent_at),
    lastSmsAt: row.last_sms_sent_at,
    lastSmsBody: row.last_sms_body?.trim() ?? "",
    unsubscribed: formatParisCalendarDate(row.unsubscribed_at),
    source: row.source,
    optIn: row.opt_in,
    stopSms: row.stop_sms,
  };
}

/** Embed PostgREST — groupes en même round-trip que `clients`. */
const CLIENT_MEMBERSHIPS_EMBED =
  "client_group_members(client_groups(name,deleted_at))";

type GroupRefEmbed = { name: string; deleted_at: string | null };
type MembershipEmbedRow = {
  client_groups: GroupRefEmbed | GroupRefEmbed[] | null | undefined;
};

function groupsFromMembershipEmbed(
  memberships: MembershipEmbedRow[] | null | undefined,
): string[] {
  const names: string[] = [];
  for (const m of memberships ?? []) {
    const cg = m.client_groups;
    const group = Array.isArray(cg) ? cg[0] : cg;
    if (group?.deleted_at) continue;
    const name = group?.name?.trim();
    if (name) names.push(name);
  }
  return normalizeGroupLabels(names);
}

type ClientRecordWithMemberships = ClientRecord & {
  client_group_members?: MembershipEmbedRow[] | null;
};

type PickerRecordWithMemberships = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone_e164: string;
  group_label: string | null;
  client_group_members?: MembershipEmbedRow[] | null;
};

/** Numéros E164 déjà en base (non soft-deleted) — preview import CSV. */
export async function fetchExistingClientPhoneE164s(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: string[]; error: Error | null }> {
  const PAGE = 1000;
  const phones: string[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("clients")
      .select("phone_e164")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) {
      return { data: [], error: new Error(error.message) };
    }
    const page = data ?? [];
    for (const r of page) {
      const p = (r as { phone_e164: string | null }).phone_e164;
      if (p) phones.push(p);
    }
    if (page.length < PAGE) break;
  }
  return { data: phones, error: null };
}

export async function fetchClients(
  supabase: SupabaseClient,
): Promise<{ data: ContactRowData[]; error: Error | null }> {
  const PAGE = 500;
  const all: ContactRowData[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, hasMore, error } = await fetchClientsPage(supabase, {
      offset,
      limit: PAGE,
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

const CLIENT_LIST_COLS =
  "id,user_id,first_name,last_name,phone_e164,group_label,notes,birthday,custom_fields,source,opt_in,stop_sms,last_sms_sent_at,last_sms_body,unsubscribed_at,created_at";

const CLIENT_LIST_SELECT = `${CLIENT_LIST_COLS},${CLIENT_MEMBERSHIPS_EMBED}`;

const PICKER_LIST_SELECT = `id,first_name,last_name,phone_e164,group_label,${CLIENT_MEMBERSHIPS_EMBED}`;

export type FetchClientsPageArgs = {
  offset: number;
  limit?: number;
  search?: string;
  /** Compte exact (coûteux) — seulement offset 0 en pratique. */
  includeTotal?: boolean;
  sort?: ContactListSort | null;
};

export async function fetchClientsPage(
  supabase: SupabaseClient,
  args: FetchClientsPageArgs,
): Promise<{
  data: ContactRowData[];
  hasMore: boolean;
  totalCount?: number;
  error: Error | null;
}> {
  const limit = args.limit ?? LIST_PAGE_SIZE;
  const offset = Math.max(0, args.offset);
  const includeTotal = args.includeTotal ?? offset === 0;

  let query = supabase
    .from("clients")
    .select(CLIENT_LIST_SELECT, includeTotal ? { count: "exact" } : undefined)
    .is("deleted_at", null);

  query = applyClientListSearch(query, args.search ?? "");

  for (const o of contactSortToOrders(args.sort)) {
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

  const page = (data ?? []) as ClientRecordWithMemberships[];

  const needsFallback = page.some((r) => !r.last_sms_body && r.last_sms_sent_at);
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

  const rows = page.map((r) => {
    const groups = groupsFromMembershipEmbed(r.client_group_members);
    const row = r.last_sms_body
      ? r
      : { ...r, last_sms_body: r.last_sms_sent_at ? fallbackBody : null };
    return clientRecordToRow(row, groups);
  });

  return {
    data: rows,
    hasMore: page.length === limit,
    totalCount: includeTotal && typeof count === "number" ? count : undefined,
    error: null,
  };
}

export async function countClientIds(
  supabase: SupabaseClient,
  args: { search?: string; eligibleOnly: boolean },
): Promise<{ count: number; error: Error | null }> {
  let query = supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);
  if (args.eligibleOnly) {
    query = query.eq("opt_in", true).eq("stop_sms", false);
  }
  query = applyClientListSearch(query, args.search ?? "");
  const { count, error } = await query;
  if (error) return { count: 0, error: new Error(error.message) };
  return { count: typeof count === "number" ? count : 0, error: null };
}

export async function fetchClientIds(
  supabase: SupabaseClient,
  args: { search?: string; eligibleOnly: boolean },
): Promise<{ data: string[]; error: Error | null }> {
  const { data, error } = await paginateRange<{ id: string }>(
    async (from, to) => {
      let query = supabase
        .from("clients")
        .select("id")
        .is("deleted_at", null);
      if (args.eligibleOnly) {
        query = query.eq("opt_in", true).eq("stop_sms", false);
      }
      query = applyClientListSearch(query, args.search ?? "");
      const res = await query.order("id", { ascending: true }).range(from, to);
      return { data: (res.data as { id: string }[] | null) ?? null, error: res.error };
    },
  );
  if (error) return { data: [], error };
  return {
    data: data.map((row) => row.id).filter(Boolean),
    error: null,
  };
}

/** Résumé léger pour pickers (modale groupe) — pages lazy + search serveur. */
export type ContactPickerSummary = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  groups: string[];
};

function rowToPickerSummary(
  raw: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone_e164: string;
    group_label: string | null;
  },
  membershipGroups?: string[],
): ContactPickerSummary {
  const firstName = raw.first_name?.trim() ?? "";
  const lastName = raw.last_name?.trim() ?? "";
  const name =
    [firstName, lastName].filter(Boolean).join(" ") || firstName || "—";
  const label = raw.group_label?.trim() ?? "";
  const groups =
    membershipGroups && membershipGroups.length > 0
      ? normalizeGroupLabels(membershipGroups)
      : label && label !== "Non classé"
        ? normalizeGroupLabels(label.split(",").map((x) => x.trim()))
        : [];
  return {
    id: raw.id,
    name,
    firstName,
    lastName,
    phone: e164ToFrDisplay(raw.phone_e164),
    groups,
  };
}

export async function fetchContactPickerSummariesPage(
  supabase: SupabaseClient,
  args: {
    offset: number;
    limit?: number;
    search?: string;
    includeTotal?: boolean;
  },
): Promise<{
  data: ContactPickerSummary[];
  hasMore: boolean;
  totalCount?: number;
  error: Error | null;
}> {
  const limit = args.limit ?? LIST_PAGE_SIZE;
  const offset = Math.max(0, args.offset);
  const includeTotal = args.includeTotal ?? offset === 0;

  let query = supabase
    .from("clients")
    .select(PICKER_LIST_SELECT, {
      count: includeTotal ? "exact" : undefined,
    })
    .is("deleted_at", null);

  query = applyClientListSearch(query, args.search ?? "");

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) {
    return { data: [], hasMore: false, error: new Error(error.message) };
  }
  const page = (data ?? []) as PickerRecordWithMemberships[];
  return {
    data: page.map((r) =>
      rowToPickerSummary(r, groupsFromMembershipEmbed(r.client_group_members)),
    ),
    hasMore: page.length === limit,
    totalCount: includeTotal && typeof count === "number" ? count : undefined,
    error: null,
  };
}

/** IDs membres d’un groupe (pour sélection edit, indépendant du lazyload). */
export async function fetchGroupMemberClientIds(
  supabase: SupabaseClient,
  groupId: string,
): Promise<{ data: string[]; error: Error | null }> {
  const { data, error } = await paginateRange<{ client_id: string }>(
    async (from, to) => {
      const res = await supabase
        .from("client_group_members")
        .select("client_id")
        .eq("group_id", groupId)
        .order("client_id", { ascending: true })
        .range(from, to);
      return {
        data: (res.data as { client_id: string }[] | null) ?? null,
        error: res.error,
      };
    },
  );
  if (error) return { data: [], error };
  return {
    data: data.map((row) => row.client_id).filter(Boolean),
    error: null,
  };
}

/** Contacts complets par IDs (wizard campagne — indépendant du lazyload liste). */
export async function fetchClientsByIds(
  supabase: SupabaseClient,
  clientIds: string[],
): Promise<{ data: ContactRowData[]; error: Error | null }> {
  if (clientIds.length === 0) return { data: [], error: null };
  const out: ContactRowData[] = [];
  for (const chunk of chunkList(clientIds, POSTGREST_IN_CHUNK)) {
    const { data, error } = await supabase
      .from("clients")
      .select(CLIENT_LIST_SELECT)
      .in("id", chunk)
      .is("deleted_at", null);
    if (error) {
      return { data: [], error: new Error(error.message) };
    }
    const page = (data ?? []) as ClientRecordWithMemberships[];
    for (const raw of page) {
      out.push(
        clientRecordToRow(
          raw,
          groupsFromMembershipEmbed(raw.client_group_members),
        ),
      );
    }
  }
  return { data: out, error: null };
}

export async function fetchContactPickerSummariesByIds(
  supabase: SupabaseClient,
  clientIds: string[],
): Promise<{ data: ContactPickerSummary[]; error: Error | null }> {
  if (clientIds.length === 0) return { data: [], error: null };
  const out: ContactPickerSummary[] = [];
  for (const chunk of chunkList(clientIds, POSTGREST_IN_CHUNK)) {
    const { data, error } = await supabase
      .from("clients")
      .select(PICKER_LIST_SELECT)
      .in("id", chunk)
      .is("deleted_at", null);
    if (error) {
      return { data: [], error: new Error(error.message) };
    }
    const rows = (data ?? []) as PickerRecordWithMemberships[];
    for (const raw of rows) {
      out.push(
        rowToPickerSummary(
          raw,
          groupsFromMembershipEmbed(raw.client_group_members),
        ),
      );
    }
  }
  return { data: out, error: null };
}

/** @deprecated Préférer `fetchContactPickerSummariesPage`. */
export async function fetchAllContactPickerSummaries(
  supabase: SupabaseClient,
): Promise<{ data: ContactPickerSummary[]; error: Error | null }> {
  const all: ContactPickerSummary[] = [];
  for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
    const { data, hasMore, error } = await fetchContactPickerSummariesPage(
      supabase,
      { offset, limit: LIST_PAGE_SIZE, search: "", includeTotal: false },
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

/** Contacts non éligibles campagne (STOP / pas opt-in) — query dédiée lazy-safe. */
/** Compteur seul — la liste ne part qu'à l'ouverture de la modale. */
export async function countUnsubscribedContacts(
  supabase: SupabaseClient,
): Promise<{ count: number; error: Error | null }> {
  const { count, error } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .or("opt_in.eq.false,stop_sms.eq.true");

  if (error) return { count: 0, error: new Error(error.message) };
  return { count: count ?? 0, error: null };
}

export async function fetchUnsubscribedContacts(
  supabase: SupabaseClient,
): Promise<{
  data: Array<{
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    phone: string;
    date: string;
  }>;
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id,first_name,last_name,phone_e164,unsubscribed_at,created_at,opt_in,stop_sms",
    )
    .is("deleted_at", null)
    .or("opt_in.eq.false,stop_sms.eq.true")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  return {
    data: (data ?? []).map((raw) => {
      const r = raw as {
        id: string;
        first_name: string | null;
        last_name: string | null;
        phone_e164: string;
        unsubscribed_at: string | null;
        created_at: string;
      };
      const firstName = r.first_name?.trim() ?? "";
      const lastName = r.last_name?.trim() ?? "";
      const name =
        [firstName, lastName].filter(Boolean).join(" ") || firstName || "—";
      const unsub = r.unsubscribed_at
        ? formatParisCalendarDate(r.unsubscribed_at)
        : formatParisCalendarDate(r.created_at);
      return {
        id: r.id,
        firstName,
        lastName,
        name,
        phone: e164ToFrDisplay(r.phone_e164),
        date: unsub !== "—" ? unsub : formatParisCalendarDate(r.created_at),
      };
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
    .in("name", normalized)
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
  for (const idChunk of chunkList(uniqueClientIds, POSTGREST_INSERT_CHUNK)) {
    const rows = idChunk.map((client_id) => ({
      client_id,
      group_id: g.id,
    }));
    const { error } = await supabase.from("client_group_members").insert(rows);
    if (error && error.code !== "23505") {
      for (const client_id of idChunk) {
        const { error: oneErr } = await supabase
          .from("client_group_members")
          .insert({ client_id, group_id: g.id });
        if (oneErr && oneErr.code !== "23505") {
          return { error: new Error(oneErr.message) };
        }
      }
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

  for (const idChunk of chunkList(uniqueClientIds, POSTGREST_INSERT_CHUNK)) {
    const rows = idChunk.map((client_id) => ({
      client_id,
      group_id: groupId,
    }));
    const { error: insErr } = await supabase
      .from("client_group_members")
      .insert(rows);
    if (insErr) {
      return { error: new Error(insErr.message) };
    }
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

export type ImportProgress = {
  current: number;
  total: number;
};

async function linkExistingClientsToGroupLabels(
  supabase: SupabaseClient,
  userId: string,
  phoneE164s: string[],
  groupLabels: string[],
): Promise<number> {
  const labels = normalizeGroupLabels(groupLabels);
  if (labels.length === 0 || phoneE164s.length === 0) return 0;

  const uniquePhones = [...new Set(phoneE164s)];
  const ids: string[] = [];
  for (const chunk of chunkList(uniquePhones, POSTGREST_IN_CHUNK)) {
    const { data, error } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", userId)
      .in("phone_e164", chunk)
      .is("deleted_at", null);
    if (error) return 0;
    for (const row of data ?? []) {
      const id = (row as { id: string }).id;
      if (id) ids.push(id);
    }
  }
  if (ids.length === 0) return 0;

  let linked = 0;
  for (const name of labels) {
    const { error } = await addClientsToGroupByName(
      supabase,
      userId,
      ids,
      name,
    );
    if (!error) linked = ids.length;
  }
  return linked;
}

/** Import CSV par lots (dédup fichier/DB + groupes). */
export async function insertClientsFromImport(
  supabase: SupabaseClient,
  userId: string,
  payloads: ContactFormSubmitPayload[],
  options?: { onProgress?: (progress: ImportProgress) => void },
): Promise<ImportBatchResult> {
  const onProgress = options?.onProgress;
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

  type Prepared = { payload: ContactFormSubmitPayload; e164: string };
  const prepared: Prepared[] = [];

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
    prepared.push({ payload, e164 });
  }

  const total = prepared.length;
  onProgress?.({ current: 0, total: Math.max(total, 1) });

  if (prepared.length === 0) {
    return result;
  }

  const { data: existingList } = await fetchExistingClientPhoneE164s(
    supabase,
    userId,
  );
  const existingDb = new Set(existingList);

  const toInsert: Prepared[] = [];
  const alreadyInDb: Prepared[] = [];
  for (const item of prepared) {
    if (existingDb.has(item.e164)) {
      alreadyInDb.push(item);
      result.skippedDuplicateInDb++;
      result.duplicatePhoneE164s.push(item.e164);
    } else {
      toInsert.push(item);
    }
  }

  if (alreadyInDb.length > 0) {
    const byGroupKey = new Map<string, Prepared[]>();
    for (const item of alreadyInDb) {
      const key = normalizeGroupLabels(item.payload.groupLabels).join("\0");
      if (!key) continue;
      const list = byGroupKey.get(key) ?? [];
      list.push(item);
      byGroupKey.set(key, list);
    }
    for (const items of byGroupKey.values()) {
      const labels = items[0]?.payload.groupLabels ?? [];
      const linked = await linkExistingClientsToGroupLabels(
        supabase,
        userId,
        items.map((x) => x.e164),
        labels,
      );
      result.linkedExistingToGroup += linked;
    }
  }

  let processed = alreadyInDb.length;
  onProgress?.({ current: processed, total: Math.max(total, 1) });

  for (let i = 0; i < toInsert.length; i += POSTGREST_INSERT_CHUNK) {
    const chunk = toInsert.slice(i, i + POSTGREST_INSERT_CHUNK);
    const rows = chunk.map(({ payload, e164 }) => {
      const labels = normalizeGroupLabels(payload.groupLabels);
      return {
        user_id: userId,
        first_name: payload.firstName.trim(),
        last_name: payload.lastName.trim(),
        phone_e164: e164,
        group_label: mirrorGroupColumn(labels),
        birthday: birthdayToDb(payload.birthday),
        notes: payload.notes.trim(),
        custom_fields: customFieldsToDb(payload.customFields),
        source: "Import CSV",
        opt_in: payload.optIn,
        stop_sms: payload.stop,
      };
    });

    const { data: insertedRows, error } = await supabase
      .from("clients")
      .insert(rows)
      .select("id, phone_e164");

    if (error) {
      // Fallback ligne à ligne si le lot échoue (doublon course / contrainte).
      for (const item of chunk) {
        const { error: oneErr } = await insertClient(
          supabase,
          userId,
          item.payload,
          { source: "Import CSV" },
        );
        if (oneErr) {
          if (
            oneErr.message.includes("déjà") ||
            oneErr.message.includes("duplicate")
          ) {
            result.skippedDuplicateInDb++;
            result.duplicatePhoneE164s.push(item.e164);
            const linked = await linkExistingClientsToGroupLabels(
              supabase,
              userId,
              [item.e164],
              item.payload.groupLabels,
            );
            if (linked > 0) result.linkedExistingToGroup += linked;
          } else {
            result.otherErrors++;
          }
        } else {
          result.inserted++;
        }
        processed++;
        onProgress?.({ current: processed, total: Math.max(total, 1) });
      }
      continue;
    }

    const byPhone = new Map(
      (insertedRows ?? []).map((r) => {
        const row = r as { id: string; phone_e164: string };
        return [row.phone_e164, row.id] as const;
      }),
    );

    const okItems: { id: string; labels: string[] }[] = [];
    for (const item of chunk) {
      const id = byPhone.get(item.e164);
      if (!id) {
        result.otherErrors++;
        continue;
      }
      okItems.push({
        id,
        labels: normalizeGroupLabels(item.payload.groupLabels),
      });
      result.inserted++;
    }

    const idsByLabel = new Map<string, string[]>();
    for (const item of okItems) {
      for (const label of item.labels) {
        const list = idsByLabel.get(label) ?? [];
        list.push(item.id);
        idsByLabel.set(label, list);
      }
    }
    for (const [label, ids] of idsByLabel) {
      const { error: linkErr } = await addClientsToGroupByName(
        supabase,
        userId,
        ids,
        label,
      );
      if (linkErr) result.otherErrors++;
    }

    processed += chunk.length;
    onProgress?.({ current: processed, total: Math.max(total, 1) });
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
  for (const batch of chunkList(contactIds, POSTGREST_IN_CHUNK)) {
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
  for (const batch of chunkList(ids, POSTGREST_IN_CHUNK)) {
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
  for (const batch of chunkList(ids, POSTGREST_IN_CHUNK)) {
    const { error } = await supabase
      .from("clients")
      .update({ deleted_at: deletedAt })
      .in("id", batch)
      .is("deleted_at", null);
    if (error) return { error: new Error(error.message) };
  }
  return { error: null };
}
