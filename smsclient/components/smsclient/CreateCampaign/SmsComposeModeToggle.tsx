"use client";

import { cn } from "@/lib/cn";
import { PenLine, Sparkles } from "lucide-react";

export type SmsComposeMode = "ai" | "manual";

const OPTIONS: {
  value: SmsComposeMode;
  label: string;
  icon: typeof Sparkles;
}[] = [
  { value: "ai", label: "Générer par IA", icon: Sparkles },
  { value: "manual", label: "Rédaction manuelle", icon: PenLine },
];

type SmsComposeModeToggleProps = {
  value: SmsComposeMode;
  onChange: (value: SmsComposeMode) => void;
};

export function SmsComposeModeToggle({
  value,
  onChange,
}: SmsComposeModeToggleProps) {
  return (
    <div
      className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1"
      role="radiogroup"
      aria-label="Mode de rédaction du message"
    >
      {OPTIONS.map((option) => {
        const active = value === option.value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold transition-all",
              active
                ? "bg-white text-[#1f3b77] shadow-sm ring-1 ring-[#2f6fed]/20"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
