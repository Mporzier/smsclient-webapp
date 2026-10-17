import { normalizeListFilters, type ListColumnFilter } from "@/lib/proto/listFilters";
import {
  applyDateColumn,
  applyTextColumn,
  type FilterQuery,
} from "@/lib/supabase/listFilterSql";

export type ResolvedTemplateColumn =
  | { kind: "text"; column: string }
  | { kind: "date"; column: string };

export const TEMPLATE_FILTER_COLUMNS: Record<string, ResolvedTemplateColumn> = {
  createdLabel: { kind: "date", column: "created_at" },
  title: { kind: "text", column: "title" },
  description: { kind: "text", column: "description" },
  body: { kind: "text", column: "body" },
};

export function applyTemplateListFilters(
  query: FilterQuery,
  filters: readonly ListColumnFilter[],
): FilterQuery {
  let next = query;
  for (const filter of normalizeListFilters(filters)) {
    const resolved = TEMPLATE_FILTER_COLUMNS[filter.id];
    if (!resolved) continue;
    if (resolved.kind === "text") {
      next = applyTextColumn(next, resolved.column, filter);
      continue;
    }
    next = applyDateColumn(next, resolved.column, filter);
  }
  return next;
}
