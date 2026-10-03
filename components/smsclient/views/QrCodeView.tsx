"use client";

import {
  QrCollectInspireHelpModal,
  type InspireHelpStep,
} from "@/components/smsclient/modals/QrCollectInspireHelpModal";
import { QrCollectLinkModal } from "@/components/smsclient/modals/QrCollectLinkModal";
import { QrCollectQrPanel } from "@/components/smsclient/views/QrCollectQrPanel";
import { QrWelcomeSmsSettingsModal } from "@/components/smsclient/modals/QrWelcomeSmsSettingsModal";
import { QrWheelSettingsModal } from "@/components/smsclient/modals/QrWheelSettingsModal";
import { QrCaptureStatsCard } from "@/components/smsclient/views/QrCaptureStatsCard";
import { useShellHeaderTitle } from "@/components/smsclient/shell/ShellHeaderTitleContext";
import { Button } from "@/components/ui/button";
import { useQrStats } from "@/hooks/useQrStats";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import type { QrCaptureMode } from "@/lib/supabase/qrCodes";
import type { QrWheelConfig } from "@/lib/types/qrWheel";
import {
  Gift,
  Lightbulb,
  ChevronRight,
  File,
  Link,
  MessageCircle,
  QrCode,
  ScanQrCode,
  Store,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Visuel hub collecte — ajuster widthPx pour la largeur colonne droite. */
const COLLECTE_HERO_SIZE = {
  widthPx: 420,
  widthPercent: 42,
} as const;

type QrCodeViewProps = {
  publicUrl: string;
  loading: boolean;
  error: string | null;
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
  onImportContacts?: () => void;
  onAddContact?: () => void;
};

type CollectMethodCardProps = {
  icon: LucideIcon;
  iconWrapClassName: string;
  ctaClassName: string;
  ctaHighlighted?: boolean;
  ctaIcon?: LucideIcon;
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
};

function CollectMethodCard({
  icon: Icon,
  iconWrapClassName,
  ctaClassName,
  ctaHighlighted = false,
  ctaIcon: CtaIcon,
  title,
  description,
  cta,
  onClick,
}: CollectMethodCardProps) {
  return (
    <article className="flex min-h-0 flex-col justify-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 sm:gap-3.5 sm:p-5">
      <div className="flex min-h-0 flex-1 items-center gap-3 sm:gap-3.5">
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ring-foreground/10 sm:h-12 sm:w-12",
            iconWrapClassName
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} />
        </span>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-1.5">
          <h3 className="m-0 text-sm font-semibold leading-snug text-foreground sm:text-base">
            {title}
          </h3>
          <p className="m-0 min-h-0 flex-1 line-clamp-4 text-xs leading-snug text-muted-foreground sm:text-sm sm:leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 justify-center">
        <Button
          type="button"
          variant={ctaHighlighted ? "ghost" : "default"}
          size="lg"
          className={cn(
            "h-10 text-sm sm:h-11",
            ctaHighlighted
              ? "w-[72%] font-semibold shadow-none [&>*]:relative [&>*]:z-[1] [&_svg]:!size-6 sm:[&_svg]:!size-7"
              : "w-[62%] font-medium",
            ctaClassName,
          )}
          onClick={onClick}
        >
          {CtaIcon ? (
            <CtaIcon
              className={cn("shrink-0", ctaHighlighted ? "size-6 sm:size-7" : "size-4")}
              data-icon="inline-start"
              aria-hidden
            />
          ) : null}
          {cta}
        </Button>
      </div>
    </article>
  );
}

type InspirationCtaCardProps = {
  icon: LucideIcon;
  label: string;
  subtext: string;
  cardClassName: string;
  iconWrapClassName: string;
  chevronClassName: string;
  onClick: () => void;
};

function InspirationCtaCard({
  icon: Icon,
  label,
  subtext,
  cardClassName,
  iconWrapClassName,
  chevronClassName,
  onClick,
}: InspirationCtaCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex h-full min-h-[4.75rem] cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition-colors sm:min-h-[5.25rem] sm:gap-3 sm:px-4 sm:py-3.5",
        cardClassName
      )}
    >
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-lg sm:h-11 sm:w-11",
          iconWrapClassName
        )}
      >
        <Icon
          className="h-5 w-5 sm:h-[22px] sm:w-[22px]"
          strokeWidth={2.25}
          aria-hidden
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block line-clamp-2 text-xs font-semibold leading-snug text-foreground sm:text-sm">
          {label}
        </span>
        <span className="mt-1 block line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:text-xs">
          {subtext}
        </span>
      </span>
      <ChevronRight
        className={cn(
          "h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 sm:h-[22px] sm:w-[22px]",
          chevronClassName
        )}
        strokeWidth={2.25}
        aria-hidden
      />
    </button>
  );
}

