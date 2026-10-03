"use client";

import { QrWelcomeSmsSettingsModal } from "@/components/smsclient/modals/QrWelcomeSmsSettingsModal";
import { QrWheelSettingsModal } from "@/components/smsclient/modals/QrWheelSettingsModal";
import { CopyableLinkField } from "@/components/smsclient/CopyableLinkField";
import { QrCaptureComplianceCard } from "@/components/smsclient/views/QrCaptureComplianceCard";
import { QrCapturePhonePreview } from "@/components/smsclient/views/QrCapturePhonePreview";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingLabel } from "@/components/ui/loading-label";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import { downloadShopQrPdf } from "@/lib/qr/downloadShopQrPdf";
import type { QrCaptureMode } from "@/lib/supabase/qrCodes";
import type { QrWheelConfig } from "@/lib/types/qrWheel";
import {
  ChevronRight,
  Copy,
  Download,
  Gift,
  Lightbulb,
  ListPlus,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

function downloadQrPng(dataUrl: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = "qr-code-boutique.png";
  anchor.click();
}

const qrPanelSectionTitleCls =
  "m-0 text-base font-semibold leading-tight tracking-tight text-foreground";
const qrPanelSectionDescCls =
  "m-0 mt-1.5 text-sm leading-snug text-muted-foreground";
const qrPanelFieldLabelCls =
  "m-0 text-sm font-semibold leading-tight text-foreground";
const qrCardTitleCls =
  "m-0 text-sm font-semibold leading-tight text-foreground";

function QrPanelSectionHeader({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("shrink-0", className)}>
      <h3 className={qrPanelSectionTitleCls}>{title}</h3>
      {description ? (
        <p className={qrPanelSectionDescCls}>{description}</p>
      ) : null}
    </div>
  );
}

function QrParcoursIllustration({
  alt,
  title,
  subtitle,
  className,
}: {
  alt: string;
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden",
        className,
      )}
    >
      <div className="shrink-0 border-b border-border px-4 pb-3 pt-4">
        <h2 className="m-0 text-base font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </h2>
        <p className="m-0 mt-1.5 text-sm leading-snug text-muted-foreground">
          {subtitle}
        </p>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden px-4 pb-4 pt-3">
        <Image
          src="/images/qr-code-commercant-parcours.jpg"
          alt={alt}
          fill
          className="object-contain object-center"
          sizes="40vw"
          priority
        />
      </div>
    </aside>
  );
}

type QrActionButtonProps = {
  icon: typeof Download;
  title: string;
  subtitle: string;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
};

