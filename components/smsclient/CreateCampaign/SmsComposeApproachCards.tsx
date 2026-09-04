"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { Star } from "lucide-react";

export type SmsComposeApproach = "manual" | "ai" | "template";

export const COMPOSE_APPROACH_OPTIONS: {
  value: SmsComposeApproach;
  label: string;
  description: string;
  /** Sous-titre étape 2 une fois le mode choisi (défaut : description). */
  activeHint?: string;
  emoji: string;
  recommended?: boolean;
}[] = [
  {
    value: "manual",
    label: "Je rédige mon SMS",
    description: "Rédigez votre SMS librement.",
    emoji: "✍️",
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
  },
];

export function getComposeApproachOption(value: SmsComposeApproach) {
  return COMPOSE_APPROACH_OPTIONS.find((option) => option.value === value)!;
}

export const COMPOSE_APPROACH_PICK_INTRO =
  "Choisissez comment rédiger votre SMS.";

export const AI_COMPOSE_PROMPT_PLACEHOLDER =
  "Ex. Rédigez un SMS pour partager ma promotion de 30 % de réduction sur tout le magasin.";

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

type SmsComposeApproachCardsProps = {
  selected: SmsComposeApproach | null;
  onSelect: (approach: SmsComposeApproach) => void;
  compact?: boolean;
};

export function SmsComposeApproachCards({
  selected,
  onSelect,
  compact = false,
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
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(option.value)}
            className={cn(
              "relative cursor-pointer rounded-xl border bg-card text-left ring-1 transition-colors",
              compact
                ? cn(
                    "flex min-h-11 items-center gap-2 px-2.5 py-2",
                    option.recommended && "pr-6"
                  )
                : "flex aspect-square flex-col items-center justify-center p-4 text-center",
              isSelected
                ? "border-primary bg-accent ring-primary"
                : "border-border ring-foreground/10 hover:bg-muted/50"
            )}
          >
            {option.recommended && !compact ? (
              <Badge
                className="absolute top-2 right-2"
                variant={isSelected ? "default" : "secondary"}
              >
                <Star className="size-3 fill-current" aria-hidden />
                Recommandé
              </Badge>
            ) : null}
            {option.recommended && compact ? (
              <Star
                className="absolute top-1.5 right-1.5 size-3 shrink-0 fill-current text-primary"
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "shrink-0 leading-none",
                compact ? "text-lg" : "text-4xl"
              )}
              aria-hidden
            >
              {option.emoji}
            </span>
            <span
              className={cn(
                "min-w-0 font-semibold text-foreground",
                compact ? "truncate text-xs" : "mt-3 text-sm"
              )}
            >
              {option.label}
            </span>
            {compact ? null : (
              <span className="mt-1.5 max-w-[11rem] text-xs font-normal leading-snug text-muted-foreground">
                {option.description}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
