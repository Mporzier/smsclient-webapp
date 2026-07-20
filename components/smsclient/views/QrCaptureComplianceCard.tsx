"use client";

import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import { ShieldCheck, SquareArrowOutUpRight } from "lucide-react";

type QrCaptureComplianceCardProps = {
  className?: string;
};

export function QrCaptureComplianceCard({
  className,
}: QrCaptureComplianceCardProps) {
  const { t } = useI18n();

  return (
    <section
      className={cn(
        "h-fit w-full shrink-0 self-start rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1.5",
        className,
      )}
      aria-labelledby="qr-compliance-title"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-emerald-200/80 bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          </span>
          <div className="min-w-0">
            <h3
              id="qr-compliance-title"
              className="m-0 text-xs font-black leading-tight text-slate-900"
            >
              {t("qr.complianceTitle")}
            </h3>
            <p className="m-0 mt-0.5 text-[11px] font-semibold leading-snug text-slate-600">
              {t("qr.complianceBody")}
              <br />
              {t("qr.complianceUnsub")}
            </p>
          </div>
        </div>
        <a
          href="#reglementations-sms"
          className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold leading-tight text-[#2f6fed] no-underline hover:underline"
        >
          {t("qr.complianceMore")}
          <SquareArrowOutUpRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
        </a>
      </div>
    </section>
  );
}
