"use client";

import { cn } from "@/lib/cn";
import { DEFAULT_QR_WELCOME_SMS_TEMPLATE } from "@/lib/qr/welcomeSmsDefaults";
import { previewSmsMessage } from "@/lib/proto/smsPersonalization";
import type { QrCaptureMode } from "@/lib/supabase/qrCodes";
import type { QrWheelConfig } from "@/lib/types/qrWheel";
import { Check, Gift, MessageCircle, QrCode, UserRound } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

const PHONE_SCREEN_WIDTH = 390;
const PHONE_SCREEN_HEIGHT = 844;
const PHONE_BEZEL = 4;
/** Moitié supérieure du téléphone uniquement. */
const VISIBLE_TOP_RATIO = 0.5;
const FILL_PHONE_WIDTH = 240;
const COMPACT_PHONE_WIDTH = 200;
const STEP_DURATION_MS = 3600;

function phoneDimensions(outerWidth: number) {
  const innerWidth = outerWidth - PHONE_BEZEL * 2;
  const fullHeight = innerWidth * (PHONE_SCREEN_HEIGHT / PHONE_SCREEN_WIDTH);
  const visibleHeight = fullHeight * VISIBLE_TOP_RATIO;
  return { innerWidth, visibleHeight };
}

function CroppedPhoneFrame({
  width,
  className,
  children,
}: {
  width: number;
  className?: string;
  children: ReactNode;
}) {
  const { innerWidth, visibleHeight } = phoneDimensions(width);

  return (
    <div
      className={cn(
        "select-none shrink-0 overflow-hidden rounded-t-[28px] rounded-b-lg bg-slate-900 p-1 shadow-[0_12px_32px_rgba(15,23,42,0.14)]",
        "[&_*]:pointer-events-none [&_*]:select-none",
        className,
      )}
      style={{ width }}
      aria-hidden
    >
      <div
        className="flex flex-col overflow-hidden rounded-t-[22px] rounded-b-sm bg-white"
        style={{ width: innerWidth, height: visibleHeight }}
      >
        {children}
      </div>
    </div>
  );
}

type FlowStepId = "scan" | "signup" | "wheel" | "welcome" | "thanks";

type FlowStep = {
  id: FlowStepId;
  label: string;
  icon: typeof QrCode;
};

const BASE_FLOW_STEPS: FlowStep[] = [
  { id: "scan", label: "Scan du QR code", icon: QrCode },
  { id: "signup", label: "Inscription rapide", icon: UserRound },
];

function flowStepsForMode(captureMode: QrCaptureMode): FlowStep[] {
  const thirdStep: FlowStep =
    captureMode === "welcome"
      ? {
          id: "welcome",
          label: "SMS de bienvenue",
          icon: MessageCircle,
        }
      : captureMode === "wheel"
        ? {
            id: "wheel",
            label: "Roue des récompenses",
            icon: Gift,
          }
        : {
            id: "thanks",
            label: "Inscription confirmée",
            icon: Check,
          };

  return [...BASE_FLOW_STEPS, thirdStep];
}

