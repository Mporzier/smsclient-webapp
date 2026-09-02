"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
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

export function SmsMergeTagMenu({
  defs = [],
  onInsert,
}: {
  defs?: readonly CustomFieldDef[];
  onInsert: (token: string) => void;
}) {
  const items = listMergeTagKeys(defs).filter((i) => i.token);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-lg px-2.5 text-[11px] font-bold"
        >
          <Tag className="size-3.5" aria-hidden />
          Insérer une info du contact
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-80 max-w-96">
        <div className="sticky top-0 z-10 -mx-1 -mt-1 bg-popover px-1 pt-1">
          <DropdownMenuLabel className="py-0.5 text-[11px] leading-snug font-medium">
            Remplacée par la valeur de chaque contact à l’envoi.
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
        </div>
        {items.map((item) => (
          <DropdownMenuItem
            key={item.key}
            className="flex-col items-start gap-0 whitespace-normal py-1"
            onSelect={() => onInsert(item.token)}
          >
            <span className="text-[13px] font-medium leading-tight">
              {item.label}
            </span>
            <span className="text-[11px] leading-tight text-muted-foreground">
              Ex. « {item.example} »
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SmsMergeTagChecklist({
  defs = [],
  selected,
  onChange,
  className,
}: {
  defs?: readonly CustomFieldDef[];
  selected: readonly MergeTagKey[];
  onChange: (next: MergeTagKey[]) => void;
  className?: string;
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
                  (ex. {item.example})
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
