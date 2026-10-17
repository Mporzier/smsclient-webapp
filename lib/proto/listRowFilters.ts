import {
  civilDayBounds,
  normalizeListFilters,
  type ListColumnFilter,
  type ListFilterOp,
  type NormalizedListFilter,
} from "@/lib/proto/listFilters";

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function matchText(cell: string, filter: NormalizedListFilter): boolean {
  const hay = norm(cell);
  const op = filter.op;
  if (op === "isEmpty") return hay.length === 0 || hay === "—";
  if (op === "isNotEmpty") return hay.length > 0 && hay !== "—";
  const v = typeof filter.value === "string" ? filter.value : "";
  const needle = norm(v);
  switch (op) {
    case "contains":
      return hay.includes(needle);
    case "notContains":
      return !hay.includes(needle);
    case "equals":
      return hay === needle;
    case "notEquals":
      return hay !== needle;
    case "startsWith":
      return hay.startsWith(needle);
    default:
      return true;
  }
}

function parseDisplayDate(cell: string): Date | null {
  const t = cell.trim();
  if (!t || t === "—") return null;
  const m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function matchDate(cell: string, filter: NormalizedListFilter): boolean {
  const op = filter.op as ListFilterOp;
  const d = parseDisplayDate(cell);
  if (op === "isEmpty") return d == null;
  if (op === "isNotEmpty") return d != null;
  if (d == null) return false;
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (op === "on" && typeof filter.value === "string") {
    return day === filter.value;
  }
  if (op === "before" && typeof filter.value === "string") {
    const { startIso } = civilDayBounds(filter.value);
    return d.getTime() < new Date(startIso).getTime();
  }
  if (op === "after" && typeof filter.value === "string") {
    const { endIso } = civilDayBounds(filter.value);
    return d.getTime() > new Date(endIso).getTime();
  }
  if (op === "between" && filter.value && typeof filter.value === "object" && !Array.isArray(filter.value)) {
    const from = civilDayBounds(filter.value.from);
    const to = civilDayBounds(filter.value.to);
    const t = d.getTime();
    return t >= new Date(from.startIso).getTime() && t <= new Date(to.endIso).getTime();
  }
  return true;
}

function matchNumber(raw: string | number, filter: NormalizedListFilter): boolean {
  const op = filter.op;
  const n =
    typeof raw === "number"
      ? raw
      : Number(String(raw).replace(/[^\d.-]/g, ""));
  if (op === "isEmpty") return !Number.isFinite(n) || n === 0;
  if (op === "isNotEmpty") return Number.isFinite(n) && n !== 0;
  if (!Number.isFinite(n)) return false;
  const v = typeof filter.value === "string" ? Number(filter.value) : NaN;
  if (!Number.isFinite(v)) return false;
  switch (op) {
    case "eq":
      return n === v;
    case "neq":
      return n !== v;
    case "gt":
      return n > v;
    case "gte":
      return n >= v;
    case "lt":
      return n < v;
    case "lte":
      return n <= v;
    default:
      return true;
  }
}

export type RowFilterColumnKind = "text" | "date" | "number";

export function rowMatchesListFilters<T extends object>(
  row: T,
  filters: readonly ListColumnFilter[],
  resolve: (columnId: string, row: T) => { kind: RowFilterColumnKind; value: string | number } | null,
): boolean {
  for (const filter of normalizeListFilters(filters)) {
    const cell = resolve(filter.id, row);
    if (!cell) return false;
    if (cell.kind === "text" && !matchText(String(cell.value), filter)) return false;
    if (cell.kind === "date" && !matchDate(String(cell.value), filter)) return false;
    if (cell.kind === "number" && !matchNumber(cell.value, filter)) return false;
  }
  return true;
}