function formatStatusTime(date: Date) {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function IphoneStatusBar({ time }: { time: string }) {
  return (
    <div className="relative flex h-[18px] shrink-0 items-center justify-between bg-white px-3 pt-0.5 text-[9px] font-semibold leading-none text-slate-900">
      <span className="w-8 tabular-nums">{time}</span>
      <div className="pointer-events-none absolute left-1/2 top-1 h-[11px] w-[48px] -translate-x-1/2 rounded-full bg-black" />
      <div className="flex w-8 items-center justify-end gap-0.5">
        <svg viewBox="0 0 16 10" className="h-[7px] w-[12px]" aria-hidden>
          <rect x="0" y="6" width="2.5" height="4" rx="0.5" fill="currentColor" />
          <rect x="3.5" y="4" width="2.5" height="6" rx="0.5" fill="currentColor" />
          <rect x="7" y="2" width="2.5" height="8" rx="0.5" fill="currentColor" />
          <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill="currentColor" />
        </svg>
        <svg viewBox="0 0 22 10" className="h-[7px] w-[16px]" aria-hidden>
          <rect
            x="0.5"
            y="0.5"
            width="18"
            height="9"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.35"
          />
          <rect x="2" y="2" width="13" height="6" rx="1" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

function ViewfinderCorner({ className }: { className: string }) {
  return (
    <span
      className={cn("absolute h-3.5 w-3.5 border-[#4a86ff]", className)}
      style={{ animation: "qr-viewfinder-pulse 2.2s ease-in-out infinite" }}
      aria-hidden
    />
  );
}

function ScanScreen() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white">
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-2">
        <div className="relative aspect-square w-[62%] max-w-[108px]">
          <ViewfinderCorner className="left-0 top-0 border-l-[2.5px] border-t-[2.5px] rounded-tl-[3px]" />
          <ViewfinderCorner className="right-0 top-0 border-r-[2.5px] border-t-[2.5px] rounded-tr-[3px]" />
          <ViewfinderCorner className="bottom-0 left-0 border-b-[2.5px] border-l-[2.5px] rounded-bl-[3px]" />
          <ViewfinderCorner className="bottom-0 right-0 border-b-[2.5px] border-r-[2.5px] rounded-br-[3px]" />

          <div className="absolute inset-[7px] flex items-center justify-center overflow-hidden rounded-[3px] bg-slate-50 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]">
            <QrCode className="h-10 w-10 text-slate-900" strokeWidth={1.75} aria-hidden />
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <span
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#4a86ff] to-transparent shadow-[0_0_6px_rgba(74,134,255,0.7)]"
                style={{ animation: "qr-camera-scan 2.2s ease-in-out infinite" }}
                aria-hidden
              />
            </div>
          </div>
        </div>

        <p className="m-0 mt-2.5 text-center text-[7px] font-bold tracking-wide text-slate-700">
          Appareil photo
        </p>
        <p
          className="m-0 mt-0.5 text-center text-[7px] font-semibold text-[#2f6fed]"
          style={{ animation: "qr-viewfinder-pulse 2.2s ease-in-out infinite" }}
        >
          Cadrez le QR code
        </p>
      </div>
    </div>
  );
}

function PreviewField({
  label,
  placeholder,
  filled,
}: {
  label: string;
  placeholder: string;
  filled?: boolean;
}) {
  return (
    <div>
      <p className="m-0 text-[8px] font-black text-slate-600">{label}</p>
      <div
        className={cn(
          "mt-0.5 rounded-md border px-1.5 py-1 text-[7px] font-semibold transition-colors duration-500",
          filled
            ? "border-[#2f6fed]/30 bg-[#eef4ff] text-slate-800"
            : "border-slate-200 bg-white text-slate-400",
        )}
      >
        {filled ? placeholder.replace("Ex : ", "") : placeholder}
      </div>
    </div>
  );
}

function SignupScreen({
  wheelActive,
  welcomeActive,
}: {
  wheelActive: boolean;
  welcomeActive: boolean;
}) {
  const ctaLabel = wheelActive
    ? "S'inscrire et jouer"
    : welcomeActive
      ? "S'inscrire"
      : "Envoyer";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
      <p className="m-0 text-[9px] font-extrabold leading-tight text-slate-900">
        Reste en contact
      </p>
      <p className="m-0 mt-0.5 line-clamp-2 text-[7px] font-semibold leading-snug text-slate-600">
        Laissez vos coordonnées pour recevoir les actus par SMS.
      </p>
      <div className="mt-1.5 space-y-1">
        <PreviewField label="Prénom *" placeholder="Ex : Marie" filled />
        <PreviewField label="Téléphone *" placeholder="06 12 34 56 78" filled />
        <div className="rounded-md border border-slate-200 bg-slate-50 px-1 py-0.5">
          <div className="flex items-start gap-1">
            <span className="mt-0.5 grid h-2 w-2 shrink-0 place-items-center rounded border border-[#2f6fed] bg-[#2f6fed] text-[5px] font-bold text-white">
              ✓
            </span>
            <p className="m-0 text-[6px] font-semibold leading-snug text-slate-700">
              J&apos;accepte de recevoir des SMS.
            </p>
          </div>
        </div>
        <div className="flex h-6 items-center justify-center rounded-md bg-gradient-to-br from-[#4a86ff] to-[#2f6fed] text-[7px] font-bold text-white shadow-sm">
          {ctaLabel}
        </div>
      </div>
    </div>
  );
}

function ThanksScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-center">
      <span className="mb-1 text-xl" aria-hidden>
        🎉
      </span>
      <p className="m-0 text-[9px] font-extrabold text-emerald-900">Merci !</p>
      <p className="m-0 mt-0.5 text-[7px] font-semibold text-emerald-800/90">
        Inscription enregistrée
      </p>
    </div>
  );
}

