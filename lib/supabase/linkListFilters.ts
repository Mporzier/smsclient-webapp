import { normalizeListFilters, type ListColumnFilter } from "@/lib/proto/listFilters";
import {
  applyDateColumn,
  applyNumberColumn,
  applyTextColumn,
  type FilterQuery,
} from "@/lib/supabase/listFilterSql";

export type ResolvedLinkColumn =
  | { kind: "text"; column: string }
  | { kind: "date"; column: string }
  | { kind: "number"; column: string };

export const LINK_FILTER_COLUMNS: Record<string, ResolvedLinkColumn> = {
  createdLabel: { kind: "date", column: "created_at" },
  label: { kind: "text", column: "label" },
  description: { kind: "text", column: "description" },
  originalUrl: { kind: "text", column: "original_url" },
  clickCount: { kind: "number", column: "click_count" },
};

export function applyLinkListFilters(
  query: FilterQuery,
  filters: readonly ListColumnFilter[],
): FilterQuery {
  let next = query;
  for (const filter of normalizeListFilters(filters)) {
    const resolved = LINK_FILTER_COLUMNS[filter.id];
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
