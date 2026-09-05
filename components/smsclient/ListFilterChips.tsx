"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n, type MessageKey } from "@/lib/i18n";
import {
  formatFilterValueBrief,
} from "@/lib/proto/listFilterUi";
import {
  isListFilterValue,
  type ListFilterOp,
  type ListFilterValue,
} from "@/lib/proto/listFilters";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { X } from "lucide-react";

type ListFilterChipsProps = {
  filters: ColumnFiltersState;
  labels: Record<string, string>;
  onClearId: (id: string) => void;
  onClearAll: () => void;
};

function opLabelKey(op: ListFilterOp): MessageKey {
  return `listFilter.op.${op}` as MessageKey;
}

export function ListFilterChips({
  filters,
  labels,
  onClearId,
  onClearAll,
}: ListFilterChipsProps) {
  const { t } = useI18n();
  const active = filters.filter((f) => isListFilterValue(f.value));
  if (active.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {active.map((f) => {
        const val = f.value as ListFilterValue;
        const op = val.op;
        const brief = formatFilterValueBrief(val);
        const column = labels[f.id] ?? f.id;
        const opText = t(opLabelKey(op));
        const chipText = brief
          ? t("listFilter.chipBody", { column, op: opText, value: brief })
          : t("listFilter.chipBodyNoValue", { column, op: opText });
        return (
          <Badge
            key={f.id}
            variant="secondary"
            className="gap-1 pr-1 font-normal"
          >
            <span className="max-w-[240px] truncate">{chipText}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-5 shrink-0 rounded-full"
              aria-label={t("listFilter.clear")}
              onClick={() => onClearId(f.id)}
            >
              <X className="size-3" aria-hidden />
            </Button>
          </Badge>
        );
      })}
      {active.length > 1 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onClearAll}
        >
          {t("listFilter.clearAll")}
        </Button>
      ) : null}
    </div>
  );
}