function WelcomeSmsScreen({
  message,
  sender,
}: {
  message: string;
  sender: string;
}) {
  const displayMessage =
    previewSmsMessage(message.trim() || DEFAULT_QR_WELCOME_SMS_TEMPLATE) ||
    "Bonjour Marie, merci pour votre inscription !";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f2f2f7]">
      <div className="flex min-h-0 flex-1 flex-col justify-end px-2 pb-2 pt-1">
        <p className="m-0 mb-1 text-center text-[7px] font-medium text-slate-400">
          À l&apos;instant
        </p>
        <div className="flex justify-start">
          <div
            className="max-w-[92%] rounded-[12px] rounded-bl-[4px] bg-[#e9e9eb] px-2 py-1.5 shadow-[0_1px_1px_rgba(0,0,0,0.04)]"
            style={{ animation: "qr-welcome-sms-in 0.8s ease-out both" }}
          >
            <p className="m-0 text-[7px] font-bold text-slate-500">{sender}</p>
            <p className="m-0 mt-0.5 whitespace-pre-wrap text-[8px] leading-snug text-slate-900">
              {displayMessage}
            </p>
          </div>
        </div>
        <p
          className="m-0 mt-1.5 text-center text-[7px] font-bold text-emerald-600"
          style={{ animation: "qr-viewfinder-pulse 2.2s ease-in-out infinite" }}
        >
          SMS de bienvenue envoyé
        </p>
      </div>
    </div>
  );
}

function WheelScreen({
  wheelActive,
  gradient,
  title,
}: {
  wheelActive: boolean;
  gradient: string;
  title: string;
}) {
  if (!wheelActive) {
    return <ThanksScreen />;
  }

  return (
    <div className="flex h-full flex-col items-center justify-center overflow-hidden px-1.5 py-1">
      <p className="m-0 line-clamp-1 text-center text-[8px] font-extrabold text-slate-900">
        {title}
      </p>
      <div className="relative mt-1">
        <div
          className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-0.5"
          aria-hidden
        >
          <div className="h-0 w-0 border-x-[4px] border-b-[6px] border-x-transparent border-b-[#2f6fed]" />
        </div>
        <div
          className="h-14 w-14 animate-[spin_6s_linear_infinite] rounded-full border-2 border-white shadow-md"
          style={{ background: gradient }}
        />
      </div>
      <p className="m-0 mt-1 text-center text-[7px] font-bold text-[#2f6fed]">
        Tournez la roue !
      </p>
    </div>
  );
}

