"use client";

import { cn } from "@/lib/cn";
import type { QrCaptureMode } from "@/lib/supabase/qrCodes";
import type { QrWheelConfig } from "@/lib/types/qrWheel";
import { Check, Gift, QrCode, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const IPHONE_SCREEN_ASPECT = 390 / 844;
const STEP_DURATION_MS = 3600;

type FlowStepId = "scan" | "signup" | "wheel";

const FLOW_STEPS: {
  id: FlowStepId;
  label: string;
  icon: typeof QrCode;
}[] = [
  { id: "scan", label: "Scan du QR code", icon: QrCode },
  { id: "signup", label: "Inscription rapide", icon: UserRound },
  { id: "wheel", label: "Roue des récompenses", icon: Gift },
];

function formatStatusTime(date: Date) {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function IphoneStatusBar({ time }: { time: string }) {
  return (
    <div className="relative flex h-[18px] shrink-0 items-center justify-between px-3 pt-0.5 text-[9px] font-semibold leading-none text-slate-900">
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

function BrowserUrlBar({ url, visible }: { url: string; visible: boolean }) {
  return (
    <div
      className={cn(
        "shrink-0 border-b border-slate-200/80 bg-[#f8fafc] px-2 pb-2 pt-1 transition-all duration-500 ease-out",
        visible ? "max-h-12 opacity-100" : "max-h-0 overflow-hidden opacity-0",
      )}
    >
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-[8px] font-semibold text-slate-600">
          {url}
        </span>
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
          "mt-0.5 rounded-md border px-2 py-1.5 text-[8px] font-semibold transition-colors duration-500",
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

function ScanScreen() {
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-slate-900 px-3 py-4">
      <div className="relative mb-3 grid h-16 w-16 place-items-center rounded-lg border-2 border-white/80 bg-white p-1">
        <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "rounded-[1px]",
                [0, 2, 6, 8].includes(i) ? "bg-slate-900" : "bg-slate-300",
              )}
            />
          ))}
        </div>
        <span
          className="pointer-events-none absolute inset-x-1 h-0.5 rounded-full bg-gradient-to-r from-transparent via-[#4a86ff] to-transparent"
          style={{ animation: "qr-scan-line 2.4s ease-in-out infinite" }}
          aria-hidden
        />
        <span className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-[#4a86ff]/40 ring-offset-2 ring-offset-slate-900" />
      </div>
      <p className="m-0 text-center text-[9px] font-bold text-white">
        Scannez le QR code
      </p>
      <p className="m-0 mt-1 text-center text-[7px] font-semibold text-slate-400">
        Appareil photo · inscription
      </p>
    </div>
  );
}

function SignupScreen({ wheelActive }: { wheelActive: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      <p className="m-0 text-[11px] font-extrabold leading-tight text-slate-900">
        Reste en contact
      </p>
      <p className="m-0 mt-1 text-[7px] font-semibold leading-snug text-slate-600">
        Laisse tes coordonnées pour recevoir les actus par SMS.
      </p>
      <div className="mt-2 space-y-1.5">
        <PreviewField label="Prénom *" placeholder="Ex : Marie" filled />
        <PreviewField label="Téléphone *" placeholder="06 12 34 56 78" filled />
        <div className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1">
          <div className="flex items-start gap-1">
            <span className="mt-0.5 grid h-2.5 w-2.5 shrink-0 place-items-center rounded border border-[#2f6fed] bg-[#2f6fed] text-[6px] font-bold text-white">
              ✓
            </span>
            <p className="m-0 text-[7px] font-semibold leading-snug text-slate-700">
              J&apos;accepte de recevoir des SMS.
            </p>
          </div>
        </div>
        <div className="flex h-7 items-center justify-center rounded-md bg-gradient-to-br from-[#4a86ff] to-[#2f6fed] text-[8px] font-bold text-white shadow-sm">
          {wheelActive ? "S'inscrire et jouer" : "Envoyer"}
        </div>
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
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-4 text-center">
        <span className="mb-2 text-2xl" aria-hidden>
          🎉
        </span>
        <p className="m-0 text-[10px] font-extrabold text-emerald-900">Merci !</p>
        <p className="m-0 mt-1 text-[7px] font-semibold text-emerald-800/90">
          Inscription enregistrée
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-2 py-3">
      <p className="m-0 text-center text-[9px] font-extrabold text-slate-900">
        {title}
      </p>
      <div className="relative mt-2">
        <div
          className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-0.5"
          aria-hidden
        >
          <div className="h-0 w-0 border-x-[5px] border-b-[8px] border-x-transparent border-b-[#2f6fed]" />
        </div>
        <div
          className="h-[72px] w-[72px] animate-[spin_6s_linear_infinite] rounded-full border-2 border-white shadow-md"
          style={{ background: gradient }}
        />
      </div>
      <p className="m-0 mt-2 text-center text-[7px] font-bold text-[#2f6fed]">
        Tournez la roue !
      </p>
    </div>
  );
}

function FlowStepsList({
  activeIndex,
  fill,
}: {
  activeIndex: number;
  fill?: boolean;
}) {
  return (
    <ol className="m-0 flex list-none flex-col justify-center gap-0 p-0">
      {FLOW_STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;
        const isLast = index === FLOW_STEPS.length - 1;

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

function StepProgressBar({ activeIndex }: { activeIndex: number }) {
  const progress = ((activeIndex + 1) / FLOW_STEPS.length) * 100;

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
  initialLoading?: boolean;
  compact?: boolean;
  fill?: boolean;
  className?: string;
};

export function QrCapturePhonePreview({
  publicUrl,
  captureMode,
  wheelConfig,
  initialLoading = false,
  compact = false,
  fill = false,
  className,
}: QrCapturePhonePreviewProps) {
  const [time, setTime] = useState("");
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setTime(formatStatusTime(new Date()));
  }, []);

  useEffect(() => {
    if (initialLoading) return;
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % FLOW_STEPS.length);
    }, STEP_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [initialLoading]);

  useEffect(() => {
    setActiveStep(0);
  }, [captureMode, wheelConfig?.enabled]);

  const wheelActive =
    captureMode === "wheel" &&
    Boolean(wheelConfig?.enabled && (wheelConfig.segments.length ?? 0) > 0);

  const displayUrl = useMemo(() => {
    if (!publicUrl) return "smsclient.fr/inscription/…";
    try {
      return publicUrl.replace(/^https?:\/\//, "");
    } catch {
      return publicUrl;
    }
  }, [publicUrl]);

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

  const activeStepId = FLOW_STEPS[activeStep]?.id ?? "scan";
  const showBrowserChrome = activeStepId !== "scan";

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
              {activeStep + 1}/{FLOW_STEPS.length}
            </span>
          ) : null}
        </div>
        {fill ? (
          <div className="mt-1.5">
            <StepProgressBar activeIndex={activeStep} />
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
          <FlowStepsList activeIndex={activeStep} fill={fill} />

          <div
            className={cn(
              "flex min-h-0 items-center justify-center",
              fill ? "h-full min-w-0 flex-1" : "shrink-0",
            )}
          >
            <div
              className={cn(
                "select-none bg-slate-900 transition-transform duration-700 ease-out",
                fill
                  ? "h-full max-h-full w-auto max-w-full rounded-[28px] p-1 shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
                  : cn(
                      "shrink-0",
                      compact
                        ? "rounded-[24px] p-1 shadow-[0_8px_18px_rgba(15,23,42,0.10)]"
                        : "rounded-[32px] p-1.5 shadow-[0_14px_28px_rgba(15,23,42,0.12)]",
                    ),
                "[&_*]:pointer-events-none [&_*]:select-none",
              )}
              style={
                fill
                  ? { aspectRatio: `${IPHONE_SCREEN_ASPECT}`, height: "100%" }
                  : { width: 160 }
              }
              aria-hidden
            >
              <div
                className={cn(
                  "flex h-full min-h-0 flex-col overflow-hidden bg-white",
                  fill ? "rounded-[22px]" : compact ? "rounded-[20px]" : "rounded-[26px]",
                )}
                style={
                  fill
                    ? undefined
                    : {
                        aspectRatio: `${IPHONE_SCREEN_ASPECT}`,
                        maxHeight: compact ? 240 : undefined,
                      }
                }
              >
                <IphoneStatusBar time={time || "—"} />
                <BrowserUrlBar url={displayUrl} visible={showBrowserChrome} />

                <div className="relative min-h-0 flex-1 overflow-hidden bg-[#f5f7fb]">
                  {initialLoading ? (
                    <div className="space-y-2 px-2.5 py-4">
                      <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
                      <div className="h-2 w-full animate-pulse rounded bg-slate-100" />
                      <div className="mt-3 h-8 animate-pulse rounded-md bg-slate-200" />
                    </div>
                  ) : (
                    FLOW_STEPS.map((step, index) => (
                      <div
                        key={step.id}
                        className={cn(
                          "absolute inset-0 overflow-y-auto px-2.5 py-2.5 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                          index === activeStep
                            ? "z-10 scale-100 opacity-100"
                            : index < activeStep
                              ? "z-0 scale-[1.03] opacity-0"
                              : "z-0 scale-[0.97] opacity-0",
                        )}
                      >
                        {step.id === "scan" ? <ScanScreen /> : null}
                        {step.id === "signup" ? (
                          <SignupScreen wheelActive={wheelActive} />
                        ) : null}
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

                <div className="flex shrink-0 justify-center pb-1 pt-0.5">
                  <div className="h-0.5 w-16 rounded-full bg-slate-900/80" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
