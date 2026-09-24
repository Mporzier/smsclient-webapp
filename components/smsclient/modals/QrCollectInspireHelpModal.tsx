"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import {
  ChevronLeft,
  ChevronRight,
  Coffee,
  Gift,
  Heart,
  Lightbulb,
  MessageSquare,
  MonitorSmartphone,
  Package,
  PanelTop,
  Receipt,
  Store,
  UserPlus,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";

export type InspireHelpStep = 0 | 1 | 2;

const SLIDE_COUNT = 3;

type HelpTip = {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
  iconWrapClassName: string;
  cardClassName: string;
};

type QrCollectInspireHelpModalProps = {
  open: boolean;
  onClose: () => void;
  initialStep: InspireHelpStep;
  onConfigureDisplay: () => void;
  onConfigureWheel: () => void;
  onConfigureWelcome: () => void;
};

function HelpTipCard({
  icon: Icon,
  label,
  subtitle,
  iconWrapClassName,
  cardClassName,
}: HelpTip) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-2.5 py-2.5",
        cardClassName,
      )}
    >
      <span
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
          iconWrapClassName,
        )}
        aria-hidden
      >
        <Icon className="block h-4 w-4 shrink-0" strokeWidth={2.25} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col justify-center text-left">
        <p className="m-0 text-xs font-semibold leading-snug text-foreground sm:text-sm">
          {label}
        </p>
        {subtitle ? (
          <p className="m-0 mt-0.5 text-[11px] leading-snug text-muted-foreground sm:text-xs">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

type InspireHelpModalBodyProps = Omit<QrCollectInspireHelpModalProps, "open">;

function InspireHelpModalBody({
  onClose,
  initialStep,
  onConfigureDisplay,
  onConfigureWheel,
  onConfigureWelcome,
}: InspireHelpModalBodyProps) {
  const { t } = useI18n();
  const [step, setStep] = useState<InspireHelpStep>(initialStep);

  const slides = useMemo(
    () =>
      [
        {
          image: "/images/collecte-aide-afficher-qr.jpg",
          imageAlt: t("qr.hub.inspire.help.display.imageAlt"),
          title: t("qr.hub.inspire.display.title"),
          subtitle: t("qr.hub.inspire.help.display.subtitle"),
          adviceSubtitle: t("qr.hub.inspire.help.display.advice"),
          actionLabel: t("qr.hub.card.qr.cta"),
          onAction: onConfigureDisplay,
          tips: [
            {
              icon: Store,
              label: t("qr.hub.inspire.help.display.tip1"),
              subtitle: t("qr.hub.inspire.help.display.tip1Sub"),
              iconWrapClassName: "bg-violet-500/20 text-violet-600",
              cardClassName: "border-violet-200/70 bg-violet-50/60",
            },
            {
              icon: Receipt,
              label: t("qr.hub.inspire.help.display.tip2"),
              subtitle: t("qr.hub.inspire.help.display.tip2Sub"),
              iconWrapClassName: "bg-blue-500/20 text-blue-600",
              cardClassName: "border-blue-200/70 bg-blue-50/60",
            },
            {
              icon: PanelTop,
              label: t("qr.hub.inspire.help.display.tip3"),
              subtitle: t("qr.hub.inspire.help.display.tip3Sub"),
              iconWrapClassName: "bg-emerald-500/20 text-emerald-600",
              cardClassName: "border-emerald-200/70 bg-emerald-50/60",
            },
            {
              icon: Coffee,
              label: t("qr.hub.inspire.help.display.tip4"),
              subtitle: t("qr.hub.inspire.help.display.tip4Sub"),
              iconWrapClassName: "bg-amber-500/20 text-amber-600",
              cardClassName: "border-amber-200/70 bg-amber-50/60",
            },
            {
              icon: Package,
              label: t("qr.hub.inspire.help.display.tip5"),
              subtitle: t("qr.hub.inspire.help.display.tip5Sub"),
              iconWrapClassName: "bg-pink-500/20 text-pink-600",
              cardClassName: "border-pink-200/70 bg-pink-50/60",
            },
            {
              icon: MonitorSmartphone,
              label: t("qr.hub.inspire.help.display.tip6"),
              subtitle: t("qr.hub.inspire.help.display.tip6Sub"),
              iconWrapClassName: "bg-cyan-500/20 text-cyan-600",
              cardClassName: "border-cyan-200/70 bg-cyan-50/60",
            },
          ] satisfies HelpTip[],
        },
        {
          image: "/images/collecte-aide-roue.jpg",
          imageAlt: t("qr.hub.inspire.help.wheel.imageAlt"),
          title: t("qr.hub.inspire.help.wheel.title"),
          subtitle: t("qr.hub.inspire.help.wheel.subtitle"),
          adviceSubtitle: t("qr.hub.inspire.help.wheel.advice"),
          actionLabel: t("qr.hub.inspire.help.wheel.action"),
          onAction: onConfigureWheel,
          tips: [
            {
              icon: UserPlus,
              label: t("qr.hub.inspire.help.wheel.tip1"),
              subtitle: t("qr.hub.inspire.help.wheel.tip1Sub"),
              iconWrapClassName: "bg-violet-500/20 text-violet-600",
              cardClassName: "border-violet-200/70 bg-violet-50/60",
            },
            {
              icon: Gift,
              label: t("qr.hub.inspire.help.wheel.tip2"),
              subtitle: t("qr.hub.inspire.help.wheel.tip2Sub"),
              iconWrapClassName: "bg-pink-500/20 text-pink-600",
              cardClassName: "border-pink-200/70 bg-pink-50/60",
            },
            {
              icon: Store,
              label: t("qr.hub.inspire.help.wheel.tip3"),
              subtitle: t("qr.hub.inspire.help.wheel.tip3Sub"),
              iconWrapClassName: "bg-emerald-500/20 text-emerald-600",
              cardClassName: "border-emerald-200/70 bg-emerald-50/60",
            },
            {
              icon: Zap,
              label: t("qr.hub.inspire.help.wheel.tip4"),
              subtitle: t("qr.hub.inspire.help.wheel.tip4Sub"),
              iconWrapClassName: "bg-amber-500/20 text-amber-600",
              cardClassName: "border-amber-200/70 bg-amber-50/60",
            },
          ] satisfies HelpTip[],
        },
        {
          image: "/images/collecte-aide-sms-bienvenue.jpg",
          imageAlt: t("qr.hub.inspire.help.welcome.imageAlt"),
          title: t("qr.hub.inspire.help.welcome.title"),
          subtitle: t("qr.hub.inspire.help.welcome.subtitle"),
          adviceSubtitle: t("qr.hub.inspire.help.welcome.advice"),
          actionLabel: t("qr.hub.inspire.help.welcome.action"),
          onAction: onConfigureWelcome,
          tips: [
            {
              icon: Heart,
              label: t("qr.hub.inspire.help.welcome.tip1"),
              subtitle: t("qr.hub.inspire.help.welcome.tip1Sub"),
              iconWrapClassName: "bg-violet-500/20 text-violet-600",
              cardClassName: "border-violet-200/70 bg-violet-50/60",
            },
            {
              icon: Gift,
              label: t("qr.hub.inspire.help.welcome.tip2"),
              subtitle: t("qr.hub.inspire.help.welcome.tip2Sub"),
              iconWrapClassName: "bg-pink-500/20 text-pink-600",
              cardClassName: "border-pink-200/70 bg-pink-50/60",
            },
            {
              icon: Zap,
              label: t("qr.hub.inspire.help.welcome.tip3"),
              subtitle: t("qr.hub.inspire.help.welcome.tip3Sub"),
              iconWrapClassName: "bg-emerald-500/20 text-emerald-600",
              cardClassName: "border-emerald-200/70 bg-emerald-50/60",
            },
            {
              icon: MessageSquare,
              label: t("qr.hub.inspire.help.welcome.tip4"),
              subtitle: t("qr.hub.inspire.help.welcome.tip4Sub"),
              iconWrapClassName: "bg-amber-500/20 text-amber-600",
              cardClassName: "border-amber-200/70 bg-amber-50/60",
            },
          ] satisfies HelpTip[],
        },
      ] as const,
    [t, onConfigureDisplay, onConfigureWheel, onConfigureWelcome],
  );

  const slide = slides[step];

  return (
        <div className="relative flex min-h-[min(420px,55dvh)] w-full min-w-0 flex-1 flex-col">
          <div className="pointer-events-none absolute top-4 left-4 z-10 flex max-w-[calc(100%-4.5rem)] items-center gap-2 sm:left-5 sm:top-5 sm:max-w-[calc(100%-5rem)] sm:gap-2.5">
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600"
              aria-hidden
            >
              <Lightbulb className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <h2 className="m-0 text-left text-base font-semibold leading-tight text-foreground sm:text-lg">
              {t("qr.hub.inspire.help.tooltip")}
            </h2>
          </div>

          <Button
            type="button"
            className="absolute right-7 bottom-3 z-30 sm:right-9 sm:bottom-4"
            onClick={() => {
              onClose();
              slide.onAction();
            }}
          >
            {slide.actionLabel}
          </Button>

          <div
            className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center gap-1.5 sm:bottom-4"
            role="tablist"
            aria-label={t("qr.hub.inspire.help.steps")}
          >
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={step === index}
                aria-label={t("qr.hub.inspire.help.goToStep", { n: index + 1 })}
                className={cn(
                  "h-2 rounded-full",
                  step === index ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30",
                )}
                onClick={() => setStep(index as InspireHelpStep)}
              />
            ))}
          </div>

        <div className="relative flex min-h-0 flex-1 flex-col pt-[4.75rem] sm:pt-20">
          <button
            type="button"
            className="absolute top-1/2 left-0 z-20 inline-flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md outline-none hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            disabled={step === 0}
            aria-label={t("qr.hub.inspire.help.prev")}
            onClick={() => setStep((s) => (s > 0 ? ((s - 1) as InspireHelpStep) : s))}
          >
            <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          </button>

          <button
            type="button"
            className="absolute top-1/2 right-0 z-20 inline-flex h-9 w-9 translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md outline-none hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            disabled={step === SLIDE_COUNT - 1}
            aria-label={t("qr.hub.inspire.help.next")}
            onClick={() =>
              setStep((s) =>
                s < SLIDE_COUNT - 1 ? ((s + 1) as InspireHelpStep) : s,
              )
            }
          >
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          </button>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-7 pb-14 sm:px-9 sm:pb-16">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(240px,48%)] md:items-start md:gap-5">
            <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
              <div className="shrink-0 space-y-1">
                <p className="m-0 text-base font-semibold text-foreground">
                  {slide.title}
                </p>
                {"subtitle" in slide && slide.subtitle ? (
                  <p className="m-0 text-xs leading-snug text-muted-foreground sm:text-sm">
                    {slide.subtitle}
                  </p>
                ) : null}
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-0.5">
                {slide.tips.map((tip) => (
                  <HelpTipCard key={tip.label} {...tip} />
                ))}
              </div>
            </div>

            <div className="flex w-full min-w-0 flex-col gap-2.5">
              <Image
                key={slide.image}
                src={slide.image}
                alt={slide.imageAlt}
                width={640}
                height={800}
                className="h-auto w-full max-w-full rounded-xl object-contain object-top max-h-none md:max-h-[min(50dvh,440px)] md:rounded-2xl"
                sizes="(min-width: 768px) 46vw, 88vw"
                priority
              />
              <HelpTipCard
                icon={Lightbulb}
                label={t("qr.hub.inspire.help.advice.title")}
                subtitle={slide.adviceSubtitle}
                iconWrapClassName="bg-amber-500/20 text-amber-600"
                cardClassName="border-amber-200/80 bg-amber-50/55 md:max-w-[calc(100%-0.5rem)]"
              />
              <div className="h-11 shrink-0 sm:h-12" aria-hidden />
            </div>
          </div>

          </div>
        </div>
        </div>
  );
}

export function QrCollectInspireHelpModal({
  open,
  onClose,
  initialStep,
  onConfigureDisplay,
  onConfigureWheel,
  onConfigureWelcome,
}: QrCollectInspireHelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton
        className={cn(
          formDialogContentCls,
          dialogContentZCls,
          "max-h-[min(94dvh,820px)] overflow-visible sm:max-w-[min(96vw,960px)]",
        )}
        onOpenAutoFocus={preventDialogOpenAutoFocus}
        overlayClassName={dialogOverlayCls}
      >
        {open ? (
          <InspireHelpModalBody
            key={initialStep}
            initialStep={initialStep}
            onClose={onClose}
            onConfigureDisplay={onConfigureDisplay}
            onConfigureWheel={onConfigureWheel}
            onConfigureWelcome={onConfigureWelcome}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