function FlowStepsList({
  steps,
  activeIndex,
  fill,
}: {
  steps: FlowStep[];
  activeIndex: number;
  fill?: boolean;
}) {
  return (
    <ol className="m-0 flex list-none flex-col justify-center gap-0 p-0">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;
        const isLast = index === steps.length - 1;

        return (
          <li key={step.id} className="flex gap-2">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid shrink-0 place-items-center rounded-full border transition-all duration-700 ease-out",
                  fill ? "h-7 w-7" : "h-6 w-6",
                  isActive &&
                    "scale-105 border-[#2f6fed] bg-[#eef4ff] text-[#2f6fed] shadow-[0_0_0_4px_rgba(47,111,237,0.10)]",
                  isDone && "border-emerald-200 bg-emerald-50 text-emerald-600",
                  !isActive &&
                    !isDone &&
                    "border-slate-200 bg-white text-slate-400",
                )}
              >
                {isDone ? (
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                ) : (
                  <Icon className="h-3 w-3" aria-hidden />
                )}
              </span>
              {!isLast ? (
                <span
                  className={cn(
                    "my-0.5 w-0.5 min-h-[22px] flex-1 rounded-full transition-all duration-700 ease-out",
                    fill && "min-h-[28px]",
                    isDone ? "bg-emerald-300" : "bg-slate-200",
                    isActive && "bg-gradient-to-b from-emerald-300 to-slate-200",
                  )}
                  aria-hidden
                />
              ) : null}
            </div>
            <p
              className={cn(
                "mb-0 min-w-0 pb-4 font-semibold leading-snug transition-all duration-700 ease-out",
                fill ? "text-[11px]" : "text-[10px]",
                isActive && "translate-x-0 font-black text-[#1f3b77]",
                isDone && "text-emerald-700",
                !isActive && !isDone && "text-slate-400",
              )}
            >
              {step.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function StepProgressBar({
  activeIndex,
  stepCount,
}: {
  activeIndex: number;
  stepCount: number;
}) {
  const progress = ((activeIndex + 1) / stepCount) * 100;

  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200/80">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#4a86ff] to-[#2f6fed] transition-[width] duration-700 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

type QrCapturePhonePreviewProps = {
  publicUrl?: string;
  captureMode: QrCaptureMode;
  wheelConfig: QrWheelConfig | null;
  welcomeSmsTemplate?: string;
  senderName?: string;
  initialLoading?: boolean;
  compact?: boolean;
  fill?: boolean;
  className?: string;
};

export function QrCapturePhonePreview({
  captureMode,
  wheelConfig,
  welcomeSmsTemplate,
  senderName = "Boutique",
  initialLoading = false,
  compact = false,
  fill = false,
  className,
}: QrCapturePhonePreviewProps) {
  const flowSteps = useMemo(
    () => flowStepsForMode(captureMode),
    [captureMode],
  );
  const [time] = useState(() => formatStatusTime(new Date()));
  const [activeStep, setActiveStep] = useState(0);

  const modeKey = `${captureMode}:${wheelConfig?.enabled ?? false}`;
  const [prevModeKey, setPrevModeKey] = useState(modeKey);
  if (prevModeKey !== modeKey) {
    setPrevModeKey(modeKey);
    setActiveStep(0);
  }

  useEffect(() => {
    if (initialLoading) return;
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % flowSteps.length);
    }, STEP_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [initialLoading, flowSteps.length]);

  const wheelActive =
    captureMode === "wheel" &&
    Boolean(wheelConfig?.enabled && (wheelConfig.segments.length ?? 0) > 0);
  const welcomeActive = captureMode === "welcome";

  const wheelGradient = useMemo(() => {
    const segments = wheelConfig?.segments ?? [];
    if (segments.length === 0) {
      return "conic-gradient(from -90deg, #4a86ff 0deg 120deg, #2f6fed 120deg 240deg, #7dd3fc 240deg 360deg)";
    }
    const angle = 360 / segments.length;
    const parts = segments.map((s, i) => {
      const start = i * angle;
      const end = (i + 1) * angle;
      return `${s.color} ${start}deg ${end}deg`;
    });
    return `conic-gradient(from -90deg, ${parts.join(", ")})`;
  }, [wheelConfig?.segments]);

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        fill ? "min-h-0 flex-1" : "min-h-0",
        className,
      )}
    >
      <div className={cn("shrink-0", fill ? "mb-2" : compact ? "mb-1.5" : "mb-2")}>
        <div className="flex items-center justify-between gap-2">
          <h3
            className={cn(
              "m-0 font-black text-slate-900",
              compact || fill ? "text-[11px]" : "text-sm",
            )}
          >
            Aperçu parcours client
          </h3>
          {fill ? (
            <span className="text-[9px] font-semibold tabular-nums text-slate-400">
              {activeStep + 1}/{flowSteps.length}
            </span>
          ) : null}
        </div>
        {fill ? (
          <div className="mt-1.5">
            <StepProgressBar activeIndex={activeStep} stepCount={flowSteps.length} />
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden",
          fill
            ? "flex-1 rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-[#eef4ff]/40 px-2 py-3"
            : "gap-2.5",
        )}
      >
        {fill ? (
          <>
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#2f6fed]/8 blur-3xl"
              style={{ animation: "qr-preview-glow 5s ease-in-out infinite" }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-emerald-400/8 blur-3xl"
              style={{ animation: "qr-preview-glow 5s ease-in-out 1.5s infinite" }}
              aria-hidden
            />
          </>
        ) : null}

        <div
          className={cn(
            "relative z-[1] flex min-h-0 w-full items-center justify-center",
            fill ? "h-full gap-3" : "items-start gap-2.5",
          )}
        >
          <FlowStepsList steps={flowSteps} activeIndex={activeStep} fill={fill} />

          <div
            className={cn(
              "flex min-h-0 items-center justify-center",
              fill ? "min-w-0 flex-1" : "shrink-0",
            )}
          >
            <CroppedPhoneFrame width={fill ? FILL_PHONE_WIDTH : COMPACT_PHONE_WIDTH}>
              <IphoneStatusBar time={time || "—"} />

              <div className="relative min-h-0 flex-1 overflow-hidden bg-[#f5f7fb]">
                {initialLoading ? (
                  <div className="space-y-2 px-2 py-3">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
                    <div className="h-2 w-full animate-pulse rounded bg-slate-100" />
                    <div className="mt-2 h-6 animate-pulse rounded-md bg-slate-200" />
                  </div>
                ) : (
                  flowSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className={cn(
                        "absolute inset-0 overflow-hidden transition-opacity duration-500 ease-out",
                        step.id !== "scan" && step.id !== "welcome" && "px-2 py-1.5",
                        step.id === "welcome" && "px-1 py-1",
                        index === activeStep
                          ? "z-10 opacity-100"
                          : "z-0 opacity-0",
                      )}
                    >
                      {step.id === "scan" ? <ScanScreen /> : null}
                      {step.id === "signup" ? (
                        <SignupScreen
                          wheelActive={wheelActive}
                          welcomeActive={welcomeActive}
                        />
                      ) : null}
                      {step.id === "welcome" ? (
                        <WelcomeSmsScreen
                          message={welcomeSmsTemplate ?? DEFAULT_QR_WELCOME_SMS_TEMPLATE}
                          sender={senderName}
                        />
                      ) : null}
                      {step.id === "thanks" ? <ThanksScreen /> : null}
                      {step.id === "wheel" ? (
                        <WheelScreen
                          wheelActive={wheelActive}
                          gradient={wheelGradient}
                          title={wheelConfig?.title ?? "Tournez la roue !"}
                        />
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </CroppedPhoneFrame>
          </div>
        </div>
      </div>
    </div>
  );
}
