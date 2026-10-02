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
        "box-border w-full max-w-3xl shrink-0 rounded-xl border border-border bg-card p-3 text-sm text-card-foreground",
        className,
      )}
      aria-labelledby="qr-compliance-title"
    >
      <div className="flex items-start gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-emerald-200/80 bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 space-y-1">
          <h3
            id="qr-compliance-title"
            className="m-0 text-sm font-medium leading-snug text-foreground"
          >
            {t("qr.complianceTitle")}
          </h3>
          <p className="m-0 text-pretty text-xs leading-snug text-muted-foreground">
            {t("qr.complianceBody")}
            <br />
            {t("qr.complianceUnsub")}{" "}
            <a
              href="#reglementations-sms"
              className="inline-flex items-center gap-0.5 font-normal text-primary underline-offset-4 hover:underline"
            >
              {t("qr.complianceMore")}
              <SquareArrowOutUpRight
                className="size-3 shrink-0 translate-y-px"
                strokeWidth={2}
                aria-hidden
              />
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
