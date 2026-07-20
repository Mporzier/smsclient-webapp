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
        iconBg: "bg-[#eef4ff]",
        iconColor: "text-[#2f6fed]",
      },
      {
        key: "optInRegistrations" as const,
        label: t("qr.stats.optIn"),
        icon: CheckCircle2,
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
      },
      {
        key: "wheelSpins" as const,
        label: t("qr.stats.spins"),
        icon: Gift,
        iconBg: "bg-amber-50",
        iconColor: "text-amber-600",
      },
    ],
    [t],
  );

  return (
    <div
      className={cn(
        "shrink-0",
        embedded
          ? "border-t border-slate-100 pt-2"
          : "rounded-2xl border border-slate-200 bg-white p-2.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-baseline justify-between gap-2",
          embedded ? "mb-1.5" : "mb-2 px-0.5",
        )}
      >
        <p
          className={cn(
            "m-0 font-black uppercase tracking-wide text-slate-500",
            embedded ? "text-[10px]" : "text-[11px]",
          )}
        >
          {t("qr.statsTitle")}
        </p>
        <p className="m-0 shrink-0 text-[9px] font-semibold text-slate-400">
          {t("qr.statsSince")}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const value = stats[metric.key];
          return (
            <div
              key={metric.key}
              className={cn(
                "flex min-w-0 flex-col items-center rounded-xl border border-slate-100 bg-slate-50/60 text-center",
                embedded ? "gap-0.5 px-1 py-1.5" : "gap-1 px-2 py-2",
              )}
            >
              <span
                className={cn(
                  "grid shrink-0 place-items-center rounded-full",
                  embedded ? "h-6 w-6" : "h-8 w-8",
                  metric.iconBg,
                  metric.iconColor,
                )}
                aria-hidden
              >
                <Icon
                  className={embedded ? "h-3 w-3" : "h-4 w-4"}
                  strokeWidth={2.25}
                />
              </span>
              <p
                className={cn(
                  "m-0 w-full font-bold leading-tight text-slate-500",
                  embedded
                    ? "text-[8px] line-clamp-2"
                    : "truncate text-[10px]",
                )}
              >
                {metric.label}
              </p>
              <p
                className={cn(
                  "m-0 font-black tabular-nums leading-none text-slate-900",
                  embedded ? "text-sm" : "text-lg",
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
