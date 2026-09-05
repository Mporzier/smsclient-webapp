import type { ColumnFiltersState } from "@tanstack/react-table";
import type { CustomFieldDef } from "@/lib/types/customFields";
import {
  isListFilterValue,
  type ListFilterOp,
  type ListFilterValue,
} from "@/lib/proto/listFilters";

export type ColumnFilterKind =
  | "text"
  | "source"
  | "groups"
  | "date"
  | "number"
  | "lastSms";

export const TEXT_OPS: ListFilterOp[] = [
  "contains",
  "notContains",
  "equals",
  "notEquals",
  "startsWith",
  "isEmpty",
  "isNotEmpty",
];

export const SOURCE_OPS: ListFilterOp[] = [...TEXT_OPS, "in", "notIn"];

export const GROUP_OPS: ListFilterOp[] = [
  "isMemberOf",
  "isNotMemberOf",
  "hasNoGroup",
  "hasAnyGroup",
];

export const DATE_OPS: ListFilterOp[] = [
  "on",
  "before",
  "after",
  "between",
  "isEmpty",
  "isNotEmpty",
];

export const NUMBER_OPS: ListFilterOp[] = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "between",
  "isEmpty",
  "isNotEmpty",
];

export const LAST_SMS_BODY_OPS: ListFilterOp[] = [
  "contains",
  "isEmpty",
  "isNotEmpty",
];

export function getColumnFilterValue(
  filters: ColumnFiltersState,
  id: string,
): ListFilterValue | undefined {
  const entry = filters.find((f) => f.id === id);
  if (!entry || !isListFilterValue(entry.value)) return undefined;
  return entry.value;
}

export function upsertColumnFilter(
  prev: ColumnFiltersState,
  id: string,
  value: ListFilterValue | undefined,
): ColumnFiltersState {
  const rest = prev.filter((f) => f.id !== id);
  if (!value) return rest;
  return [...rest, { id, value }];
}

export function removeColumnFilters(
  prev: ColumnFiltersState,
  ids: readonly string[],
): ColumnFiltersState {
  const drop = new Set(ids);
  return prev.filter((f) => !drop.has(f.id));
}

export function contactColumnFilterKind(
  columnId: string,
  customFieldDefs: readonly CustomFieldDef[],
): ColumnFilterKind | null {
  if (columnId === "source") return "source";
  if (columnId === "groups") return "groups";
  if (columnId === "lastSms") return "lastSms";
  if (columnId === "created") return "date";
  if (columnId.startsWith("custom_")) {
    const fieldId = columnId.slice("custom_".length);
    const def = customFieldDefs.find((d) => d.id === fieldId);
    if (!def) return "text";
    if (def.fieldType === "number") return "number";
    if (def.fieldType === "date") return "date";
    return "text";
  }
  const textIds = new Set([
    "firstName",
    "lastName",
    "phone",
    "notes",
  ]);
  if (textIds.has(columnId)) return "text";
  return null;
}

export function groupColumnFilterKind(
  columnId: string,
): ColumnFilterKind | null {
  if (columnId === "name" || columnId === "description") return "text";
  if (columnId === "contactCount") return "number";
  if (columnId === "createdLabel" || columnId === "lastCampaignLabel") {
    return "date";
  }
  return null;
}

export function opsForKind(kind: ColumnFilterKind): ListFilterOp[] {
  switch (kind) {
    case "text":
      return TEXT_OPS;
    case "source":
      return SOURCE_OPS;
    case "groups":
      return GROUP_OPS;
    case "date":
      return DATE_OPS;
    case "number":
      return NUMBER_OPS;
    case "lastSms":
      return DATE_OPS;
    default:
      return TEXT_OPS;
  }
}

export function opNeedsValue(op: ListFilterOp): boolean {
  return !(
    op === "isEmpty" ||
    op === "isNotEmpty" ||
    op === "hasNoGroup" ||
    op === "hasAnyGroup"
  );
}

export function formatFilterValueBrief(
  value: ListFilterValue | undefined,
): string {
  if (!value) return "";
  if (!opNeedsValue(value.op)) return "";
  const v = value.value;
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.join(", ");
  if (v && typeof v === "object") return `${v.from} – ${v.to}`;
  return "";
}

export function customFieldTypesFromDefs(
  defs: readonly CustomFieldDef[],
): Record<string, CustomFieldDef["fieldType"]> {
  const out: Record<string, CustomFieldDef["fieldType"]> = {};
  for (const d of defs) out[d.id] = d.fieldType;
  return out;
}
