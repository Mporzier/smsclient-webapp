"use client";

import {
  QrCollectInspireHelpModal,
  type InspireHelpStep,
} from "@/components/smsclient/modals/QrCollectInspireHelpModal";
import { QrCollectLinkModal } from "@/components/smsclient/modals/QrCollectLinkModal";
import { QrCollectQrModal } from "@/components/smsclient/modals/QrCollectQrModal";
import { QrWelcomeSmsSettingsModal } from "@/components/smsclient/modals/QrWelcomeSmsSettingsModal";
import { QrWheelSettingsModal } from "@/components/smsclient/modals/QrWheelSettingsModal";
import { QrCaptureStatsCard } from "@/components/smsclient/views/QrCaptureStatsCard";
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
  Store,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

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
  onCaptureModeChange: (mode: QrCaptureMode) => Promise<void>;
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
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
};

function CollectMethodCard({
  icon: Icon,
  iconWrapClassName,
  ctaClassName,
  title,
  description,
  cta,
  onClick,
}: CollectMethodCardProps) {
  return (
    <article className="flex min-h-0 flex-col gap-2.5 overflow-hidden rounded-xl border border-border bg-card p-3">
      <div className="flex min-h-0 flex-1 items-start gap-3">
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ring-foreground/10 sm:h-12 sm:w-12",
            iconWrapClassName
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} />
        </span>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1">
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
          size="lg"
          className={cn("h-11 w-1/2 font-medium sm:h-12", ctaClassName)}
          onClick={onClick}
        >
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
        "group flex min-h-0 cursor-pointer items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors sm:gap-2.5 sm:px-3 sm:py-2.5",
        cardClassName
      )}
    >
      <span
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-md",
          iconWrapClassName
        )}
      >
        <Icon
          className="h-3.5 w-3.5 sm:h-4 sm:w-4"
          strokeWidth={2.25}
          aria-hidden
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block line-clamp-2 text-[10px] font-semibold leading-snug text-foreground sm:text-xs">
          {label}
        </span>
        <span className="mt-0.5 block line-clamp-1 text-[10px] leading-snug text-muted-foreground">
          {subtext}
        </span>
      </span>
      <ChevronRight
        className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5",
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
  onCaptureModeChange,
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
  const { stats: qrStats, loading: qrStatsLoading } = useQrStats();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [inspireHelpOpen, setInspireHelpOpen] = useState(false);
  const [inspireHelpStep, setInspireHelpStep] = useState<InspireHelpStep>(0);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [wheelModalOpen, setWheelModalOpen] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);

  const openInspireHelp = (step: InspireHelpStep) => {
    setInspireHelpStep(step);
    setInspireHelpOpen(true);
  };

  const openWelcomeConfig = () => {
    if (captureMode !== "welcome") {
      void onCaptureModeChange("welcome");
    }
    setWelcomeModalOpen(true);
  };

  const openWheelConfig = () => {
    if (captureMode !== "wheel") {
      void onCaptureModeChange("wheel");
    }
    setWheelModalOpen(true);
  };

  const methods = useMemo(
    () =>
      [
        {
          id: "qr",
          icon: QrCode,
          iconWrapClassName: "bg-violet-500/10 text-violet-600",
          ctaClassName:
            "bg-violet-300/85 text-violet-950 hover:bg-violet-400/90",
          title: t("qr.hub.card.qr.title"),
          description: t("qr.hub.card.qr.desc"),
          cta: t("qr.hub.card.qr.cta"),
          onClick: () => setQrModalOpen(true),
        },
        {
          id: "link",
          icon: Link,
          iconWrapClassName: "bg-blue-500/15 text-blue-600",
          ctaClassName: "bg-blue-400/90 text-white hover:bg-blue-500/90",
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
            "bg-emerald-300/85 text-emerald-950 hover:bg-emerald-400/90",
          title: t("qr.hub.card.import.title"),
          description: t("qr.hub.card.import.desc"),
          cta: t("qr.hub.card.import.cta"),
          onClick: () => onImportContacts?.(),
        },
        {
          id: "manual",
          icon: UserPlus,
          iconWrapClassName: "bg-amber-500/10 text-amber-600",
          ctaClassName: "bg-amber-300/85 text-amber-950 hover:bg-amber-400/90",
          title: t("qr.hub.card.manual.title"),
          description: t("qr.hub.card.manual.desc"),
          cta: t("qr.hub.card.manual.cta"),
          onClick: () => onAddContact?.(),
        },
      ] as const,
    [t, onImportContacts, onAddContact]
  );

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col gap-2 overflow-hidden">
      {error ? (
        <div
          className="shrink-0 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : null}

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

            <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2">
              {methods.map((method) => (
                <CollectMethodCard
                  key={method.id}
                  icon={method.icon}
                  iconWrapClassName={method.iconWrapClassName}
                  ctaClassName={method.ctaClassName}
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

      <section className="shrink-0 rounded-xl border border-border bg-muted/30 p-2.5 sm:p-3">
        <div className="mb-2 flex items-start gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-background text-amber-500 sm:h-8 sm:w-8">
            <Lightbulb
              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
              strokeWidth={2.25}
              aria-hidden
            />
          </span>
          <div className="min-w-0">
            <h3 className="m-0 text-xs font-semibold text-foreground sm:text-sm">
              {t("qr.hub.inspire.title")}
            </h3>
            <p className="m-0 mt-0.5 line-clamp-1 text-[10px] text-muted-foreground sm:text-xs">
              {t("qr.hub.inspire.subtitle")}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
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

      <QrCollectQrModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        publicUrl={publicUrl}
        loading={loading}
        companyName={companyName}
        captureMode={captureMode}
        onCaptureModeChange={onCaptureModeChange}
        welcomeSmsTemplate={welcomeSmsTemplate}
        onWelcomeSmsTemplateChange={onWelcomeSmsTemplateChange}
        wheelConfig={wheelConfig}
        wheelLoading={wheelLoading}
        wheelSaving={wheelSaving}
        onWheelSave={onWheelSave}
        onWheelEnableDefaults={onWheelEnableDefaults}
      />

      <QrCollectLinkModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        publicUrl={publicUrl}
      />

      <QrCollectInspireHelpModal
        open={inspireHelpOpen}
        onClose={() => setInspireHelpOpen(false)}
        initialStep={inspireHelpStep}
        onConfigureDisplay={() => setQrModalOpen(true)}
        onConfigureWheel={openWheelConfig}
        onConfigureWelcome={openWelcomeConfig}
      />

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
