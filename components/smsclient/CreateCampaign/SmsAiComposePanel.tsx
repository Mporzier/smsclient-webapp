"use client";

import { cn } from "@/lib/cn";
import { brandBtnPrimaryCls } from "@/components/smsclient/modals/modalChrome";
import { Button } from "@/components/ui/button";
import {
  SmsAiOptionCards,
  type SmsAiOptions,
} from "@/components/smsclient/CreateCampaign/SmsAiOptionCards";
import { SmsMergeTagChecklist } from "@/components/smsclient/CreateCampaign/SmsMergeTagMenu";
import type { CustomFieldDef } from "@/lib/types/customFields";
import type { MergeFillCounts, MergeFillStatus } from "@/lib/proto/smsMergeFill";
import type { LinkRowData } from "@/lib/types/link";
import { stripStopMention } from "@/lib/proto/smsStopMention";
import { Spinner } from "@/components/ui/spinner";
import { ChevronDown, Check, SlidersHorizontal, Sparkles } from "lucide-react";

const VARIANT_LABELS = ["Direct", "Chaleureux", "Dynamique"] as const;

type SmsAiComposePanelProps = {
  options: SmsAiOptions;
  onOptionsChange: (patch: Partial<SmsAiOptions>) => void;
  savedLinks: LinkRowData[];
  linksLoading?: boolean;
  selectedLinkId: string | null;
  onSelectLink: (link: LinkRowData) => void;
  onCreateLink?: (args: {
    originalUrl: string;
    label: string;
  }) => Promise<{ data: LinkRowData | null; error: string | null }>;
  generating: boolean;
  onGenerate: () => void;
  optionsOpen: boolean;
  onOptionsOpenChange: (open: boolean) => void;
  variants: string[];
  selectedVariant: string | null;
  onSelectVariant: (variant: string) => void;
  customFieldDefs?: CustomFieldDef[];
  mergeFillCounts?: MergeFillCounts;
  mergeFillStatus?: MergeFillStatus;
};

export function SmsAiComposePanel({
  options,
  onOptionsChange,
  savedLinks,
  linksLoading = false,
  selectedLinkId,
  onSelectLink,
  onCreateLink,
  generating,
  onGenerate,
  optionsOpen,
  onOptionsOpenChange,
  variants,
  selectedVariant,
  onSelectVariant,
  customFieldDefs = [],
  mergeFillCounts,
  mergeFillStatus,
}: SmsAiComposePanelProps) {
  const hasVariants = variants.length > 0;

  return (
    <div className="shrink-0 space-y-2.5 border-t border-slate-100 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-expanded={optionsOpen}
          onClick={() => onOptionsOpenChange(!optionsOpen)}
          className={cn(
            "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors",
            optionsOpen
              ? "border-[#2f6fed]/35 bg-[#eef4ff] text-[#1f3b77]"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          Options IA
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              optionsOpen && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        {!hasVariants ? (
          <Button
            variant="default"
            size="lg"
            className={cn(
              brandBtnPrimaryCls,
              "h-10 min-w-0 flex-1 gap-2 px-4 text-sm sm:flex-none",
            )}
            disabled={generating}
            onClick={onGenerate}
          >
            {generating ? (
              <Spinner className="size-4" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden />
            )}
            {generating ? "Génération…" : "Générer le message"}
          </Button>
        ) : null}
      </div>

      {optionsOpen ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
          <SmsAiOptionCards
            embedded
            options={options}
            onChange={onOptionsChange}
            savedLinks={savedLinks}
            linksLoading={linksLoading}
            selectedLinkId={selectedLinkId}
            onSelectLink={onSelectLink}
            onCreateLink={onCreateLink}
            composeDisabled={generating}
          />
          <SmsMergeTagChecklist
            className="mt-3 border-t border-slate-200 pt-3"
            defs={customFieldDefs}
            selected={options.selectedMergeTags}
            onChange={(selectedMergeTags) =>
              onOptionsChange({ selectedMergeTags })
            }
            fillCounts={mergeFillCounts}
            fillStatus={mergeFillStatus}
          />
        </div>
      ) : null}

      {hasVariants ? (
        <div className="space-y-2.5">
          <p className="m-0 text-[11px] font-black text-slate-700">
            Choisissez une variante
          </p>
          <div
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
            role="radiogroup"
            aria-label="Variantes de message générées"
          >
            {variants.map((variant, index) => {
              const isSelected = selectedVariant === variant;
              const label = VARIANT_LABELS[index] ?? `Variante ${index + 1}`;
              return (
                <button
                  key={`${index}-${variant.slice(0, 24)}`}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelectVariant(variant)}
                  className={cn(
                    "relative flex min-h-[9.5rem] cursor-pointer flex-col rounded-2xl border p-3.5 text-left transition-all",
                    isSelected
                      ? "border-2 border-[#2f6fed] bg-gradient-to-b from-[#eef4ff] to-white shadow-[0_4px_18px_rgba(47,111,237,0.12)]"
                      : "border-slate-200 bg-white hover:border-[#2f6fed]/35 hover:bg-[#eef4ff]/25 hover:shadow-sm",
                  )}
                >
                  {isSelected ? (
                    <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-[#4a86ff] to-[#2f6fed] px-2 py-0.5 text-[9px] font-extrabold text-white shadow-[0_2px_8px_rgba(47,111,237,0.35)]">
                      <Check className="h-2.5 w-2.5" aria-hidden />
                      Choisi
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "mb-2 inline-flex w-fit items-center rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wide",
                      isSelected
                        ? "bg-[#2f6fed]/10 text-[#2f6fed]"
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {label}
                  </span>
                  <p className="m-0 line-clamp-6 flex-1 text-xs font-semibold leading-relaxed text-slate-800">
                    {stripStopMention(variant)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
