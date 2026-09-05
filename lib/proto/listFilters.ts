export const FILTER_SKIP_IDS = new Set(["select", "actions", "avatar"]);

export type ListFilterOp =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "isEmpty"
  | "isNotEmpty"
  | "in"
  | "notIn"
  | "isMemberOf"
  | "isNotMemberOf"
  | "hasNoGroup"
  | "hasAnyGroup"
  | "on"
  | "before"
  | "after"
  | "between"
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte";

export type DatePreset = "today" | "last7" | "last30" | "thisMonth";

export type ListFilterRange = { from: string; to: string };

export type ListFilterValue = {
  op: ListFilterOp;
  value?: string | string[] | ListFilterRange;
};

export type ListColumnFilter = { id: string; value: unknown };

export type NormalizedListFilter = {
  id: string;
  op: ListFilterOp;
  value?: string | string[] | ListFilterRange;
};

export const OPS_WITHOUT_VALUE: ReadonlySet<ListFilterOp> = new Set([
  "isEmpty",
  "isNotEmpty",
  "hasNoGroup",
  "hasAnyGroup",
]);

const OPS: ReadonlySet<string> = new Set<ListFilterOp>([
  "contains",
  "notContains",
  "equals",
  "notEquals",
  "startsWith",
  "isEmpty",
  "isNotEmpty",
  "in",
  "notIn",
  "isMemberOf",
  "isNotMemberOf",
  "hasNoGroup",
  "hasAnyGroup",
  "on",
  "before",
  "after",
  "between",
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
]);

export function isListFilterValue(v: unknown): v is ListFilterValue {
  return (
    typeof v === "object" &&
    v !== null &&
    "op" in v &&
    typeof (v as { op: unknown }).op === "string" &&
    OPS.has((v as { op: string }).op)
  );
}

function valueIsFilled(
  op: ListFilterOp,
  value: ListFilterValue["value"],
): boolean {
  if (OPS_WITHOUT_VALUE.has(op)) return true;
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some((x) => x.trim().length > 0);
  return value.from.trim().length > 0 && value.to.trim().length > 0;
}

export function normalizeListFilters(
  filters: readonly ListColumnFilter[],
): NormalizedListFilter[] {
  const out: NormalizedListFilter[] = [];
  for (const f of filters) {
    if (FILTER_SKIP_IDS.has(f.id)) continue;
    if (!isListFilterValue(f.value)) continue;
    if (!valueIsFilled(f.value.op, f.value.value)) continue;
    const trimmed =
      typeof f.value.value === "string" ? f.value.value.trim() : f.value.value;
    out.push({ id: f.id, op: f.value.op, value: trimmed });
  }
  return out;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function civilDayBounds(isoDate: string): {
  startIso: string;
  endIso: string;
} {
  const [y, m, d] = isoDate.split("-").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export function expandDatePreset(
  preset: DatePreset,
  now: Date,
): { op: "on" | "between"; value: string | { from: string; to: string } } {
  if (preset === "today") return { op: "on", value: ymd(now) };
  if (preset === "last7") {
    const from = new Date(now);
    from.setDate(from.getDate() - 6);
    return { op: "between", value: { from: ymd(from), to: ymd(now) } };
  }
  if (preset === "last30") {
    const from = new Date(now);
    from.setDate(from.getDate() - 29);
    return { op: "between", value: { from: ymd(from), to: ymd(now) } };
  }
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { op: "between", value: { from: ymd(from), to: ymd(to) } };
}

export function listFiltersKey(filters: readonly ListColumnFilter[]): string {
  return JSON.stringify(normalizeListFilters(filters));
}
