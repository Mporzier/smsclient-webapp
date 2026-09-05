"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
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
import { useI18n, type MessageKey } from "@/lib/i18n";
import {
  expandDatePreset,
  type DatePreset,
  type ListFilterOp,
  type ListFilterValue,
} from "@/lib/proto/listFilters";
import {
  getColumnFilterValue,
  LAST_SMS_BODY_OPS,
  opNeedsValue,
  opsForKind,
  type ColumnFilterKind,
} from "@/lib/proto/listFilterUi";
import { cn } from "@/lib/utils";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { ListFilter } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

export type DataTableColumnFilterProps = {
  columnId: string;
  columnLabel: string;
  kind: ColumnFilterKind;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: (next: ColumnFiltersState) => void;
  sourceOptions?: string[];
  groupOptions?: { id: string; name: string }[];
};

function opLabelKey(op: ListFilterOp): MessageKey {
  return `listFilter.op.${op}` as MessageKey;
}

function isMultiOp(op: ListFilterOp): boolean {
  return op === "in" || op === "notIn" || op === "isMemberOf" || op === "isNotMemberOf";
}

function isRangeOp(op: ListFilterOp): boolean {
  return op === "between";
}

function isDateOp(op: ListFilterOp): boolean {
  return op === "on" || op === "before" || op === "after" || op === "between";
}

type FilterEditorProps = {
  kind: ColumnFilterKind;
  op: ListFilterOp;
  draft: ListFilterValue;
  onDraftChange: (next: ListFilterValue) => void;
  sourceOptions: string[];
  groupOptions: { id: string; name: string }[];
};

function FilterValueEditor({
  kind,
  op,
  draft,
  onDraftChange,
  sourceOptions,
  groupOptions,
}: FilterEditorProps) {
  const { t } = useI18n();

  if (!opNeedsValue(op)) return null;

  if (isMultiOp(op)) {
    const selected = new Set(
      Array.isArray(draft.value) ? draft.value : [],
    );
    const options =
      kind === "source"
        ? sourceOptions.map((s) => ({ id: s, label: s }))
        : groupOptions.map((g) => ({ id: g.id, label: g.name }));

    return (
      <div className="max-h-40 space-y-2 overflow-y-auto">
        {options.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("listFilter.noOptions")}</p>
        ) : (
          options.map((opt) => (
            <label
              key={opt.id}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={selected.has(opt.id)}
                onCheckedChange={(checked) => {
                  const next = new Set(selected);
                  if (checked) next.add(opt.id);
                  else next.delete(opt.id);
                  onDraftChange({ op, value: [...next] });
                }}
              />
              <span className="truncate">{opt.label}</span>
            </label>
          ))
        )}
      </div>
    );
  }

  if (isRangeOp(op)) {
    const range =
      draft.value && typeof draft.value === "object" && !Array.isArray(draft.value)
        ? draft.value
        : { from: "", to: "" };
    const useDate = kind === "date" || kind === "lastSms";
    return (
      <div className="flex flex-col gap-2">
        {useDate ? (
          <>
            <DatePicker
              value={range.from}
              onChange={(from) =>
                onDraftChange({ op, value: { ...range, from } })
              }
              placeholder={t("listFilter.rangeFrom")}
            />
            <DatePicker
              value={range.to}
              onChange={(to) =>
                onDraftChange({ op, value: { ...range, to } })
              }
              placeholder={t("listFilter.rangeTo")}
            />
          </>
        ) : (
          <>
            <Input
              type="number"
              value={range.from}
              onChange={(e) =>
                onDraftChange({
                  op,
                  value: { ...range, from: e.target.value },
                })
              }
              placeholder={t("listFilter.rangeFrom")}
            />
            <Input
              type="number"
              value={range.to}
              onChange={(e) =>
                onDraftChange({
                  op,
                  value: { ...range, to: e.target.value },
                })
              }
              placeholder={t("listFilter.rangeTo")}
            />
          </>
        )}
      </div>
    );
  }

  if (isDateOp(op)) {
    const iso = typeof draft.value === "string" ? draft.value : "";
    return (
      <DatePicker
        value={iso}
        onChange={(v) => onDraftChange({ op, value: v })}
        placeholder={t("listFilter.valuePlaceholder")}
      />
    );
  }

  if (kind === "number") {
    return (
      <Input
        type="number"
        value={typeof draft.value === "string" ? draft.value : ""}
        onChange={(e) => onDraftChange({ op, value: e.target.value })}
        placeholder={t("listFilter.valuePlaceholder")}
      />
    );
  }

  return (
    <Input
      value={typeof draft.value === "string" ? draft.value : ""}
      onChange={(e) => onDraftChange({ op, value: e.target.value })}
      placeholder={t("listFilter.valuePlaceholder")}
    />
  );
}

const DATE_PRESETS: DatePreset[] = ["today", "last7", "last30", "thisMonth"];

function presetLabelKey(p: DatePreset): MessageKey {
  return `listFilter.preset.${p}` as MessageKey;
}

const DATE_FILTER_OPS = new Set<ListFilterOp>([
  "on",
  "before",
  "after",
  "between",
]);