function QrActionButton({
  icon: Icon,
  title,
  subtitle,
  disabled,
  onClick,
  className,
}: QrActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-left transition-colors hover:border-[#2f6fed]/30 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
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

type AfterSignupTone = "blue" | "amber" | "violet";

const afterSignupToneStyles: Record<
  AfterSignupTone,
  { idle: string; active: string; iconIdle: string; iconActive: string }
> = {
  blue: {
    idle: "border-2 border-solid border-border bg-card shadow-none",
    active:
      "border-2 border-solid border-primary bg-primary/[0.04] shadow-sm",
    iconIdle: "border-border bg-muted/60 text-muted-foreground",
    iconActive: "border-primary/20 bg-primary/10 text-primary",
  },
  amber: {
    idle: "border-2 border-solid border-border bg-card shadow-none",
    active:
      "border-2 border-solid border-amber-400 bg-amber-50/70 shadow-sm",
    iconIdle: "border-border bg-muted/60 text-muted-foreground",
    iconActive: "border-amber-300/80 bg-amber-100/80 text-amber-700",
  },
  violet: {
    idle: "border-2 border-solid border-border bg-card shadow-none",
    active: "border-2 border-solid border-border bg-card shadow-none",
    iconIdle: "border-violet-200/70 bg-violet-50/80 text-violet-600",
    iconActive: "border-violet-200/70 bg-violet-50/80 text-violet-600",
  },
};

function AfterSignupCardButton({
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        "h-8 shrink-0 px-2.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

type AfterSignupOptionCardProps = {
  variant: "toggle" | "form";
  icon: LucideIcon;
  title: string;
  description: string;
  tone: AfterSignupTone;
  active?: boolean;
  compactFill?: boolean;
  trailing?: ReactNode;
  onOpenSettings?: () => void;
};

function AfterSignupOptionCard({
  variant,
  icon: Icon,
  title,
  description,
  tone,
  active = false,
  compactFill,
  trailing,
  onOpenSettings,
}: AfterSignupOptionCardProps) {
  const styles = afterSignupToneStyles[tone];
  const cardShell = cn(
    "min-h-0 rounded-xl p-3 transition-[border-color,background-color,box-shadow] duration-300 ease-out",
    compactFill ? "flex flex-1 flex-col justify-center" : "min-h-[5.5rem]",
    active ? styles.active : styles.idle,
  );

  const iconEl = (
    <span
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-lg border",
        active ? styles.iconActive : styles.iconIdle,
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden />
    </span>
  );

  const textBlock = (
    <div className="min-w-0 flex-1">
      <h4 className="m-0 text-sm font-semibold leading-snug text-foreground">
        {title}
      </h4>
      <p className="m-0 mt-1 text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );

  if (variant === "form") {
    return (
      <div className={cardShell}>
        <div className="flex items-center gap-3">
          {iconEl}
          {textBlock}
          {trailing ? (
            <div className="flex shrink-0 items-center pl-1">{trailing}</div>
          ) : null}
        </div>
      </div>
    );
  }

  const mainText = onOpenSettings ? (
    <button
      type="button"
      className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-sm"
      onClick={onOpenSettings}
    >
      {textBlock}
    </button>
  ) : (
    textBlock
  );

  return (
    <div className={cardShell}>
      <div className="flex items-center gap-3">
        {iconEl}
        <div className="flex min-w-0 flex-1 items-center">{mainText}</div>
        {trailing ? (
          <div className="flex shrink-0 items-center gap-2 pl-1">
            {trailing}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** UI exclusive : 0 ou 1 toggle actif — jamais les deux. */
function useExclusiveAfterSignupToggles(
  welcomeFromServer: boolean,
  wheelFromServer: boolean,
) {
  const [welcomeUi, setWelcomeUi] = useState(welcomeFromServer);
  const [wheelUi, setWheelUi] = useState(wheelFromServer);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (pendingRef.current) return;
    setWelcomeUi(welcomeFromServer);
    setWheelUi(wheelFromServer);
  }, [welcomeFromServer, wheelFromServer]);

  const applyWelcome = useCallback((next: boolean) => {
    pendingRef.current = true;
    setWelcomeUi(next);
    if (next) setWheelUi(false);
  }, []);

  const applyWheel = useCallback((next: boolean) => {
    pendingRef.current = true;
    setWheelUi(next);
    if (next) setWelcomeUi(false);
  }, []);

  const rollbackToServer = useCallback(() => {
    setWelcomeUi(welcomeFromServer);
    setWheelUi(wheelFromServer);
  }, [welcomeFromServer, wheelFromServer]);

  const endPending = useCallback(() => {
    pendingRef.current = false;
  }, []);

  return {
    welcomeUi,
    wheelUi,
    applyWelcome,
    applyWheel,
    rollbackToServer,
    endPending,
  };
}

function AfterSignupToggleCard(
  props: Omit<
    AfterSignupOptionCardProps,
    "variant" | "trailing" | "onOpenSettings"
  > & {
    checked: boolean;
    /** Désactive uniquement le bouton Configurer (pas le switch). */
    configureDisabled?: boolean;
    switchAriaLabel: string;
    configureLabel: string;
    onCheckedChange: (checked: boolean) => Promise<void>;
    onConfigure: () => void;
    tone: Exclude<AfterSignupTone, "violet">;
  },
) {
  const {
    checked,
    configureDisabled,
    switchAriaLabel,
    configureLabel,
    onCheckedChange,
    onConfigure,
    tone,
    ...rest
  } = props;

  return (
    <AfterSignupOptionCard
      {...rest}
      variant="toggle"
      tone={tone}
      active={checked}
      trailing={
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <AfterSignupCardButton
            disabled={!checked || configureDisabled}
            onClick={onConfigure}
          >
            {configureLabel}
          </AfterSignupCardButton>
          <Switch
            checked={checked}
            aria-label={switchAriaLabel}
            onCheckedChange={(next) => onCheckedChange(next)}
          />
        </div>
      }
    />
  );
}

export type QrCollectQrPanelProps = {
  publicUrl: string;
  loading: boolean;
  companyName?: string;
  captureMode: QrCaptureMode;
  welcomeSmsEnabled: boolean;
  onWelcomeSmsEnabledChange: (enabled: boolean) => Promise<void>;
  wheelEnabled: boolean;
  onWheelEnabledChange: (enabled: boolean) => Promise<void>;
  onEditSignupForm?: () => void;
  welcomeSmsTemplate: string;
  onWelcomeSmsTemplateChange: (template: string) => Promise<void>;
  wheelConfig: QrWheelConfig | null;
  wheelLoading: boolean;
  wheelSaving: boolean;
  onWheelSave: (config: QrWheelConfig) => Promise<void>;
  onWheelEnableDefaults: () => Promise<void>;
  className?: string;
  contentClassName?: string;
  /** Vue plein écran : illustration statique à gauche, sans preview animée. */
  showParcoursIllustration?: boolean;
  /** Ouvre l’aide « Où afficher mon QR code » (slide 0). */
  onOpenDisplayInspireHelp?: () => void;
};

export function QrCollectQrPanel({
  publicUrl,
  loading,
  companyName,
  captureMode,
  welcomeSmsEnabled,
  onWelcomeSmsEnabledChange,
  wheelEnabled,
  onWheelEnabledChange,
  onEditSignupForm,
  welcomeSmsTemplate,
  onWelcomeSmsTemplateChange,
  wheelConfig,
  wheelLoading,
  wheelSaving,
  onWheelSave,
  onWheelEnableDefaults,
  className,
  contentClassName,
  showParcoursIllustration = false,
  onOpenDisplayInspireHelp,
}: QrCollectQrPanelProps) {
  const { t } = useI18n();
  const [qrImage, setQrImage] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [wheelModalOpen, setWheelModalOpen] = useState(false);

  const {
    welcomeUi,
    wheelUi,
    applyWelcome,
    applyWheel,
    rollbackToServer,
    endPending,
  } = useExclusiveAfterSignupToggles(welcomeSmsEnabled, wheelEnabled);

  const welcomeToggleSeqRef = useRef(0);
  const wheelToggleSeqRef = useRef(0);

  const handleWelcomeToggle = useCallback(
    async (next: boolean) => {
      applyWelcome(next);
      const seq = ++welcomeToggleSeqRef.current;
      try {
        await onWelcomeSmsEnabledChange(next);
        if (seq !== welcomeToggleSeqRef.current) return;
      } catch (err) {
        if (seq === welcomeToggleSeqRef.current) {
          rollbackToServer();
        }
        throw err;
      } finally {
        if (seq === welcomeToggleSeqRef.current) {
          endPending();
        }
      }
    },
    [applyWelcome, endPending, onWelcomeSmsEnabledChange, rollbackToServer],
  );

  const handleWheelToggle = useCallback(
    async (next: boolean) => {
      applyWheel(next);
      const seq = ++wheelToggleSeqRef.current;
      try {
        await onWheelEnabledChange(next);
        if (seq !== wheelToggleSeqRef.current) return;
      } catch (err) {
        if (seq === wheelToggleSeqRef.current) {
          rollbackToServer();
        }
        throw err;
      } finally {
        if (seq === wheelToggleSeqRef.current) {
          endPending();
        }
      }
    },
    [applyWheel, endPending, onWheelEnabledChange, rollbackToServer],
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

  const editSignupFormButton = (
    <AfterSignupCardButton
      disabled={!onEditSignupForm}
      onClick={() => onEditSignupForm?.()}
    >
      {t("qr.after.editSignupForm")}
    </AfterSignupCardButton>
  );

  const qrCodeCardHero = (
    <div className="mx-auto flex h-full min-h-[248px] w-full max-w-[252px] shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-50 p-3 sm:mx-0 sm:w-[252px] sm:self-stretch">
      <div className="mb-1.5 flex shrink-0 items-center justify-between gap-1.5">
        <h3 className={qrCardTitleCls}>{t("qr.signupTitle")}</h3>
        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
          {t("qr.active")}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center py-1">
        {qrImage ? (
          <Image
            src={qrImage}
            alt={t("qr.alt")}
            width={168}
            height={168}
            unoptimized
            className="h-[168px] w-[168px] max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="h-[168px] w-[168px] animate-pulse rounded-lg bg-slate-200" />
        )}
      </div>
      <p className="m-0 shrink-0 text-center text-[10px] font-semibold text-slate-400">
        {t("qr.scanHint")}
      </p>
    </div>
  );

  const qrCodeCardCompact = (
    <div className="mx-auto flex aspect-square w-full max-w-[200px] shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-50 p-2">
      <div className="mb-1 flex shrink-0 items-center justify-between gap-1.5">
        <h3 className={qrCardTitleCls}>{t("qr.signupTitle")}</h3>
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
  );

  const downloadActions = (
    <>
      <QrActionButton
        icon={Download}
        title={t("qr.download")}
        subtitle="PNG"
        disabled={!qrImage}
        className={
          showParcoursIllustration
            ? "h-full min-h-[3.25rem] min-w-0 flex-1"
            : undefined
        }
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
        className={
          showParcoursIllustration
            ? "h-full min-h-[3.25rem] min-w-0 flex-1"
            : undefined
        }
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
        className={
          showParcoursIllustration
            ? "h-full min-h-[3.25rem] min-w-0 flex-1"
            : undefined
        }
        onClick={() => {
          if (!publicUrl) return;
          void navigator.clipboard.writeText(publicUrl).then(() => {
            setLinkCopied(true);
            window.setTimeout(() => setLinkCopied(false), 1500);
          });
        }}
      />
    </>
  );

  const configColumn = (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2",
        showParcoursIllustration &&
          "h-full min-h-0 flex-1 overflow-hidden",
      )}
    >
      {showParcoursIllustration ? (
        <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden">
        <section className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-stretch">
          {qrCodeCardHero}
          <div className="flex min-h-[248px] min-w-0 flex-1 flex-col sm:h-full sm:self-stretch">
            <div className="flex min-h-0 flex-[1_1_0] flex-col justify-center py-1">
              <p className={cn(qrPanelFieldLabelCls, "mb-1.5")}>
                {t("qr.signupLink")}
              </p>
              <CopyableLinkField
                value={publicUrl}
                size="compact"
                copiedToast={t("qr.hub.linkModal.copiedToast")}
              />
            </div>
            <div className="flex min-h-0 flex-[1_1_0] items-stretch py-1">
              <div className="grid h-full min-h-[3.25rem] w-full grid-cols-3 gap-2">
                {downloadActions}
              </div>
            </div>
            {downloadError ? (
              <p className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] font-bold text-rose-900">
                {downloadError}
              </p>
            ) : null}
            <div className="flex min-h-0 flex-[1_1_0] items-stretch py-1">
              <div
                className="flex h-full min-h-[3.25rem] w-full items-center gap-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2"
                role="note"
              >
                <Lightbulb
                  className="h-4 w-4 shrink-0 text-amber-600"
                  strokeWidth={2.25}
                  aria-hidden
                />
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="m-0 min-w-0 flex-1 text-[11px] font-medium leading-snug text-amber-950/90">
                    {t("qr.hub.displayVisibilityTip")}
                  </p>
                  {onOpenDisplayInspireHelp ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onOpenDisplayInspireHelp();
                      }}
                      className="inline-flex shrink-0 cursor-pointer items-center gap-0.5 border-0 bg-transparent p-0 text-[11px] font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      {t("qr.complianceMore")}
                      <ChevronRight
                        className="h-3.5 w-3.5 shrink-0"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-slate-100 pt-2">
                <QrPanelSectionHeader
                  className="mb-1.5"
                  title={t("qr.afterTitle")}
                  description={t("qr.afterDesc")}
                />

                <div
                  className="flex min-h-0 flex-1 flex-col gap-2"
                  aria-label={t("qr.afterAria")}
                >
                  <AfterSignupToggleCard
                    compactFill
                    icon={MessageCircle}
                    title={t("qr.mode.welcome.title")}
                    description={t("qr.mode.welcome.desc")}
                    checked={welcomeUi}
                    tone="blue"
                    configureLabel={t("qr.configure")}
                    switchAriaLabel={t("qr.mode.welcome.title")}
                    onCheckedChange={handleWelcomeToggle}
                    onConfigure={() => setWelcomeModalOpen(true)}
                  />
                  <AfterSignupToggleCard
                    compactFill
                    icon={Gift}
                    title={t("qr.mode.wheel.title")}
                    description={t("qr.mode.wheel.desc")}
                    checked={wheelUi}
                    tone="amber"
                    configureLabel={t("qr.configure")}
                    switchAriaLabel={t("qr.mode.wheel.title")}
                    onCheckedChange={handleWheelToggle}
                    onConfigure={() => setWheelModalOpen(true)}
                  />
                  <AfterSignupOptionCard
                    variant="form"
                    compactFill
                    tone="violet"
                    icon={ListPlus}
                    title={t("qr.after.form.title")}
                    description={t("qr.after.form.desc")}
                    trailing={editSignupFormButton}
                  />
                </div>
              </div>
        </div>
      ) : (
        <>
          {qrCodeCardCompact}
          <div className="min-w-0">
            <p className={cn(qrPanelFieldLabelCls, "mb-1")}>
              {t("qr.signupLink")}
            </p>
            <CopyableLinkField
              value={publicUrl}
              size="compact"
              copiedToast={t("qr.hub.linkModal.copiedToast")}
            />
          </div>
          {downloadError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] font-bold text-rose-900">
              {downloadError}
            </p>
          ) : null}
          <div className="grid grid-cols-3 gap-1.5">{downloadActions}</div>

          <div className="border-t border-slate-100 pt-2">
            <QrPanelSectionHeader
              className="mb-2"
              title={t("qr.afterTitle")}
              description={t("qr.afterDesc")}
            />
            <div
              className="grid grid-cols-1 gap-2"
              aria-label={t("qr.afterAria")}
            >
              <AfterSignupToggleCard
                icon={MessageCircle}
                title={t("qr.mode.welcome.title")}
                description={t("qr.mode.welcome.desc")}
                checked={welcomeUi}
                tone="blue"
                configureLabel={t("qr.configure")}
                switchAriaLabel={t("qr.mode.welcome.title")}
                onCheckedChange={handleWelcomeToggle}
                onConfigure={() => setWelcomeModalOpen(true)}
              />
              <AfterSignupToggleCard
                icon={Gift}
                title={t("qr.mode.wheel.title")}
                description={t("qr.mode.wheel.desc")}
                checked={wheelUi}
                tone="amber"
                configureLabel={t("qr.configure")}
                switchAriaLabel={t("qr.mode.wheel.title")}
                onCheckedChange={handleWheelToggle}
                onConfigure={() => setWheelModalOpen(true)}
              />
              <AfterSignupOptionCard
                variant="form"
                tone="violet"
                icon={ListPlus}
                title={t("qr.after.form.title")}
                description={t("qr.after.form.desc")}
                trailing={editSignupFormButton}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  const loadingOverlay = loading ? (
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
  ) : null;

  return (
    <>
      <div
        className={cn(
          "relative flex min-h-0 min-w-0 flex-1 overflow-hidden",
          showParcoursIllustration
            ? "flex-col gap-2 rounded-lg bg-canvas p-2 lg:h-full lg:flex-row lg:gap-3 lg:p-3"
            : "flex-col",
          className,
        )}
      >
        {showParcoursIllustration ? (
          <>
            <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:h-full lg:w-[60%] lg:max-w-[60%] lg:flex-none lg:shrink-0">
              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-4">
                {configColumn}
                {loadingOverlay}
              </div>
              <div className="shrink-0 overflow-x-hidden border-t border-border px-4 pb-4 pt-3">
                <QrCaptureComplianceCard />
              </div>
            </div>
            <QrParcoursIllustration
              alt={t("qr.hub.parcoursIllustrationAlt")}
              title={t("qr.hub.parcoursPreview.title")}
              subtitle={t("qr.hub.parcoursPreview.subtitle")}
              className="order-last min-h-[40vh] w-full shrink-0 rounded-xl border border-border bg-card shadow-sm lg:order-none lg:h-full lg:min-h-0 lg:w-[40%] lg:max-w-[40%] lg:shrink-0"
            />
          </>
        ) : (
          <>
            <div
              className={cn(
                "relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-1 pb-2 pt-0 sm:px-0",
                contentClassName,
              )}
            >
              <div className="grid min-h-0 min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
                <div className="flex min-w-0 flex-col gap-2 lg:border-r lg:border-slate-100 lg:pr-4">
                  {configColumn}
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
              {loadingOverlay}
            </div>
            <div className="shrink-0 overflow-x-hidden border-t border-border pt-2 pb-1">
              <div className={cn(contentClassName && "px-4 pb-2")}>
                <QrCaptureComplianceCard />
              </div>
            </div>
          </>
        )}
      </div>

      <QrWelcomeSmsSettingsModal
        open={welcomeModalOpen}
        onClose={() => setWelcomeModalOpen(false)}
        template={welcomeSmsTemplate}
        companyName={companyName}
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
