"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { Sparkles, Star } from "lucide-react";

export type SmsComposeApproach = "manual" | "ai" | "template";

export const COMPOSE_APPROACH_OPTIONS: {
  value: SmsComposeApproach;
  label: string;
  description: string;
  /** Sous-titre étape 2 une fois le mode choisi (défaut : description). */
  activeHint?: string;
  emoji: string;
  recommended?: boolean;
  free?: boolean;
}[] = [
  {
    value: "manual",
    label: "Je rédige mon SMS",
    description: "Rédigez votre SMS librement.",
    emoji: "✍️",
    free: true,
  },
  {
    value: "ai",
    label: "L'IA rédige mon SMS",
    description:
      "Décrivez votre besoin, notre IA crée votre SMS et vous propose 3 versions.",
    emoji: "🤖",
    recommended: true,
  },
  {
    value: "template",
    label: "Je choisis un modèle",
    description: "Choisissez un SMS prêt à personnaliser.",
    activeHint: "Personnalisez le modèle choisi.",
    emoji: "💡",
    free: true,
  },
];

export function getComposeApproachOption(value: SmsComposeApproach) {
  return COMPOSE_APPROACH_OPTIONS.find((option) => option.value === value)!;
}

export const COMPOSE_APPROACH_PICK_INTRO =
  "Choisissez comment rédiger votre SMS.";

export const AI_COMPOSE_PROMPT_PLACEHOLDER =
  "Que souhaitez-vous dire à vos clients ? L’IA s’occupe du reste.";

export function getComposeApproachStepHint(
  composeApproach: SmsComposeApproach | null,
  showTemplatePicker = false
): string {
  if (composeApproach == null) {
    return COMPOSE_APPROACH_PICK_INTRO;
  }
  const option = getComposeApproachOption(composeApproach);
  if (composeApproach === "template" && showTemplatePicker) {
    return option.description;
  }
  return option.activeHint ?? option.description;
}

const EMOJI_SHELL_CLS: Record<SmsComposeApproach, string> = {
  manual: "bg-yellow-100",
  ai: "bg-blue-100",
  template: "bg-green-100",
};

type SmsComposeApproachCardsProps = {
  selected: SmsComposeApproach | null;
  onSelect: (approach: SmsComposeApproach) => void;
  compact?: boolean;
  /** Essai IA du jour déjà consommé (bulle card IA). */
  aiFreeTrialUsedToday?: boolean;
};

/** Tirets longs — border-dashed CSS trop courts (effet dotted). */
function LongDashedCardBorder({
  active,
  thin = false,
}: {
  active: boolean;
  thin?: boolean;
}) {
  return (
    <svg
      className={cn(
        "pointer-events-none absolute inset-0 size-full",
        active ? "text-primary" : "text-border"
      )}
      aria-hidden
    >
      <rect
        x="0.5"
        y="0.5"
        width="calc(100% - 1px)"
        height="calc(100% - 1px)"
        rx="12"
        fill="none"
        stroke="currentColor"
        strokeWidth={thin ? 1 : 2}
        strokeDasharray={thin ? "10 7" : "12 8"}
      />
    </svg>
  );
}

export function SmsComposeApproachCards({
  selected,
  onSelect,
  compact = false,
  aiFreeTrialUsedToday = false,
}: SmsComposeApproachCardsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-3",
        compact ? "gap-2" : "gap-3"
      )}
      role="radiogroup"
      aria-label="Mode de rédaction du message"
    >
      {COMPOSE_APPROACH_OPTIONS.map((option) => {
        const isSelected = selected === option.value;
        const isAiCard = option.value === "ai";
        const showDashedBorder =
          !isSelected || (!compact && isSelected && !isAiCard);
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(option.value)}
            className={cn(
              "relative cursor-pointer rounded-xl border bg-card text-left transition-colors",
              compact
                ? cn(
                    "flex min-h-11 items-center gap-2 px-2.5 py-2",
                    option.recommended && "pr-6",
                    isSelected
                      ? isAiCard
                        ? "border border-solid border-chart-1 bg-[#eef4ff]"
                        : "border border-solid border-primary bg-accent"
                      : "border border-transparent hover:bg-muted/50"
                  )
                : cn(
                    "flex min-h-[11rem] flex-col overflow-hidden p-0 sm:min-h-[11.5rem]",
                    isSelected && isAiCard
                      ? "border-2 border-solid border-chart-1 bg-[#eef4ff] ring-1 ring-chart-1"
                      : cn(
                          "border border-transparent",
                          isSelected
                            ? "bg-accent ring-1 ring-primary"
                            : "hover:bg-muted/50"
                        )
                  )
            )}
          >
            {showDashedBorder ? (
              <LongDashedCardBorder active={isSelected} thin={compact} />
            ) : null}
            {option.recommended && !compact ? (
              <Badge className="absolute top-2 right-2 border-0 bg-chart-1 text-primary-foreground">
                <Star className="size-3 fill-current" aria-hidden />
                Recommandé
              </Badge>
            ) : null}
            {option.free && !compact ? (
              <Badge className="absolute bottom-5 left-5 border-0 bg-emerald-600 text-white">
                Gratuit
              </Badge>
            ) : null}
            {isAiCard && !compact ? (
              <Badge
                className={cn(
                  "absolute bottom-5 left-5 max-w-[calc(100%-1.5rem)] border-0 text-white",
                  aiFreeTrialUsedToday
                    ? "bg-slate-500"
                    : "bg-chart-1 text-primary-foreground"
                )}
                title={
                  aiFreeTrialUsedToday
                    ? "Les prochaines générations peuvent consommer des crédits."
                    : "Un essai IA offert par jour sur votre compte."
                }
              >
                <Sparkles className="size-3 shrink-0 fill-current" aria-hidden />
                {aiFreeTrialUsedToday
                  ? "Essai utilisé aujourd'hui"
                  : "1 essai gratuit aujourd'hui"}
              </Badge>
            ) : null}
            {option.recommended && compact ? (
              <Star
                className="absolute top-1.5 right-1.5 size-3 shrink-0 fill-current text-chart-1"
                aria-hidden
              />
            ) : null}
            <div
              className={cn(
                "flex min-w-0 flex-1 flex-col justify-center",
                compact ? "min-w-0" : "flex-1 px-4 py-5"
              )}
            >
              <div
                className={cn(
                  "flex min-w-0 items-center",
                  compact ? "gap-2" : "gap-3"
                )}
              >
                <span
                  className={cn(
                    "grid shrink-0 place-items-center rounded-full leading-none",
                    compact ? "size-9 text-lg" : "size-14 text-3xl",
                    EMOJI_SHELL_CLS[option.value]
                  )}
                  aria-hidden
                >
                  {option.emoji}
                </span>
                <div className="min-w-0 flex flex-1 flex-col justify-center text-left">
                  <span
                    className={cn(
                      "font-semibold text-foreground",
                      compact ? "truncate text-xs" : "text-sm leading-snug"
                    )}
                  >
                    {option.label}
                  </span>
                  {compact ? null : (
                    <span className="mt-1.5 text-xs font-normal leading-snug text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
