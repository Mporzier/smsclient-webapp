import { normalizeListFilters, type ListColumnFilter } from "@/lib/proto/listFilters";
import {
  applyDateColumn,
  applyNumberColumn,
  applyTextColumn,
  type FilterQuery,
} from "@/lib/supabase/listFilterSql";

export type ResolvedGroupColumn =
  | { kind: "text"; column: string }
  | { kind: "date"; column: string }
  | { kind: "number"; column: string };

export const GROUP_FILTER_COLUMNS: Record<string, ResolvedGroupColumn> = {
  name: { kind: "text", column: "name" },
  description: { kind: "text", column: "description" },
  contactCount: { kind: "number", column: "member_count" },
  lastCampaignLabel: { kind: "date", column: "last_campaign_at" },
  createdLabel: { kind: "date", column: "created_at" },
};

export function resolveGroupFilterColumn(
  id: string,
): ResolvedGroupColumn | null {
  return GROUP_FILTER_COLUMNS[id] ?? null;
}

export function applyGroupListFilters(
  query: FilterQuery,
  filters: readonly ListColumnFilter[],
): FilterQuery {
  let next = query;
  for (const filter of normalizeListFilters(filters)) {
    const resolved = resolveGroupFilterColumn(filter.id);
    if (!resolved) continue;
    if (resolved.kind === "text") {
      next = applyTextColumn(next, resolved.column, filter);
      continue;
    }
    if (resolved.kind === "date") {
      next = applyDateColumn(next, resolved.column, filter);
      continue;
    }
    next = applyNumberColumn(next, resolved.column, filter, true);
  }
  return next;
}
