import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomFieldType } from "@/lib/types/customFields";
import {
  normalizeListFilters,
  type ListColumnFilter,
  type NormalizedListFilter,
} from "@/lib/proto/listFilters";
import {
  applyDateColumn,
  applyTextColumn,
  asRange,
  orFilterForText,
  quoteOrValue,
  type FilterQuery,
  type FilterQueryBox,
} from "@/lib/supabase/listFilterSql";
import {
  chunkList,
  paginateRange,
  POSTGREST_PAGE,
} from "@/lib/supabase/postgrestChunk";

export { orFilterForText };

const SAFE_CUSTOM_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NO_MATCH_ID = "00000000-0000-0000-0000-000000000000";

export type ResolvedClientColumn =
  | { kind: "text"; column: string }
  | { kind: "date"; column: string }
  | { kind: "source"; column: "source" }
  | { kind: "groups" }
  | { kind: "custom"; fieldId: string };

export const CLIENT_FILTER_COLUMNS: Record<
  string,
  Exclude<ResolvedClientColumn, { kind: "custom" }>
> = {
  firstName: { kind: "text", column: "first_name" },
  lastName: { kind: "text", column: "last_name" },
  phone: { kind: "text", column: "phone_e164" },
  notes: { kind: "text", column: "notes" },
  lastSmsBody: { kind: "text", column: "last_sms_body" },
  source: { kind: "source", column: "source" },
  created: { kind: "date", column: "created_at" },
  lastSms: { kind: "date", column: "last_sms_sent_at" },
  groups: { kind: "groups" },
};

export function resolveClientFilterColumn(
  id: string,
): ResolvedClientColumn | null {
  const native = CLIENT_FILTER_COLUMNS[id];
  if (native) return native;
  if (id.startsWith("custom_")) {
    const fieldId = id.slice("custom_".length);
    if (SAFE_CUSTOM_ID.test(fieldId)) return { kind: "custom", fieldId };
  }
  return null;
}

export function applyIdOrFilter<T extends FilterQuery>(
  query: T,
  ids: string[],
): T {
  if (ids.length === 0) {
    return query.eq("id", NO_MATCH_ID) as T;
  }
  const parts = chunkList(ids).map((chunk) => `id.in.(${chunk.join(",")})`);
  return query.or(parts.join(",")) as T;
}

export function applyIdNotFilter<T extends FilterQuery>(
  query: T,
  ids: string[],
): T {
  if (ids.length === 0) return query;
  let next: FilterQuery = query;
  for (const chunk of chunkList(ids)) {
    next = next.not("id", "in", `(${chunk.join(",")})`);
  }
  return next as T;
}

