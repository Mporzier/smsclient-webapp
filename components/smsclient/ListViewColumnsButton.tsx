"use client";

import {
  LIST_VIEW_TOOLBAR_BUTTON_SIZE,
  LIST_VIEW_TOOLBAR_OUTLINE_BUTTON_CLASS,
} from "@/components/smsclient/listViewLayout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { VisibilityState } from "@tanstack/react-table";
import { TableProperties } from "lucide-react";

export type ListColumnToggleOption = {
  id: string;
  label: string;
};

export type ListViewColumnsButtonProps = {
  options: ListColumnToggleOption[];
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (next: VisibilityState) => void;
  className?: string;
};

export function ListViewColumnsButton({
  options,
  columnVisibility,
  onColumnVisibilityChange,
  className,
}: ListViewColumnsButtonProps) {
  const { t } = useI18n();

  if (options.length === 0) return null;

  const hiddenCount = options.filter(
    (o) => columnVisibility[o.id] === false,
  ).length;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={LIST_VIEW_TOOLBAR_BUTTON_SIZE}
          className={cn(
            LIST_VIEW_TOOLBAR_OUTLINE_BUTTON_CLASS,
            "cursor-pointer",
            className,
          )}
          aria-label={t("listView.columnsAria")}
        >
          <TableProperties className="size-4" aria-hidden />
          {t("listView.columns")}
          {hiddenCount > 0 ? (
            <span className="ml-1 tabular-nums text-muted-foreground">
              (−{hiddenCount})
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="z-[10000] w-56 p-0">
        <div className="max-h-60 overflow-y-auto p-1">
        {options.map((opt) => {
          const visible = columnVisibility[opt.id] !== false;
          return (
            <DropdownMenuCheckboxItem
              key={opt.id}
              className="cursor-pointer"
              checked={visible}
              onCheckedChange={(checked) => {
                const next = { ...columnVisibility };
                if (checked) delete next[opt.id];
                else next[opt.id] = false;
                onColumnVisibilityChange(next);
              }}
              onSelect={(e) => e.preventDefault()}
            >
              {opt.label}
            </DropdownMenuCheckboxItem>
          );
        })}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="flex justify-end p-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={hiddenCount === 0}
            onClick={() => onColumnVisibilityChange({})}
          >
            {t("listView.columnsReset")}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
