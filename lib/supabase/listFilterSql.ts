import { civilDayBounds, type ListFilterOp, type ListFilterRange, type NormalizedListFilter } from "@/lib/proto/listFilters";
import { escapeIlike } from "@/lib/supabase/clientSearch";

export type FilterQuery = {
  or: (filters: string) => FilterQuery;
  eq: (column: string, value: unknown) => FilterQuery;
  neq: (column: string, value: unknown) => FilterQuery;
  gt: (column: string, value: unknown) => FilterQuery;
  gte: (column: string, value: unknown) => FilterQuery;
  lt: (column: string, value: unknown) => FilterQuery;
  lte: (column: string, value: unknown) => FilterQuery;
  not: (column: string, operator: string, value: unknown) => FilterQuery;
  is: (column: string, value: null) => FilterQuery;
};

export function quoteOrValue(raw: string): string {
  return `"${raw.replace(/"/g, '\\"')}"`;
}

export function orFilterForText(
  column: string,
  op: ListFilterOp,
  value?: string,
): string {
  const empty = `${column}.is.null,${column}.eq.`;
  if (op === "isEmpty") return empty;

  const v = value ?? "";
  const safe = escapeIlike(v);
  const containsPat = quoteOrValue(`%${safe}%`);
  const startsPat = quoteOrValue(`${safe}%`);
  const exact = quoteOrValue(v);

  switch (op) {
    case "contains":
      return `${column}.ilike.${containsPat}`;
    case "notContains":
      return `${empty},${column}.not.ilike.${containsPat}`;
    case "startsWith":
      return `${column}.ilike.${startsPat}`;
    case "equals":
      return `${column}.eq.${exact}`;
    case "notEquals":
      return `${empty},${column}.neq.${exact}`;
    default:
      return "";
  }
}

export function asRange(
  value: NormalizedListFilter["value"],
): ListFilterRange | null {
  if (!value || typeof value === "string" || Array.isArray(value)) return null;
  if (!value.from.trim() || !value.to.trim()) return null;
  return value;
}

export function applyTextColumn<T extends FilterQuery>(
  query: T,
  column: string,
  filter: NormalizedListFilter,
): T {
  if (filter.op === "isNotEmpty") {
    return query.not(column, "is", null).neq(column, "") as T;
  }
  const value = typeof filter.value === "string" ? filter.value : undefined;
  const clause = orFilterForText(column, filter.op, value);
  if (!clause) return query;
  return query.or(clause) as T;
}

export function applyDateColumn<T extends FilterQuery>(
  query: T,
  column: string,
  filter: NormalizedListFilter,
): T {
  if (filter.op === "isEmpty") return query.is(column, null) as T;
  if (filter.op === "isNotEmpty") return query.not(column, "is", null) as T;

  if (filter.op === "on" && typeof filter.value === "string") {
    const { startIso, endIso } = civilDayBounds(filter.value);
    return query.gte(column, startIso).lte(column, endIso) as T;
  }
  if (filter.op === "before" && typeof filter.value === "string") {
    const { startIso } = civilDayBounds(filter.value);
    return query.lt(column, startIso) as T;
  }
  if (filter.op === "after" && typeof filter.value === "string") {
    const { endIso } = civilDayBounds(filter.value);
    return query.gt(column, endIso) as T;
  }
  if (filter.op === "between") {
    const range = asRange(filter.value);
    if (!range) return query;
    const from = civilDayBounds(range.from);
    const to = civilDayBounds(range.to);
    return query.gte(column, from.startIso).lte(column, to.endIso) as T;
  }
  return query;
}

function parseNumber(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** `emptyAsZero`: count columns (member_count) — vide = 0. */
export function applyNumberColumn<T extends FilterQuery>(
  query: T,
  column: string,
  filter: NormalizedListFilter,
  emptyAsZero = false,
): T {
  if (filter.op === "isEmpty") {
    return emptyAsZero ? (query.eq(column, 0) as T) : (query.is(column, null) as T);
  }
  if (filter.op === "isNotEmpty") {
    return emptyAsZero
      ? (query.gt(column, 0) as T)
      : (query.not(column, "is", null) as T);
  }
  if (filter.op === "between") {
    const range = asRange(filter.value);
    if (!range) return query;
    const from = parseNumber(range.from);
    const to = parseNumber(range.to);
    if (from == null || to == null) return query;
    return query.gte(column, from).lte(column, to) as T;
  }
  if (typeof filter.value !== "string") return query;
  const n = parseNumber(filter.value);
  if (n == null) return query;
  if (filter.op === "eq") return query.eq(column, n) as T;
  if (filter.op === "neq") return query.neq(column, n) as T;
  if (filter.op === "gt") return query.gt(column, n) as T;
  if (filter.op === "gte") return query.gte(column, n) as T;
  if (filter.op === "lt") return query.lt(column, n) as T;
  if (filter.op === "lte") return query.lte(column, n) as T;
  return query;
}

export type FilterQueryBox = { query: FilterQuery };

/* eslint-disable @typescript-eslint/no-explicit-any -- PostgREST builder generics recurse too deep */
export function attachFilterQuery(
  query: any,
  apply: (query: FilterQuery) => FilterQuery,
): any {
  return apply(query as FilterQuery);
}

/** Garde `{ query }` jusqu'au call site — builder thenable + Promise = unwrap HTTP. */
export function attachFilterQueryAsync(
  query: any,
  apply: (query: FilterQuery) => Promise<FilterQueryBox>,
): Promise<{ query: any }> {
  return apply(query as FilterQuery);
}
/* eslint-enable @typescript-eslint/no-explicit-any */
