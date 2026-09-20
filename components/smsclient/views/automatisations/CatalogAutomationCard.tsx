"use client";

import { Button } from "@/components/ui/button";
import { catalogAutomationScheduleLabel } from "@/lib/automations/catalog";
import type { CatalogAutomation } from "@/lib/automations/catalog";
import { isConfigurableCatalogId } from "@/lib/automations/catalog";
import { catalogAutomationEmoji } from "@/lib/automations/catalogEmojis";
import { cn } from "@/lib/utils";
import { CalendarClock, Check } from "lucide-react";

export type CatalogAutomationCardProps = {
  automation: CatalogAutomation;
  enabled?: boolean;
  onConfigure?: () => void;
};

export function CatalogAutomationCard({
  automation,
  enabled = false,
  onConfigure,
}: CatalogAutomationCardProps) {
  const emoji = catalogAutomationEmoji(automation);
  const schedule = catalogAutomationScheduleLabel(automation);
  const canConfigure =
    automation.status === "available" &&
    isConfigurableCatalogId(automation.id) &&
    typeof onConfigure === "function";

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-visible rounded-2xl border bg-card p-4 text-card-foreground shadow-sm transition-[box-shadow,border-color] hover:shadow-md",
        enabled
          ? "border-emerald-500/45 bg-gradient-to-br from-emerald-50/80 via-card to-card dark:from-emerald-950/25"
          : "border-border/70 hover:border-border",
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl leading-none shadow-inner select-none",
              enabled
                ? "bg-emerald-100/90 ring-1 ring-emerald-500/20 dark:bg-emerald-900/50"
                : "bg-muted/70 ring-1 ring-foreground/5",
            )}
            aria-hidden
          >
            {emoji}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start gap-2 pr-1">
              <h3 className="m-0 text-sm font-semibold leading-snug tracking-tight text-foreground">
                {automation.label}
              </h3>
              {enabled ? (
                <span
                  className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-600 text-white shadow-sm"
                  title="Automatisation active"
                  aria-label="Automatisation active"
                >
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                </span>
              ) : null}
            </div>
            <p className="m-0 flex items-center gap-1.5 text-[11px] font-medium text-emerald-800/90 dark:text-emerald-200/90">
              <CalendarClock
                className="h-3.5 w-3.5 shrink-0 opacity-80"
                aria-hidden
              />
              <span className="truncate">{schedule}</span>
            </p>
            <p className="m-0 line-clamp-3 text-[13px] leading-snug text-muted-foreground">
              {automation.description}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex shrink-0 justify-end border-t border-border/50 pt-3">
        {canConfigure ? (
          <Button
            type="button"
            variant={enabled ? "outline" : "default"}
            size="sm"
            className="h-8 rounded-full px-4 text-xs font-semibold"
            onClick={onConfigure}
          >
            {enabled ? "Modifier" : "Configurer"}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-full px-4 text-xs"
            disabled
          >
            Bientôt
          </Button>
        )}
      </div>
    </article>
  );
}
