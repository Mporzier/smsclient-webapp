"use client";

import { LoadingLabel } from "@/components/ui/loading-label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import QRCode from "qrcode";
import Image from "next/image";
import { useEffect, useState } from "react";

type DashboardMerchantQrCardProps = {
  publicUrl: string;
  loading: boolean;
  error: string | null;
  onGoQr: () => void;
  className?: string;
};

export function DashboardMerchantQrCard({
  publicUrl,
  loading,
  error,
  onGoQr,
  className,
}: DashboardMerchantQrCardProps) {
  const { t } = useI18n();
  const [qrImage, setQrImage] = useState("");

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (!publicUrl) {
        setQrImage("");
        return;
      }
      void QRCode.toDataURL(publicUrl, {
        margin: 1,
        width: 220,
        color: { dark: "#0f172a", light: "#ffffff" },
      }).then((src: string) => {
        if (!cancelled) setQrImage(src);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [publicUrl]);

  return (
    <Card className={cn("min-h-0 ring-border", className)}>
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-base font-extrabold">
          {t("dashboard.qrTitle")}
        </CardTitle>
        <CardDescription>{t("dashboard.qrSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
        {error ? (
          <p className="m-0 text-center text-xs font-semibold text-destructive">
            {error}
          </p>
        ) : loading ? (
          <p className="m-0 text-xs font-semibold text-muted-foreground">
            <LoadingLabel>{t("common.loading")}</LoadingLabel>
          </p>
        ) : qrImage ? (
          <button
            type="button"
            onClick={onGoQr}
            className="cursor-pointer rounded-xl border border-border bg-muted/30 p-2 transition-opacity hover:opacity-90"
            title={t("dashboard.qrManage")}
          >
            <Image
              src={qrImage}
              alt={t("dashboard.qrTitle")}
              width={160}
              height={160}
              unoptimized
              className="h-auto w-[160px]"
            />
          </button>
        ) : (
          <p className="m-0 text-center text-xs text-muted-foreground">
            {t("dashboard.qrUnavailable")}
          </p>
        )}
        <button
          type="button"
          onClick={onGoQr}
          className="cursor-pointer border-0 bg-transparent p-0 text-xs font-extrabold text-primary hover:underline"
        >
          {t("dashboard.qrManage")}
        </button>
      </CardContent>
    </Card>
  );
}
