"use client";

import { cn } from "@/lib/cn";

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
    label: "J'ai mon texte",
    description: "Rédigez ou collez votre SMS tel quel.",
    emoji: "✍️",
  },
  {
    value: "ai",
    label: "L'IA écrit pour moi",
    description:
      "Décrivez votre intention, l'IA rédigera le SMS pour vous et vous proposera 3 variantes.",
    emoji: "🤖",
    recommended: true,
  },
  {
    value: "template",
    label: "Partir d'un modèle",
    description: "Choisissez un modèle prêt à personnaliser.",
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
  "Écris-moi un SMS pour partager ma promotion de 30 % de réduction sur tout le magasin.";

export function getComposeApproachStepHint(
  composeApproach: SmsComposeApproach | null,
  showTemplatePicker = false,
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
  onSelect: (approach: SmsComposeApproach) => void;
};

export function SmsComposeApproachCards({
  onSelect,
}: SmsComposeApproachCardsProps) {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      role="radiogroup"
      aria-label="Mode de rédaction du message"
    >
      {COMPOSE_APPROACH_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={false}
          onClick={() => onSelect(option.value)}
          className={cn(
            "relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border bg-white p-4 text-center transition-colors",
            option.value === "ai"
              ? "border-2 border-[#2f6fed] bg-[#eef4ff]/35 shadow-[0_4px_18px_rgba(47,111,237,0.12)] hover:border-[#2f6fed] hover:bg-[#eef4ff]/55"
              : "border-slate-200 hover:border-[#2f6fed]/35 hover:bg-[#eef4ff]/45"
          )}
        >
          {option.recommended ? (
            <span className="absolute right-2 top-2 rounded-full bg-gradient-to-br from-[#4a86ff] to-[#2f6fed] px-2 py-0.5 text-[9px] font-extrabold text-white shadow-[0_2px_8px_rgba(47,111,237,0.35)]">
              Recommandé
            </span>
          ) : null}
          <span className="text-4xl leading-none" aria-hidden>
            {option.emoji}
          </span>
          <span className="mt-3 text-sm font-black text-slate-900">
            {option.label}
          </span>
          <span className="mt-1.5 max-w-[11rem] text-[11px] font-semibold leading-snug text-slate-500">
            {option.description}
          </span>
        </button>
      ))}
    </div>
  );
}

type SmsComposeApproachSelectedCardProps = {
  approach: SmsComposeApproach;
  onChange: () => void;
};

export function SmsComposeApproachSelectedCard({
  approach,
  onChange,
}: SmsComposeApproachSelectedCardProps) {
  const option = getComposeApproachOption(approach);

  return (
    <div className="flex shrink-0 items-center gap-2 rounded-xl border border-[#2f6fed]/25 bg-[#eef4ff]/50 px-2.5 py-2 shadow-sm">
      <span className="text-xl leading-none" aria-hidden>
        {option.emoji}
      </span>
      <div className="min-w-0">
        <p className="m-0 text-[9px] font-bold uppercase tracking-wide text-[#2f6fed]">
          Rédaction
        </p>
        <p className="m-0 max-w-[9rem] truncate text-xs font-black text-slate-900">
          {option.label}
        </p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className="ml-0.5 shrink-0 cursor-pointer rounded-lg border border-[#2f6fed]/20 bg-white px-2 py-1 text-[10px] font-bold text-[#2f6fed] transition-colors hover:border-[#2f6fed]/40 hover:bg-[#eef4ff]"
      >
        Changer
      </button>
    </div>
  );
}
