"use client";

import { QrCapturePreviewModal } from "@/components/smsclient/modals/QrCapturePreviewModal";
import { QrWelcomeSmsSettingsModal } from "@/components/smsclient/modals/QrWelcomeSmsSettingsModal";
import { QrWheelSettingsModal } from "@/components/smsclient/modals/QrWheelSettingsModal";
import { brandBtnCls } from "@/components/smsclient/modals/modalChrome";
import { QrCaptureComplianceCard } from "@/components/smsclient/views/QrCaptureComplianceCard";
import { QrCapturePhonePreview } from "@/components/smsclient/views/QrCapturePhonePreview";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LoadingLabel } from "@/components/ui/loading-label";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import { downloadShopQrPdf } from "@/lib/qr/downloadShopQrPdf";
import type { QrCaptureMode } from "@/lib/supabase/qrCodes";
import type { QrWheelConfig } from "@/lib/types/qrWheel";
import { CircleCheck, Copy, Download, Gift, MessageCircle, QrCode } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";
import { FormDialogHeader } from "./FormDialogHeader";

function downloadQrPng(dataUrl: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = "qr-code-boutique.png";
  anchor.click();
}

type QrActionButtonProps = {
  icon: typeof Download;
  title: string;
  subtitle: string;
  disabled?: boolean;
  onClick: () => void;
};

function QrActionButton({
  icon: Icon,
  title,
  subtitle,
  disabled,
  onClick,
}: QrActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-left transition-colors hover:border-[#2f6fed]/30 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-bold leading-tight text-slate-900">
          {title}
        </span>
        <span className="block truncate text-[10px] font-semibold leading-tight text-slate-500">
          {subtitle}
        </span>
      </span>
    </button>
  );
}

export type QrCollectQrModalProps = {
  open: boolean;
  onClose: () => void;
  publicUrl: string;
  loading: boolean;
  companyName?: string;
  captureMode: QrCaptureMode;
  onCaptureModeChange: (mode: QrCaptureMode) => Promise<void>;
  welcomeSmsTemplate: string;
  onWelcomeSmsTemplateChange: (template: string) => Promise<void>;
  wheelConfig: QrWheelConfig | null;
  wheelLoading: boolean;
  wheelSaving: boolean;
  onWheelSave: (config: QrWheelConfig) => Promise<void>;
  onWheelEnableDefaults: () => Promise<void>;
};

