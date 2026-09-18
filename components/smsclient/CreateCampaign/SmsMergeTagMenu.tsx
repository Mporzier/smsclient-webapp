"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cn";
import type { CustomFieldDef } from "@/lib/types/customFields";
import {
  formatBirthdayShort,
  mergeTagToken,
  SMS_ANNIVERSAIRE_PREVIEW_ISO,
  SMS_NOM_PREVIEW_SAMPLE,
  SMS_PRENOM_PREVIEW_SAMPLE,
  SYSTEM_MERGE_LABELS,
  type MergeTagKey,
} from "@/lib/proto/smsPersonalization";
import {
  filledCountForMergeKey,
  formatMergeFillSuffix,
  type MergeFillCounts,
  type MergeFillStatus,
} from "@/lib/proto/smsMergeFill";
import { Tag } from "lucide-react";

export type MergeTagChoice = {
  key: MergeTagKey;
  label: string;
  token: string;
  /** Valeur d’exemple affichée pour montrer le remplacement. */
  example: string;
};

export function listMergeTagKeys(
  defs: readonly CustomFieldDef[] = [],
): MergeTagChoice[] {
  const system: { key: MergeTagKey; label: string; example: string }[] = [
    {
      key: "prenom",
      label: SYSTEM_MERGE_LABELS.prenom,
      example: SMS_PRENOM_PREVIEW_SAMPLE,
    },
    {
      key: "nom",
      label: SYSTEM_MERGE_LABELS.nom,
      example: SMS_NOM_PREVIEW_SAMPLE,
    },
    {
      key: "anniversaire",
      label: SYSTEM_MERGE_LABELS.anniversaire,
      example: formatBirthdayShort(SMS_ANNIVERSAIRE_PREVIEW_ISO),
    },
  ];
  const custom = defs.map((d) => ({
    key: `custom:${d.id}` as MergeTagKey,
    label: d.label.trim() || "Champ",
    example: "valeur du contact",
  }));
  return [...system, ...custom].map((item) => ({
    ...item,
    token: mergeTagToken(item.key, defs),
  }));
}

function MergeFillBadge({
  itemKey,
  fillCounts,
  fillStatus,
}: {
  itemKey: MergeTagKey;
  fillCounts?: MergeFillCounts;
  fillStatus?: MergeFillStatus;
}) {
  if (!fillStatus || fillStatus === "error" || fillStatus === "na") {
    return null;
  }
  if (fillStatus === "loading") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold leading-none text-muted-foreground">
        …
      </span>
    );
  }
  if (!fillCounts || fillCounts.total <= 0) return null;
  const filled = filledCountForMergeKey(fillCounts, itemKey);
  const total = fillCounts.total;
  const safe = Math.min(Math.max(0, filled), total);
  const pct = Math.round((safe / total) * 100);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-bold leading-none tabular-nums",
        pct >= 90
          ? "border-emerald-200/90 bg-emerald-50 text-emerald-800"
          : pct >= 50
            ? "border-amber-200/90 bg-amber-50 text-amber-900"
            : "border-slate-200 bg-slate-50 text-slate-600",
      )}
      title={formatMergeFillSuffix(safe, total)}
    >
      {pct}%
    </span>
  );
}

export function SmsMergeTagMenu({
  defs = [],
  onInsert,
  contentClassName,
  fillCounts,
  fillStatus,
  disabled = false,
}: {
  defs?: readonly CustomFieldDef[];
  onInsert: (token: string) => void;
  /** Menu portalisé en z-50 : à surcharger dans une Dialog (z plus haut). */
  contentClassName?: string;
  fillCounts?: MergeFillCounts;
  fillStatus?: MergeFillStatus;
  disabled?: boolean;
}) {
  const items = listMergeTagKeys(defs).filter((i) => i.token);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 gap-1.5 rounded-lg px-2.5 text-[11px] font-bold"
        >
          <Tag className="size-3.5" aria-hidden />
          Insérer une info du contact
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn("w-72", contentClassName)}
      >
        <DropdownMenuLabel>
          Remplacée par la valeur de chaque contact à l’envoi.
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {items.map((item) => (
            <DropdownMenuItem
              key={item.key}
              className="flex items-center justify-between gap-2"
              onSelect={() => onInsert(item.token)}
            >
              <span className="min-w-0 truncate font-medium">{item.label}</span>
              {fillStatus ? (
                <MergeFillBadge
                  itemKey={item.key}
                  fillCounts={fillCounts}
                  fillStatus={fillStatus}
                />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SmsMergeTagChecklist({
  defs = [],
  selected,
  onChange,
  className,
  fillCounts,
  fillStatus,
}: {
  defs?: readonly CustomFieldDef[];
  selected: readonly MergeTagKey[];
  onChange: (next: MergeTagKey[]) => void;
  className?: string;
  fillCounts?: MergeFillCounts;
  fillStatus?: MergeFillStatus;
}) {
  const items = listMergeTagKeys(defs).filter((i) => i.token);
  const selectedSet = new Set(selected);

  return (
    <div className={cn("space-y-2", className)}>
      <p className="m-0 text-xs font-bold text-slate-800">
        Infos du contact à inclure
      </p>
      <p className="m-0 text-[11px] font-semibold text-slate-500">
        L’IA place ces infos dans le message. Chaque contact reçoit sa propre
        valeur à l’envoi.
      </p>
      <ul className="m-0 list-none space-y-1.5 p-0">
        {items.map((item) => {
          const checked = selectedSet.has(item.key);
          const id = `merge-tag-${item.key}`;
          return (
            <li key={item.key} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(v) => {
                  const on = v === true;
                  if (on) onChange([...selected, item.key]);
                  else onChange(selected.filter((k) => k !== item.key));
                }}
              />
              <label
                htmlFor={id}
                className="min-w-0 flex-1 cursor-pointer text-xs font-semibold"
              >
                {item.label}{" "}
                <span className="font-normal text-muted-foreground">
                  (ex. {item.example}
                  {fillStatus ? (
                    <>
                      {" · "}
                      <MergeFillBadge
                        itemKey={item.key}
                        fillCounts={fillCounts}
                        fillStatus={fillStatus}
                      />
                    </>
                  ) : null}
                  )
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