export function DataTableColumnFilter({
  columnId,
  columnLabel,
  kind,
  columnFilters,
  onColumnFiltersChange,
  sourceOptions = [],
  groupOptions = [],
}: DataTableColumnFilterProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const active =
    kind === "lastSms"
      ? Boolean(
          getColumnFilterValue(columnFilters, "lastSms") ||
            getColumnFilterValue(columnFilters, "lastSmsBody"),
        )
      : Boolean(getColumnFilterValue(columnFilters, columnId));

  const defaultOp = opsForKind(kind)[0]!;

  const current = getColumnFilterValue(columnFilters, columnId);
  const [draftOp, setDraftOp] = useState<ListFilterOp>(current?.op ?? defaultOp);
  const [draft, setDraft] = useState<ListFilterValue>(
    current ?? { op: defaultOp, value: "" },
  );

  const bodyCurrent = getColumnFilterValue(columnFilters, "lastSmsBody");
  const [bodyOp, setBodyOp] = useState<ListFilterOp>(
    bodyCurrent?.op ?? "contains",
  );
  const [bodyDraft, setBodyDraft] = useState<ListFilterValue>(
    bodyCurrent ?? { op: "contains", value: "" },
  );

  const resetDraft = useCallback(() => {
    const cur = getColumnFilterValue(columnFilters, columnId);
    const op = cur?.op ?? defaultOp;
    setDraftOp(op);
    setDraft(cur ?? { op, value: "" });
    if (kind === "lastSms") {
      const b = getColumnFilterValue(columnFilters, "lastSmsBody");
      setBodyOp(b?.op ?? "contains");
      setBodyDraft(b ?? { op: "contains", value: "" });
    }
  }, [columnFilters, columnId, defaultOp, kind]);

  const apply = useCallback(() => {
    let next = columnFilters.filter(
      (f) => f.id !== columnId && f.id !== "lastSmsBody",
    );
    if (opNeedsValue(draftOp)) {
      next = [...next, { id: columnId, value: { op: draftOp, value: draft.value } }];
    } else {
      next = [...next, { id: columnId, value: { op: draftOp } }];
    }
    if (kind === "lastSms") {
      const hasBody =
        opNeedsValue(bodyOp) &&
        typeof bodyDraft.value === "string" &&
        bodyDraft.value.trim();
      const bodyEmptyOp = bodyOp === "isEmpty" || bodyOp === "isNotEmpty";
      if (hasBody || bodyEmptyOp) {
        next = [
          ...next,
          {
            id: "lastSmsBody",
            value: bodyEmptyOp
              ? { op: bodyOp }
              : { op: bodyOp, value: bodyDraft.value },
          },
        ];
      }
    }
    onColumnFiltersChange(next);
    setOpen(false);
  }, [
    bodyDraft.value,
    bodyOp,
    columnFilters,
    columnId,
    draft.value,
    draftOp,
    kind,
    onColumnFiltersChange,
  ]);

  const clear = useCallback(() => {
    onColumnFiltersChange(
      columnFilters.filter(
        (f) => f.id !== columnId && f.id !== "lastSmsBody",
      ),
    );
    setOpen(false);
  }, [columnFilters, columnId, onColumnFiltersChange]);

  const ops = useMemo(() => opsForKind(kind), [kind]);

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) resetDraft();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(
            "size-6 shrink-0 rounded-full",
            active && "text-primary",
          )}
          aria-label={t("listFilter.aria", { column: columnLabel })}
          onClick={(e) => e.stopPropagation()}
        >
          <ListFilter className="size-3.5" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[10000] w-72 space-y-3 p-3"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <Label className="text-xs">{columnLabel}</Label>
          <Select
            value={draftOp}
            onValueChange={(v) => {
              const op = v as ListFilterOp;
              setDraftOp(op);
              setDraft({ op, value: isRangeOp(op) ? { from: "", to: "" } : "" });
            }}
          >
            <SelectTrigger className="w-full" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[10001]">
              {ops.map((op) => (
                <SelectItem key={op} value={op}>
                  {t(opLabelKey(op))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(kind === "date" || kind === "lastSms") &&
          DATE_FILTER_OPS.has(draftOp) ? (
            <div className="flex flex-wrap gap-1">
              {DATE_PRESETS.map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const expanded = expandDatePreset(p, new Date());
                    setDraftOp(expanded.op);
                    setDraft(expanded);
                  }}
                >
                  {t(presetLabelKey(p))}
                </Button>
              ))}
            </div>
          ) : null}
          <FilterValueEditor
            kind={kind}
            op={draftOp}
            draft={draft}
            onDraftChange={(next) => {
              setDraftOp(next.op);
              setDraft(next);
            }}
            sourceOptions={sourceOptions}
            groupOptions={groupOptions}
          />
        </div>

        {kind === "lastSms" ? (
          <div className="space-y-2 border-t border-border pt-3">
            <Label className="text-xs">{t("listFilter.lastSms.body")}</Label>
            <Select
              value={bodyOp}
              onValueChange={(v) => {
                const op = v as ListFilterOp;
                setBodyOp(op);
                setBodyDraft({ op, value: "" });
              }}
            >
              <SelectTrigger className="w-full" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[10001]">
                {LAST_SMS_BODY_OPS.map((op) => (
                  <SelectItem key={op} value={op}>
                    {t(opLabelKey(op))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {bodyOp === "contains" ? (
              <Input
                value={
                  typeof bodyDraft.value === "string" ? bodyDraft.value : ""
                }
                onChange={(e) =>
                  setBodyDraft({ op: bodyOp, value: e.target.value })
                }
                placeholder={t("listFilter.valuePlaceholder")}
              />
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-border pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            {t("listFilter.clear")}
          </Button>
          <Button type="button" size="sm" onClick={apply}>
            {t("listFilter.apply")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