function asStringList(value: NormalizedListFilter["value"]): string[] {
  if (Array.isArray(value)) return value.map((x) => x.trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function applyCustomDateColumn<T extends FilterQuery>(
  query: T,
  column: string,
  filter: NormalizedListFilter,
): T {
  if (filter.op === "isEmpty") {
    return query.or(`${column}.is.null,${column}.eq.`) as T;
  }
  if (filter.op === "isNotEmpty") {
    return query.not(column, "is", null).neq(column, "") as T;
  }
  if (filter.op === "on" && typeof filter.value === "string") {
    return query.eq(column, filter.value) as T;
  }
  if (filter.op === "before" && typeof filter.value === "string") {
    return query.lt(column, filter.value) as T;
  }
  if (filter.op === "after" && typeof filter.value === "string") {
    return query.gt(column, filter.value) as T;
  }
  if (filter.op === "between") {
    const range = asRange(filter.value);
    if (!range) return query;
    return query.gte(column, range.from).lte(column, range.to) as T;
  }
  return query;
}

function applySourceFacet<T extends FilterQuery>(
  query: T,
  filter: NormalizedListFilter,
): T {
  const values = asStringList(filter.value);
  if (filter.op === "in") {
    if (values.length === 0) return applyIdOrFilter(query, []);
    const parts = chunkList(values).map(
      (chunk) => `source.in.(${chunk.map(quoteOrValue).join(",")})`,
    );
    return query.or(parts.join(",")) as T;
  }
  if (filter.op === "notIn") {
    if (values.length === 0) return query;
    let next: FilterQuery = query;
    for (const chunk of chunkList(values)) {
      next = next.not("source", "in", `(${chunk.map(quoteOrValue).join(",")})`);
    }
    return next as T;
  }
  return applyTextColumn(query, "source", filter);
}

async function fetchMemberClientIds(
  supabase: SupabaseClient,
  groupIds?: string[],
): Promise<{ ids: string[]; error: boolean }> {
  if (groupIds && groupIds.length === 0) return { ids: [], error: false };

  const chunks = groupIds ? chunkList(groupIds) : [null];
  const ids = new Set<string>();

  for (const groupChunk of chunks) {
    const { data, error } = await paginateRange<{ client_id: string }>(
      async (from, to) => {
        let q = supabase
          .from("client_group_members")
          .select("client_id")
          .order("client_id", { ascending: true })
          .range(from, to);
        if (groupChunk) q = q.in("group_id", groupChunk);
        const res = await q;
        return {
          data: (res.data as { client_id: string }[] | null) ?? null,
          error: res.error,
        };
      },
      POSTGREST_PAGE,
    );
    if (error) return { ids: [], error: true };
    for (const row of data) {
      if (row.client_id) ids.add(row.client_id);
    }
  }

  return { ids: [...ids], error: false };
}

async function applyGroupsFilter<T extends FilterQuery>(
  supabase: SupabaseClient,
  query: T,
  filter: NormalizedListFilter,
): Promise<{ query: T }> {
  if (filter.op === "hasAnyGroup" || filter.op === "hasNoGroup") {
    const { ids, error } = await fetchMemberClientIds(supabase);
    if (error) return { query: applyIdOrFilter(query, []) };
    return {
      query:
        filter.op === "hasAnyGroup"
          ? applyIdOrFilter(query, ids)
          : applyIdNotFilter(query, ids),
    };
  }
  const groupIds = asStringList(filter.value);
  if (filter.op === "isMemberOf") {
    const { ids, error } = await fetchMemberClientIds(supabase, groupIds);
    if (error) return { query: applyIdOrFilter(query, []) };
    return { query: applyIdOrFilter(query, ids) };
  }
  if (filter.op === "isNotMemberOf") {
    const { ids, error } = await fetchMemberClientIds(supabase, groupIds);
    if (error) return { query: applyIdOrFilter(query, []) };
    return { query: applyIdNotFilter(query, ids) };
  }
  return { query };
}

function parseNumber(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

async function applyCustomNumber<T extends FilterQuery>(
  supabase: SupabaseClient,
  query: T,
  fieldId: string,
  filter: NormalizedListFilter,
  eligibleOnly: boolean,
): Promise<{ query: T }> {
  if (filter.op === "isEmpty" || filter.op === "isNotEmpty") {
    return {
      query: applyTextColumn(query, `custom_fields->>${fieldId}`, filter),
    };
  }

  let a: number | null = null;
  let b: number | null = null;
  if (filter.op === "between") {
    const range = asRange(filter.value);
    if (!range) return { query };
    a = parseNumber(range.from);
    b = parseNumber(range.to);
  } else if (typeof filter.value === "string") {
    a = parseNumber(filter.value);
  }
  if (a == null) return { query };

  const { data, error } = await supabase.rpc("list_client_ids_custom_number", {
    p_field_id: fieldId,
    p_op: filter.op,
    p_a: a,
    p_b: b,
    p_eligible_only: eligibleOnly,
  });
  if (error || !Array.isArray(data)) {
    return { query: applyIdOrFilter(query, []) };
  }
  const ids = data.filter((id): id is string => typeof id === "string");
  return { query: applyIdOrFilter(query, ids) };
}

export type ApplyClientListFiltersOpts = {
  customFieldTypes?: Record<string, CustomFieldType>;
  eligibleOnly?: boolean;
};

/** Boxed: async + builder thenable = Promise unwrap → plus de `.order`. */
export async function applyClientListFilters(
  supabase: SupabaseClient,
  query: FilterQuery,
  filters: readonly ListColumnFilter[],
  opts: ApplyClientListFiltersOpts = {},
): Promise<FilterQueryBox> {
  const normalized = normalizeListFilters(filters);
  let next: FilterQuery = query;
  const eligibleOnly = opts.eligibleOnly ?? true;

  for (const filter of normalized) {
    const resolved = resolveClientFilterColumn(filter.id);
    if (!resolved) continue;

    if (resolved.kind === "text") {
      next = applyTextColumn(next, resolved.column, filter);
      continue;
    }
    if (resolved.kind === "date") {
      next = applyDateColumn(next, resolved.column, filter);
      continue;
    }
    if (resolved.kind === "source") {
      next = applySourceFacet(next, filter);
      continue;
    }
    if (resolved.kind === "groups") {
      next = (await applyGroupsFilter(supabase, next, filter)).query;
      continue;
    }

    const fieldType = opts.customFieldTypes?.[resolved.fieldId] ?? "text";
    const jsonCol = `custom_fields->>${resolved.fieldId}`;
    if (fieldType === "number") {
      next = (
        await applyCustomNumber(
          supabase,
          next,
          resolved.fieldId,
          filter,
          eligibleOnly,
        )
      ).query;
      continue;
    }
    if (fieldType === "date") {
      next = applyCustomDateColumn(next, jsonCol, filter);
      continue;
    }
    next = applyTextColumn(next, jsonCol, filter);
  }

  return { query: next };
}
