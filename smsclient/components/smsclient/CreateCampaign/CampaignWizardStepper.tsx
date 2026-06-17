"use client";

import { cn } from "@/lib/cn";
import { Check, MessageSquare, Send, Users } from "lucide-react";

export const CAMPAIGN_WIZARD_STEPS = [
  { id: 1 as const, label: "Destinataires", icon: Users },
  { id: 2 as const, label: "Message", icon: MessageSquare },
  { id: 3 as const, label: "Confirmation", icon: Send },
];

export function CampaignWizardStepper({
  current,
  compact,
}: {
  current: 1 | 2 | 3;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-0.5",
        compact ? "overflow-x-auto" : "gap-1",
      )}
      aria-label="Étapes de création de campagne"
    >
      {CAMPAIGN_WIZARD_STEPS.map((s, idx) => {
        const done = s.id < current;
        const active = s.id === current;
        const Icon = s.icon;
        return (
          <div key={s.id} className="flex shrink-0 items-center gap-0.5">
            {idx > 0 && (
              <div
                className={cn(
                  "h-px transition-colors",
                  compact ? "w-3" : "w-6",
                  done ? "bg-[#2f6fed]" : "bg-slate-200",
                )}
              />
            )}
            <div
              className={cn(
                "flex items-center gap-1 rounded-full font-bold transition-colors",
                compact
                  ? "px-2 py-1 text-[11px]"
                  : "gap-1.5 px-3 py-1.5 text-xs",
                active
                  ? "bg-[#eef4ff] text-[#1f3b77]"
                  : done
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-400",
              )}
            >
              {done ? (
                <Check
                  className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")}
                  strokeWidth={2.5}
                  aria-hidden
                />
              ) : (
                <Icon
                  className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")}
                  aria-hidden
                />
              )}
              <span className={cn(compact && "hidden min-[720px]:inline")}>
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
