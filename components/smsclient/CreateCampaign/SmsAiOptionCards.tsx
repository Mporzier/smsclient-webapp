"use client";

import { cn } from "@/lib/cn";
import { SmsLinkPicker } from "@/components/smsclient/CreateCampaign/SmsLinkPicker";
import type { LinkRowData } from "@/lib/types/link";
import {
  Link2,
  Smile,
  Sparkles,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MergeTagKey } from "@/lib/proto/smsPersonalization";

export type SmsAiOptions = {
  autoOptimize: boolean;
  selectedMergeTags: MergeTagKey[];
  allowSpecialChars: boolean;
  linkTracking: boolean;
};

export const DEFAULT_SMS_AI_OPTIONS: SmsAiOptions = {
  autoOptimize: true,
  selectedMergeTags: [],
  allowSpecialChars: false,
  linkTracking: false,
};

type SmsAiOptionCardsProps = {
  options: SmsAiOptions;
  onChange: (patch: Partial<SmsAiOptions>) => void;
  savedLinks: LinkRowData[];
  linksLoading?: boolean;
  selectedLinkId: string | null;
  onSelectLink: (link: LinkRowData) => void;
  onCreateLink?: (args: {
    originalUrl: string;
    label: string;
  }) => Promise<{ data: LinkRowData | null; error: string | null }>;
  composeDisabled?: boolean;
  /** Sans en-tête ni bordure — pour panneau repliable. */
  embedded?: boolean;
};

type BooleanAiOption = "autoOptimize" | "allowSpecialChars" | "linkTracking";

type CardDef = {
  key: BooleanAiOption;
  title: string;
  description: string;
  icon: LucideIcon;
};

const CARDS: CardDef[] = [
  {
    key: "autoOptimize",
    title: "Optimisation automatique",
    description:
      "Nous optimisons votre message pour réduire le nombre de crédits SMS utilisés.",
    icon: Wand2,
  },
  {
    key: "allowSpecialChars",
    title: "Caractères spéciaux",
    description: "Autoriser les caractères spéciaux (émojis)",
    icon: Smile,
  },
  {
    key: "linkTracking",
    title: "Suivi des liens",
    description:
      "Sélectionnez un lien court enregistré et suivez les clics dans votre SMS.",
    icon: Link2,
  },
];

function SmsAiOptionCard({
  title,
  description,
  icon: Icon,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={cn(
        "flex w-full cursor-pointer flex-col gap-2 rounded-xl border p-3 text-left transition-colors",
        enabled
          ? "border-[#2f6fed] bg-[#eef4ff] shadow-[inset_0_0_0_1px_rgba(47,111,237,0.12)]"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-lg border",
            enabled
              ? "border-[#2f6fed]/25 bg-white text-[#2f6fed]"
              : "border-slate-200 bg-slate-50 text-slate-500"
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span
          className={cn(
            "relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors",
            enabled ? "bg-[#2f6fed]" : "bg-slate-200"
          )}
          aria-hidden
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
              enabled ? "translate-x-4" : "translate-x-0.5"
            )}
          />
        </span>
      </div>
      <div>
        <p
          className={cn(
            "m-0 text-xs font-black leading-snug",
            enabled ? "text-[#1f3b77]" : "text-slate-900"
          )}
        >
          {title}
        </p>
        <p className="m-0 mt-1 text-[11px] font-semibold leading-snug text-slate-500">
          {description}
        </p>
      </div>
    </button>
  );
}

export function SmsAiOptionCards({
  options,
  onChange,
  savedLinks,
  linksLoading = false,
  selectedLinkId,
  onSelectLink,
  onCreateLink,
  composeDisabled = false,
  embedded = false,
}: SmsAiOptionCardsProps) {
  return (
    <div className={cn(!embedded && "shrink-0 border-t border-slate-100 pt-3")}>
      {!embedded ? (
        <div className="mb-2 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#2f6fed]" aria-hidden />
          <span className="text-xs font-black text-slate-900">Options IA</span>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {CARDS.map((card) => {
          if (card.key === "linkTracking") {
            return (
              <div key={card.key} className="flex flex-col gap-2">
                <SmsAiOptionCard
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                  enabled={options.linkTracking}
                  onToggle={() =>
                    onChange({ linkTracking: !options.linkTracking })
                  }
                />
                {options.linkTracking ? (
                  <div className="min-w-0 overflow-x-hidden rounded-xl border border-[#dfe6f2] bg-slate-50/80 p-2.5">
                    <p className="m-0 mb-2 text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Sélectionner un lien
                    </p>
                    <SmsLinkPicker
                      links={savedLinks}
                      loading={linksLoading}
                      mode="select"
                      selectedLinkId={selectedLinkId}
                      onSelectLink={onSelectLink}
                      disabled={composeDisabled}
                      onCreateLink={onCreateLink}
                    />
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <SmsAiOptionCard
              key={card.key}
              title={card.title}
              description={card.description}
              icon={card.icon}
              enabled={options[card.key]}
              onToggle={() => onChange({ [card.key]: !options[card.key] })}
            />
          );
        })}
      </div>
    </div>
  );
}
