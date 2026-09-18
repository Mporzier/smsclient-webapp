"use client";

import { SmsAiLinkOptionCard } from "@/components/smsclient/CreateCampaign/SmsAiLinkOptionCard";
import {
  aiOptionCardClass,
  SmsAiOptionHeader,
  SmsAiOptionSwitch,
} from "@/components/smsclient/CreateCampaign/SmsAiOptionChrome";
import { cn } from "@/lib/cn";
import type { LinkRowData } from "@/lib/types/link";
import type { MergeTagKey } from "@/lib/proto/smsPersonalization";
import {
  DEFAULT_SMS_AI_MESSAGE_TONE,
  type SmsAiMessageTone,
} from "@/components/smsclient/CreateCampaign/smsAiTone";
import { SmsAiToneOptionCard } from "@/components/smsclient/CreateCampaign/SmsAiToneOptionCard";

export type SmsAiOptions = {
  autoOptimize: boolean;
  selectedMergeTags: MergeTagKey[];
  /** Lien court que l’IA doit intégrer au SMS généré. */
  selectedLinkId: string | null;
  messageTone: SmsAiMessageTone;
};

export const DEFAULT_SMS_AI_OPTIONS: SmsAiOptions = {
  autoOptimize: true,
  selectedMergeTags: [],
  selectedLinkId: null,
  messageTone: DEFAULT_SMS_AI_MESSAGE_TONE,
};

type SmsAiOptionCardsProps = {
  options: SmsAiOptions;
  onChange: (patch: Partial<SmsAiOptions>) => void;
  /** Sans en-tête ni bordure — pour panneau repliable. */
  embedded?: boolean;
  savedLinks?: LinkRowData[];
  linksLoading?: boolean;
  onCreateLink?: (args: {
    originalUrl: string;
    label: string;
  }) => Promise<{ data: LinkRowData | null; error: string | null }>;
};

type BooleanAiOption = "autoOptimize";

type CardDef = {
  key: BooleanAiOption;
  title: string;
  description: string;
  emoji: string;
};

const CARDS: CardDef[] = [
  {
    key: "autoOptimize",
    title: "Optimisation automatique",
    description:
      "Nous optimisons votre message pour réduire le nombre de crédits SMS utilisés.",
    emoji: "⚡",
  },
];

function SmsAiOptionCard({
  title,
  description,
  emoji,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  emoji: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={cn(aiOptionCardClass(enabled), "cursor-pointer text-left")}
    >
      <SmsAiOptionHeader
        emoji={emoji}
        emojiTone={enabled ? "active" : "neutral"}
        title={title}
        trailing={<SmsAiOptionSwitch enabled={enabled} />}
      />
      <p className="m-0 text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </button>
  );
}

export function SmsAiOptionCards({
  options,
  onChange,
  embedded = false,
  savedLinks = [],
  linksLoading = false,
  onCreateLink,
}: SmsAiOptionCardsProps) {
  return (
    <div className={cn(!embedded && "shrink-0 border-t border-slate-100 pt-3")}>
      {!embedded ? (
        <div className="mb-2 flex items-center gap-2">
          <span
            className="flex size-7 items-center justify-center rounded-full bg-blue-100 text-base leading-none"
            aria-hidden
          >
            ✨
          </span>
          <span className="text-sm font-semibold text-foreground">
            Options IA
          </span>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {CARDS.map((card) => (
          <SmsAiOptionCard
            key={card.key}
            title={card.title}
            description={card.description}
            emoji={card.emoji}
            enabled={options[card.key]}
            onToggle={() => onChange({ [card.key]: !options[card.key] })}
          />
        ))}
        <SmsAiToneOptionCard
          value={options.messageTone}
          onChange={(messageTone) => onChange({ messageTone })}
        />
        <SmsAiLinkOptionCard
          links={savedLinks}
          loading={linksLoading}
          selectedLinkId={options.selectedLinkId}
          onSelectedLinkIdChange={(selectedLinkId) =>
            onChange({ selectedLinkId })
          }
          onCreateLink={onCreateLink}
        />
      </div>
    </div>
  );
}
