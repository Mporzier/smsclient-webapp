"use client";

import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import { formatStatsNumber } from "@/lib/supabase/statistics";
import type { QrCaptureStats } from "@/lib/supabase/qrStats";
import { CheckCircle2, Gift, UserPlus } from "lucide-react";
import { useMemo } from "react";

type QrCaptureStatsCardProps = {
  stats: QrCaptureStats;
  loading?: boolean;
  embedded?: boolean;
  className?: string;
};

export function QrCaptureStatsCard({
  stats,
  loading,
  embedded = false,
  className,
}: QrCaptureStatsCardProps) {
  const { t } = useI18n();

  const metrics = useMemo(
    () => [
      {
        key: "totalRegistrations" as const,
        label: t("qr.stats.total"),
        icon: UserPlus,
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
      },
      {
        key: "optInRegistrations" as const,
        label: t("qr.stats.optIn"),
        icon: CheckCircle2,
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-600",
      },
      {
        key: "wheelSpins" as const,
        label: t("qr.stats.spins"),
        icon: Gift,
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-600",
      },
    ],
    [t],
  );

  return (
    <div
      className={cn(
        "shrink-0",
        embedded && "border-t border-border pt-2",
        className,
      )}
    >
      {embedded ? (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("qr.statsTitle")}
          </p>
          <p className="m-0 shrink-0 text-[10px] font-medium text-muted-foreground/80">
            {t("qr.statsSince")}
          </p>
        </div>
      ) : null}
      <div className={cn("grid grid-cols-3 gap-2 sm:gap-3", embedded && "px-0")}>
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const value = stats[metric.key];
          return (
            <div
              key={metric.key}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center rounded-lg bg-muted/40 text-center",
                embedded ? "gap-1 px-1.5 py-2" : "gap-1.5 px-2 py-3.5 sm:py-4",
              )}
            >
              <span
                className={cn(
                  "grid shrink-0 place-items-center rounded-full",
                  embedded ? "h-7 w-7" : "h-10 w-10 sm:h-11 sm:w-11",
                  metric.iconBg,
                  metric.iconColor,
                )}
                aria-hidden
              >
                <Icon
                  className={embedded ? "h-3.5 w-3.5" : "h-4 w-4 sm:h-[18px] sm:w-[18px]"}
                  strokeWidth={2.25}
                />
              </span>
              <p
                className={cn(
                  "m-0 line-clamp-2 font-medium leading-tight text-muted-foreground",
                  embedded ? "text-[8px]" : "text-[10px] sm:text-[11px]",
                )}
              >
                {metric.label}
              </p>
              <p
                className={cn(
                  "m-0 font-semibold tabular-nums leading-none text-foreground",
                  embedded ? "text-sm" : "text-lg sm:text-xl",
                )}
              >
                {loading ? "…" : formatStatsNumber(value)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