export function QrCollectQrModal({
  open,
  onClose,
  publicUrl,
  loading,
  companyName,
  captureMode,
  onCaptureModeChange,
  welcomeSmsTemplate,
  onWelcomeSmsTemplateChange,
  wheelConfig,
  wheelLoading,
  wheelSaving,
  onWheelSave,
  onWheelEnableDefaults,
}: QrCollectQrModalProps) {
  const { t } = useI18n();
  const [qrImage, setQrImage] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [wheelModalOpen, setWheelModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const captureModeOptions = useMemo(
    () =>
      [
        {
          mode: "welcome" as const,
          title: t("qr.mode.welcome.title"),
          description: t("qr.mode.welcome.desc"),
          icon: MessageCircle,
        },
        {
          mode: "wheel" as const,
          title: t("qr.mode.wheel.title"),
          description: t("qr.mode.wheel.desc"),
          icon: Gift,
        },
      ] as const,
    [t],
  );

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
        width: 280,
        color: { dark: "#0f172a", light: "#ffffff" },
      }).then((src: string) => {
        if (!cancelled) setQrImage(src);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [publicUrl]);

  const handleModeSelect = useCallback(
    (mode: Exclude<QrCaptureMode, "none">) => {
      const nextMode: QrCaptureMode = captureMode === mode ? "none" : mode;
      void onCaptureModeChange(nextMode);
    },
    [captureMode, onCaptureModeChange],
  );

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent
          showCloseButton
          className={cn(
            formDialogContentCls,
            dialogContentZCls,
            "max-h-[min(90vh,820px)] max-w-[min(100vw-2rem,980px)]",
          )}
          onOpenAutoFocus={preventDialogOpenAutoFocus}
          overlayClassName={dialogOverlayCls}
        >
          <FormDialogHeader
            bareIcon
            icon={
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-[#eef4ff] text-[#2f6fed]">
                <QrCode className="h-5 w-5" strokeWidth={2.25} />
              </div>
            }
            title={t("qr.hub.qrModal.title")}
            description={t("qr.pageSubtitle")}
          />
          <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-1">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
              <div className="flex flex-col gap-2 lg:border-r lg:border-slate-100 lg:pr-4">
                <div className="mx-auto flex aspect-square w-full max-w-[200px] flex-col rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <div className="mb-1 flex shrink-0 items-center justify-between gap-1.5">
                    <h3 className="m-0 text-[11px] font-black leading-tight text-slate-900">
                      {t("qr.signupTitle")}
                    </h3>
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                      {t("qr.active")}
                    </span>
                  </div>
                  <div className="flex min-h-0 flex-1 items-center justify-center">
                    {qrImage ? (
                      <Image
                        src={qrImage}
                        alt={t("qr.alt")}
                        width={120}
                        height={120}
                        unoptimized
                        className="h-[120px] w-[120px] max-h-full max-w-full"
                      />
                    ) : (
                      <div className="h-[120px] w-[120px] animate-pulse rounded-lg bg-slate-200" />
                    )}
                  </div>
                  <p className="m-0 shrink-0 text-center text-[9px] font-semibold text-slate-400">
                    {t("qr.scanHint")}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="m-0 mb-1 text-[11px] font-black text-slate-600">
                    {t("qr.signupLink")}
                  </p>
                  <div className="min-w-0 truncate rounded-lg border border-[#dfe6f2] bg-slate-50/80 px-2 py-1 text-[11px] font-semibold text-slate-700">
                    {publicUrl || "—"}
                  </div>
                </div>

                {downloadError ? (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] font-bold text-rose-900">
                    {downloadError}
                  </p>
                ) : null}

                <div className="grid grid-cols-3 gap-1.5">
                  <QrActionButton
                    icon={Download}
                    title={t("qr.download")}
                    subtitle="PNG"
                    disabled={!qrImage}
                    onClick={() => {
                      if (!qrImage) return;
                      setDownloadError(null);
                      downloadQrPng(qrImage);
                    }}
                  />
                  <QrActionButton
                    icon={Download}
                    title={t("qr.download")}
                    subtitle={pdfLoading ? "…" : "PDF"}
                    disabled={!qrImage || pdfLoading}
                    onClick={() => {
                      if (!qrImage || !publicUrl) return;
                      setDownloadError(null);
                      setPdfLoading(true);
                      void downloadShopQrPdf({
                        qrDataUrl: qrImage,
                        publicUrl,
                        companyName,
                      })
                        .catch((e) => {
                          setDownloadError(
                            e instanceof Error ? e.message : t("qr.pdfFailed"),
                          );
                        })
                        .finally(() => {
                          setPdfLoading(false);
                        });
                    }}
                  />
                  <QrActionButton
                    icon={Copy}
                    title={t("qr.copyLink")}
                    subtitle={linkCopied ? t("qr.copied") : "URL"}
                    disabled={!publicUrl}
                    onClick={() => {
                      if (!publicUrl) return;
                      void navigator.clipboard.writeText(publicUrl).then(() => {
                        setLinkCopied(true);
                        window.setTimeout(() => setLinkCopied(false), 1500);
                      });
                    }}
                  />
                </div>

                <div className="border-t border-slate-100 pt-2">
                  <div className="mb-2">
                    <h3 className="m-0 text-xs font-black text-slate-900">
                      {t("qr.afterTitle")}
                    </h3>
                    <p className="m-0 mt-0.5 text-[10px] font-semibold leading-snug text-slate-500">
                      {t("qr.afterDesc")}
                    </p>
                  </div>

                  <div
                    className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                    role="radiogroup"
                    aria-label={t("qr.afterAria")}
                  >
                    {captureModeOptions.map((option) => {
                      const Icon = option.icon;
                      const selected = captureMode === option.mode;
                      return (
                        <button
                          key={option.mode}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => handleModeSelect(option.mode)}
                          className={cn(
                            "relative flex cursor-pointer flex-col items-start gap-2 rounded-xl border p-2.5 text-left transition-[border-color,box-shadow] duration-200",
                            selected
                              ? option.mode === "wheel"
                                ? "border-2 border-amber-400 bg-gradient-to-br from-amber-50/90 to-orange-50/50 ring-2 ring-amber-300/60 ring-offset-1"
                                : "border-2 border-[#2f6fed] bg-[#eef4ff] ring-2 ring-[#2f6fed]/25 ring-offset-1"
                              : "border border-slate-200 bg-white hover:border-slate-300",
                          )}
                        >
                          {selected ? (
                            <CircleCheck
                              className="absolute right-2 top-2 h-4 w-4 text-emerald-500"
                              strokeWidth={2.5}
                              aria-hidden
                            />
                          ) : null}
                          <span
                            className={cn(
                              "grid h-8 w-8 place-items-center rounded-lg border",
                              selected
                                ? option.mode === "wheel"
                                  ? "border-amber-200/80 bg-white/80 text-amber-600"
                                  : "border-[#2f6fed]/20 bg-white text-[#2f6fed]"
                                : "border-slate-200 bg-slate-50 text-slate-400",
                            )}
                          >
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <span>
                            <span className="block text-xs font-black text-slate-900">
                              {option.title}
                            </span>
                            <span className="mt-0.5 block text-[10px] font-semibold leading-snug text-slate-500">
                              {option.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative mt-3 min-h-[52px]">
                    <div
                      className={cn(
                        "transition-all duration-200 ease-out",
                        captureMode === "welcome"
                          ? "translate-y-0 opacity-100"
                          : "pointer-events-none absolute inset-x-0 top-0 -translate-y-1 opacity-0",
                      )}
                      aria-hidden={captureMode !== "welcome"}
                    >
                      <div className="flex flex-wrap gap-1.5 rounded-xl border border-[#2f6fed]/15 bg-[#eef4ff]/40 p-2.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className={cn(brandBtnCls, "h-8 px-3 text-xs")}
                          disabled={templateSaving}
                          onClick={() => setWelcomeModalOpen(true)}
                        >
                          {t("qr.configure")}
                        </Button>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "transition-all duration-200 ease-out",
                        captureMode === "wheel"
                          ? "translate-y-0 opacity-100"
                          : "pointer-events-none absolute inset-x-0 top-0 -translate-y-1 opacity-0",
                      )}
                      aria-hidden={captureMode !== "wheel"}
                    >
                      <div className="flex flex-wrap gap-1.5 rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 to-orange-50/50 p-2.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className={cn(brandBtnCls, "h-8 px-3 text-xs")}
                          disabled={wheelSaving}
                          onClick={() => setPreviewModalOpen(true)}
                        >
                          {t("qr.preview")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className={cn(brandBtnCls, "h-8 px-3 text-xs")}
                          disabled={wheelSaving}
                          onClick={() => setWheelModalOpen(true)}
                        >
                          {t("qr.configure")}
                        </Button>
                      </div>
                    </div>

                    <p
                      className={cn(
                        "m-0 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-[10px] font-semibold text-slate-500 transition-opacity duration-200",
                        captureMode === "none"
                          ? "relative opacity-100"
                          : "pointer-events-none absolute inset-x-0 top-0 opacity-0",
                      )}
                      aria-hidden={captureMode !== "none"}
                    >
                      {t("qr.noneActive")}
                    </p>
                  </div>
                </div>
              </div>

              <QrCapturePhonePreview
                compact
                fill
                className="min-h-[280px] lg:min-h-[420px]"
                publicUrl={publicUrl}
                captureMode={captureMode}
                wheelConfig={wheelConfig}
                welcomeSmsTemplate={welcomeSmsTemplate}
                senderName={companyName}
                initialLoading={wheelLoading && !wheelConfig}
              />
            </div>

            <QrCaptureComplianceCard className="mt-4 border-t border-slate-100 pt-3" />

            {loading ? (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/[0.06] backdrop-blur-[1px]"
                role="status"
                aria-live="polite"
                aria-busy="true"
                aria-label={t("common.loading")}
              >
                <div className="rounded-xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
                  <LoadingLabel
                    className="text-sm font-bold text-slate-700"
                    spinnerClassName="size-5"
                  >
                    {t("common.loading")}
                  </LoadingLabel>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <QrWelcomeSmsSettingsModal
        open={welcomeModalOpen}
        onClose={() => setWelcomeModalOpen(false)}
        template={welcomeSmsTemplate}
        saving={templateSaving}
        onSave={async (template) => {
          setTemplateSaving(true);
          try {
            await onWelcomeSmsTemplateChange(template);
          } finally {
            setTemplateSaving(false);
          }
        }}
      />

      <QrCapturePreviewModal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        wheelConfig={wheelConfig}
        wheelLoading={wheelLoading}
      />

      <QrWheelSettingsModal
        open={wheelModalOpen}
        onClose={() => setWheelModalOpen(false)}
        config={wheelConfig}
        loading={wheelLoading}
        saving={wheelSaving}
        onSave={async (config) => {
          await onWheelSave(config);
          setWheelModalOpen(false);
        }}
        onEnableWithDefaults={onWheelEnableDefaults}
      />
    </>
  );
}
