"use client";

import {
  DEFAULT_MANUAL_ENHANCE_MODES,
  MANUAL_ENHANCE_MODES,
  type ManualEnhanceMode,
} from "@/components/smsclient/CreateCampaign/manualMessageEnhance";
import { brandBtnPrimaryCls } from "@/components/smsclient/modals/modalChrome";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Wand2 } from "lucide-react";
import { useState } from "react";

type SmsManualComposeOptionsProps = {
  onApplyEnhance: (modes: ManualEnhanceMode[]) => void;
  disabled?: boolean;
  /** Cartes de mode (étape 2 rédaction manuelle uniquement). */
  showModeCards?: boolean;
};

function ManualEnhanceModeCard({
  label,
  emoji,
  description,
  selected,
  onSelect,
}: {
  label: string;
  emoji: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex min-h-0 cursor-pointer flex-col gap-1.5 rounded-xl border p-2.5 text-left transition-colors",
        selected
          ? "border-primary/40 bg-accent/60 ring-1 ring-primary/15"
          : "border-border bg-card hover:bg-muted/30",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full text-base leading-none",
            selected ? "bg-blue-100" : "bg-muted",
          )}
          aria-hidden
        >
          {emoji}
        </span>
        <span
          className={cn(
            "text-xs font-semibold leading-snug",
            selected ? "text-foreground" : "text-foreground/90",
          )}
        >
          {label}
        </span>
      </div>
      <p className="m-0 text-[10px] leading-snug text-muted-foreground">
        {description}
      </p>
    </button>
  );
}

export function SmsManualComposeOptions({
  onApplyEnhance,
  disabled = false,
  showModeCards = false,
}: SmsManualComposeOptionsProps) {
  const [modes, setModes] = useState<ManualEnhanceMode[]>(
    () => [...DEFAULT_MANUAL_ENHANCE_MODES],
  );

  const toggleMode = (value: ManualEnhanceMode) => {
    setModes((prev) =>
      prev.includes(value)
        ? prev.filter((m) => m !== value)
        : [...prev, value],
    );
  };

  const selectedLabels = MANUAL_ENHANCE_MODES.filter((m) =>
    modes.includes(m.value),
  ).map((m) => m.label);

  const ctaLabel = (() => {
    if (!showModeCards) return "Correction et reformulation";
    if (selectedLabels.length === 0) return "Appliquer au message";
    if (selectedLabels.length === 1) {
      return `${selectedLabels[0]} le message`;
    }
    return `Appliquer (${selectedLabels.length} options)`;
  })();

  return (
    <div className="shrink-0 space-y-3 border-t border-slate-100 pt-3">
      {showModeCards ? (
        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          role="group"
          aria-label="Options d'amélioration du message"
        >
          {MANUAL_ENHANCE_MODES.map((item) => (
            <ManualEnhanceModeCard
              key={item.value}
              label={item.label}
              emoji={item.emoji}
              description={item.description}
              selected={modes.includes(item.value)}
              onSelect={() => toggleMode(item.value)}
            />
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="default"
          size="lg"
          className={cn(
            brandBtnPrimaryCls,
            "h-10 shrink-0 gap-2 px-4 text-sm",
          )}
          onClick={() => onApplyEnhance(modes)}
          disabled={disabled || (showModeCards && modes.length === 0)}
        >
          <Wand2 className="h-4 w-4" aria-hidden />
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
