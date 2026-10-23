"use client";

import { ColumnFilterPanel } from "@/components/smsclient/DataTableColumnFilter";
import type { ListColumnFilterSpec } from "@/components/smsclient/listViewTableHelpers";
import {
  LIST_FILTER_SELECT_CONTENT_PROPS,
  LIST_FILTER_SELECT_TRIGGER_CLASS,
  LIST_VIEW_TOOLBAR_BUTTON_SIZE,
  LIST_VIEW_TOOLBAR_OUTLINE_BUTTON_CLASS,
} from "@/components/smsclient/listViewLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { normalizeListFilters } from "@/lib/proto/listFilters";
import { getColumnFilterValue } from "@/lib/proto/listFilterUi";
import { cn } from "@/lib/utils";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { SlidersHorizontal } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

export type ListViewFiltersButtonProps = {
  specs: ListColumnFilterSpec[];
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: (next: ColumnFiltersState) => void;
  sourceOptions?: string[];
  groupOptions?: { id: string; name: string }[];
  className?: string;
};

function filterSpecIsActive(
  spec: ListColumnFilterSpec,
  columnFilters: ColumnFiltersState,
): boolean {
  if (spec.kind === "lastSms") {
    return Boolean(
      getColumnFilterValue(columnFilters, "lastSms") ||
        getColumnFilterValue(columnFilters, "lastSmsBody"),
    );
  }
  return Boolean(getColumnFilterValue(columnFilters, spec.columnId));
}

export function ListViewFiltersButton({
  specs,
  columnFilters,
  onColumnFiltersChange,
  sourceOptions = [],
  groupOptions = [],
  className,
}: ListViewFiltersButtonProps) {
  const { t } = useI18n();
  const activeCount = normalizeListFilters(columnFilters).length;
  const [open, setOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState("");

  const pickDefaultColumnId = useCallback(() => {
    const active = specs.find((s) => filterSpecIsActive(s, columnFilters));
    return active?.columnId ?? specs[0]?.columnId ?? "";
  }, [specs, columnFilters]);

  const selectedSpec = useMemo(
    () => specs.find((s) => s.columnId === selectedColumnId),
    [specs, selectedColumnId],
  );

  if (specs.length === 0) return null;

  return (
    <Popover
      modal={false}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setSelectedColumnId((prev) =>
            prev && specs.some((s) => s.columnId === prev)
              ? prev
              : pickDefaultColumnId(),
          );
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={LIST_VIEW_TOOLBAR_BUTTON_SIZE}
          className={cn(
            LIST_VIEW_TOOLBAR_OUTLINE_BUTTON_CLASS,
            "cursor-pointer",
            className,
          )}
          aria-label={t("listView.filtersAria")}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          {t("listView.filters")}
          {activeCount > 0 ? (
            <span className="ml-1 tabular-nums text-primary">
              ({activeCount})
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[10000] w-[min(100vw-2rem,22rem)] space-y-3 p-3"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full space-y-2">
          <div className="flex min-h-5 items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">
              {t("listView.filtersPickColumn")}
            </Label>
            {activeCount > 0 ? (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto shrink-0 px-0 py-0 text-xs font-medium cursor-pointer"
                onClick={() => onColumnFiltersChange([])}
              >
                {t("listFilter.clearAll")}
              </Button>
            ) : null}
          </div>
          <Select
            value={selectedColumnId || undefined}
            onValueChange={setSelectedColumnId}
          >
            <SelectTrigger
              className={LIST_FILTER_SELECT_TRIGGER_CLASS}
              size="sm"
            >
              <SelectValue placeholder={t("listView.filtersColumnPlaceholder")} />
            </SelectTrigger>
            <SelectContent {...LIST_FILTER_SELECT_CONTENT_PROPS}>
              {specs.map((spec) => {
                const active = filterSpecIsActive(spec, columnFilters);
                return (
                  <SelectItem
                    key={spec.columnId}
                    value={spec.columnId}
                    className="cursor-pointer"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate">{spec.columnLabel}</span>
                      {active ? (
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden
                        />
                      ) : null}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {selectedSpec ? (
          <ColumnFilterPanel
            key={selectedSpec.columnId}
            columnId={selectedSpec.columnId}
            columnLabel={selectedSpec.columnLabel}
            kind={selectedSpec.kind}
            columnFilters={columnFilters}
            onColumnFiltersChange={onColumnFiltersChange}
            sourceOptions={sourceOptions}
            groupOptions={groupOptions}
            closeOnApply={false}
            showColumnLabel={false}
            className="border-t border-border pt-3"
          />
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
