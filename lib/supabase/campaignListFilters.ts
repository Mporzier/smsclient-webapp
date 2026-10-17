import { normalizeListFilters, type ListColumnFilter } from "@/lib/proto/listFilters";
import {
  applyDateColumn,
  applyNumberColumn,
  applyTextColumn,
  type FilterQuery,
} from "@/lib/supabase/listFilterSql";

export type ResolvedCampaignColumn =
  | { kind: "text"; column: string }
  | { kind: "date"; column: string }
  | { kind: "number"; column: string };

export const CAMPAIGN_FILTER_COLUMNS: Record<string, ResolvedCampaignColumn> = {
  createdLabel: { kind: "date", column: "created_at" },
  name: { kind: "text", column: "title" },
  recipients: { kind: "number", column: "recipient_count" },
  status: { kind: "text", column: "status" },
  creditsLabel: { kind: "number", column: "credits_estimated" },
};

export function applyCampaignListFilters(
  query: FilterQuery,
  filters: readonly ListColumnFilter[],
): FilterQuery {
  let next = query;
  for (const filter of normalizeListFilters(filters)) {
    const resolved = CAMPAIGN_FILTER_COLUMNS[filter.id];
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