export function QrCodeView({
  publicUrl,
  loading,
  error,
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
  onImportContacts,
  onAddContact,
}: QrCodeViewProps) {
  const { t } = useI18n();
  const { setTitleOverride, setHeaderBack } = useShellHeaderTitle();
  const { stats: qrStats, loading: qrStatsLoading } = useQrStats();
  const [qrConfigOpen, setQrConfigOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [inspireHelpOpen, setInspireHelpOpen] = useState(false);
  const [inspireHelpStep, setInspireHelpStep] = useState<InspireHelpStep>(0);
  const inspireHelpOpenRef = useRef(inspireHelpOpen);
  inspireHelpOpenRef.current = inspireHelpOpen;

  const handleShellBack = useCallback(() => {
    if (inspireHelpOpenRef.current) {
      setInspireHelpOpen(false);
      return;
    }
    setQrConfigOpen(false);
  }, []);

  useEffect(() => {
    if (!qrConfigOpen) {
      setTitleOverride(null);
      setHeaderBack(null);
      return;
    }
    setTitleOverride(t("qr.pageTitle"));
    setHeaderBack({
      label: t("qr.hub.back"),
      ariaLabel: t("qr.hub.backAria"),
      onBack: handleShellBack,
    });
    return () => {
      setTitleOverride(null);
      setHeaderBack(null);
    };
  }, [qrConfigOpen, handleShellBack, setTitleOverride, setHeaderBack, t]);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [wheelModalOpen, setWheelModalOpen] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);

  const openInspireHelp = useCallback((step: InspireHelpStep) => {
    setInspireHelpStep(step);
    setInspireHelpOpen(true);
  }, []);

  const closeInspireHelp = useCallback(() => {
    setInspireHelpOpen(false);
  }, []);

  const handleInspireConfigureDisplay = useCallback(() => {
    setInspireHelpOpen(false);
    setQrConfigOpen(true);
  }, []);

  const openDisplayInspireFromQrConfig = useCallback(() => {
    setQrConfigOpen(true);
    openInspireHelp(0);
  }, [openInspireHelp]);

  const openWelcomeConfig = () => {
    void onWelcomeSmsEnabledChange(true);
    setWelcomeModalOpen(true);
  };

  const openWheelConfig = () => {
    void onWheelEnabledChange(true);
    setWheelModalOpen(true);
  };

  const methods = useMemo(
    () =>
      [
        {
          id: "qr",
          icon: QrCode,
          iconWrapClassName: "bg-violet-500/10 text-violet-600",
          ctaHighlighted: true,
          ctaIcon: ScanQrCode,
          ctaClassName:
            "border-0 relative isolate overflow-hidden bg-gradient-to-br from-[#4c1d95] via-[#9333ea] to-[#581c87] text-white before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-tl before:from-[#581c87] before:via-[#a855f7] before:to-[#4c1d95] before:opacity-0 before:transition-opacity before:duration-300 before:content-[''] hover:before:opacity-100 hover:text-white",
          title: t("qr.hub.card.qr.title"),
          description: t("qr.hub.card.qr.desc"),
          cta: t("qr.hub.card.qr.cta"),
          onClick: () => setQrConfigOpen(true),
        },
        {
          id: "link",
          icon: Link,
          iconWrapClassName: "bg-blue-500/15 text-blue-600",
          ctaClassName:
            "border-0 bg-blue-500 text-white shadow-sm hover:bg-blue-600",
          title: t("qr.hub.card.link.title"),
          description: t("qr.hub.card.link.desc"),
          cta: t("qr.hub.card.link.cta"),
          onClick: () => setLinkModalOpen(true),
        },
        {
          id: "import",
          icon: File,
          iconWrapClassName: "bg-emerald-500/10 text-emerald-600",
          ctaClassName:
            "border-0 bg-blue-500 text-white shadow-sm hover:bg-blue-600",
          title: t("qr.hub.card.import.title"),
          description: t("qr.hub.card.import.desc"),
          cta: t("qr.hub.card.import.cta"),
          onClick: () => onImportContacts?.(),
        },
        {
          id: "manual",
          icon: UserPlus,
          iconWrapClassName: "bg-amber-500/10 text-amber-600",
          ctaClassName:
            "border-0 bg-blue-500 text-white shadow-sm hover:bg-blue-600",
          title: t("qr.hub.card.manual.title"),
          description: t("qr.hub.card.manual.desc"),
          cta: t("qr.hub.card.manual.cta"),
          onClick: () => onAddContact?.(),
        },
      ] as const,
    [t, onImportContacts, onAddContact]
  );

  const qrPanelProps = {
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
  };

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden",
        qrConfigOpen ? "gap-1 overflow-x-hidden lg:min-h-0" : "gap-2",
      )}
    >
      {error ? (
        <div
          className="shrink-0 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {qrConfigOpen ? (
        <QrCollectQrPanel
          {...qrPanelProps}
          showParcoursIllustration
          onOpenDisplayInspireHelp={openDisplayInspireFromQrConfig}
          className="min-h-0 min-w-0 flex-1 lg:h-full"
        />
      ) : (
        <>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden lg:flex-row lg:gap-4">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden">
          <QrCaptureStatsCard stats={qrStats} loading={qrStatsLoading} />

          <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <h2 className="m-0 shrink-0 text-base font-semibold leading-tight tracking-tight text-foreground sm:text-lg">
              {t("qr.hub.methodsTitle")}
            </h2>
            <p className="m-0 mt-0.5 line-clamp-2 shrink-0 text-xs text-muted-foreground sm:text-sm">
              {t("qr.hub.methodsSubtitle")}
            </p>

            <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2 sm:gap-2.5">
              {methods.map((method) => (
                <CollectMethodCard
                  key={method.id}
                  icon={method.icon}
                  iconWrapClassName={method.iconWrapClassName}
                  ctaClassName={method.ctaClassName}
                  ctaHighlighted={
                    "ctaHighlighted" in method && method.ctaHighlighted === true
                  }
                  ctaIcon={"ctaIcon" in method ? method.ctaIcon : undefined}
                  title={method.title}
                  description={method.description}
                  cta={method.cta}
                  onClick={method.onClick}
                />
              ))}
            </div>
          </section>
        </div>

        <aside
          className="relative hidden min-h-0 shrink-0 self-stretch overflow-hidden lg:block"
          style={{
            width: `min(${COLLECTE_HERO_SIZE.widthPercent}%, ${COLLECTE_HERO_SIZE.widthPx}px)`,
          }}
        >
          <Image
            src="/images/collecte-clients-exemple.jpg"
            alt={t("qr.hub.heroAlt")}
            fill
            className="object-contain object-top"
            sizes="(min-width: 1024px) 420px, 0px"
            priority
          />
        </aside>
      </div>

      <section className="flex min-h-[9.5rem] shrink-0 flex-col rounded-xl border border-border bg-muted/30 p-3 sm:min-h-[10.5rem] sm:p-4">
        <div className="mb-2.5 flex shrink-0 items-start gap-2.5 sm:mb-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-background text-amber-500 sm:h-9 sm:w-9">
            <Lightbulb
              className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
              strokeWidth={2.25}
              aria-hidden
            />
          </span>
          <div className="min-w-0">
            <h3 className="m-0 text-sm font-semibold text-foreground sm:text-base">
              {t("qr.hub.inspire.title")}
            </h3>
            <p className="m-0 mt-0.5 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
              {t("qr.hub.inspire.subtitle")}
            </p>
          </div>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-3 items-stretch gap-2 sm:gap-3">
          <InspirationCtaCard
            icon={Store}
            label={t("qr.hub.inspire.display.cta")}
            subtext={t("qr.hub.inspire.display.subtext")}
            cardClassName="border-violet-200/80 bg-violet-50/70 hover:bg-violet-100/80"
            iconWrapClassName="bg-violet-500/20 text-violet-600"
            chevronClassName="text-violet-400 group-hover:text-violet-600"
            onClick={() => openInspireHelp(0)}
          />
          <InspirationCtaCard
            icon={Gift}
            label={t("qr.hub.inspire.wheel.cta")}
            subtext={t("qr.hub.inspire.wheel.subtext")}
            cardClassName="border-amber-200/80 bg-amber-50/80 hover:bg-amber-100/80"
            iconWrapClassName="bg-amber-500/20 text-amber-600"
            chevronClassName="text-amber-400 group-hover:text-amber-600"
            onClick={() => openInspireHelp(1)}
          />
          <InspirationCtaCard
            icon={MessageCircle}
            label={t("qr.hub.inspire.welcome.cta")}
            subtext={t("qr.hub.inspire.welcome.subtext")}
            cardClassName="border-blue-200/80 bg-blue-50/70 hover:bg-blue-100/80"
            iconWrapClassName="bg-blue-500/20 text-blue-600"
            chevronClassName="text-blue-400 group-hover:text-blue-600"
            onClick={() => openInspireHelp(2)}
          />
        </div>
      </section>
        </>
      )}

      <QrCollectLinkModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        publicUrl={publicUrl}
      />

      <QrCollectInspireHelpModal
        open={inspireHelpOpen}
        onClose={closeInspireHelp}
        initialStep={inspireHelpStep}
        onConfigureDisplay={handleInspireConfigureDisplay}
        onConfigureWheel={openWheelConfig}
        onConfigureWelcome={openWelcomeConfig}
      />

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
    </div>
  );
}
