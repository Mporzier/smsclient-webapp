"use client";

import { cn } from "@/lib/cn";
import type { QrWheelPublicSegment } from "@/lib/types/qrWheel";
import { useEffect, useMemo, useRef, useState } from "react";

type RewardWheelProps = {
  segments: QrWheelPublicSegment[];
  title: string;
  subtitle: string;
  spinning: boolean;
  /** Index du segment gagnant (après tirage serveur). */
  winIndex: number | null;
  onSpin: () => void;
  onAnimationEnd?: () => void;
  spinButtonLabel?: string;
  /** Affiche le résultat + bouton rejouer (prévisualisation commerçant). */
  onReplay?: () => void;
  replayButtonLabel?: string;
};

const ACTION_BTN =
  "inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-[14px] border border-transparent px-6 text-base font-bold shadow-[0_18px_30px_rgba(47,111,237,0.22)]";

export function RewardWheel({
  segments,
  title,
  subtitle,
  spinning,
  winIndex,
  onSpin,
  onAnimationEnd,
  spinButtonLabel = "Tourner la roue",
  onReplay,
  replayButtonLabel = "Rejouer",
}: RewardWheelProps) {
  const n = segments.length;
  const segmentAngle = n > 0 ? 360 / n : 0;

  const gradient = useMemo(() => {
    if (n === 0) return "conic-gradient(#e2e8f0 0deg 360deg)";
    const parts = segments.map((s, i) => {
      const start = i * segmentAngle;
      const end = (i + 1) * segmentAngle;
      return `${s.color} ${start}deg ${end}deg`;
    });
    return `conic-gradient(from -90deg, ${parts.join(", ")})`;
  }, [segments, segmentAngle, n]);

  const [rotation, setRotation] = useState(0);
  const [animating, setAnimating] = useState(false);
  const spinStartedRef = useRef(false);

  const preparing = spinning && winIndex == null;
  const showResult =
    Boolean(onReplay) &&
    !spinning &&
    !animating &&
    winIndex != null &&
    winIndex >= 0 &&
    winIndex < n;
  const showIdle = !spinning && winIndex == null && !animating;
  const showSpinning = animating;

  if (winIndex == null && !spinning && (animating || rotation !== 0)) {
    setAnimating(false);
    setRotation(0);
  }

  useEffect(() => {
    if (winIndex == null && !spinning) {
      spinStartedRef.current = false;
    }
  }, [winIndex, spinning]);

  useEffect(() => {
    if (!spinning || winIndex == null || n === 0 || spinStartedRef.current) {
      return;
    }
    spinStartedRef.current = true;
    const extraTurns = 5;
    const land =
      360 * extraTurns + (360 - winIndex * segmentAngle - segmentAngle / 2);
    setAnimating(true);
    setRotation(land);
    const t = window.setTimeout(() => {
      setAnimating(false);
      onAnimationEnd?.();
    }, 4200);
    return () => window.clearTimeout(t);
  }, [spinning, winIndex, n, segmentAngle, onAnimationEnd]);

  const resultSegment = showResult ? segments[winIndex!] : null;

  if (n === 0) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <h2 className="m-0 text-2xl font-extrabold text-slate-900">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm font-semibold text-slate-600">{subtitle}</p>
        ) : null}
      </div>

      <div className="relative">
        <div
          className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1"
          aria-hidden
        >
          <div className="h-0 w-0 border-x-[12px] border-b-[20px] border-x-transparent border-b-[#2f6fed]" />
        </div>
        <div
          className={cn(
            "relative h-[min(72vw,280px)] w-[min(72vw,280px)] rounded-full border-4 border-white shadow-[0_16px_40px_rgba(15,23,42,0.15)]",
            animating && "transition-transform duration-[4000ms] ease-out",
          )}
          style={{
            transform: `rotate(${rotation}deg)`,
            background: gradient,
          }}
        >
          {segments.map((s, i) => {
            const angle = i * segmentAngle + segmentAngle / 2 - 90;
            const rad = (angle * Math.PI) / 180;
            const r = 38;
            const x = 50 + r * Math.cos(rad);
            const y = 50 + r * Math.sin(rad);
            return (
              <span
                key={s.id}
                className="absolute max-w-[28%] -translate-x-1/2 -translate-y-1/2 text-center text-[9px] font-extrabold leading-tight text-white drop-shadow-sm"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                {s.label}
              </span>
            );
          })}
        </div>
        <div className="absolute left-1/2 top-1/2 z-20 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-[#4a86ff] to-[#2f6fed] text-xs font-black text-white shadow-lg">
          GO
        </div>
      </div>

      <div className="flex h-[120px] w-full max-w-xs flex-col items-center justify-center gap-2">
        {showIdle ? (
          <button
            type="button"
            onClick={onSpin}
            className={cn(
              ACTION_BTN,
              "bg-gradient-to-br from-[#4a86ff] to-[#2f6fed] text-white",
            )}
          >
            {spinButtonLabel}
          </button>
        ) : null}

        {preparing ? (
          <div
            className={cn(
              ACTION_BTN,
              "cursor-default bg-slate-100 text-sm font-bold text-slate-500 shadow-none",
            )}
            aria-live="polite"
          >
            Préparation du tirage…
          </div>
        ) : null}

        {showSpinning ? (
          <div
            className={cn(
              ACTION_BTN,
              "cursor-default bg-[#eef4ff] text-sm font-bold text-[#2f6fed] shadow-none",
            )}
            aria-live="polite"
          >
            La roue tourne…
          </div>
        ) : null}

        {showResult && resultSegment ? (
          <>
            <div
              className={cn(
                "w-full rounded-xl border px-3 py-2 text-center",
                resultSegment.is_losing
                  ? "border-slate-200 bg-slate-50"
                  : "border-emerald-200 bg-emerald-50",
              )}
            >
              <p className="m-0 text-xs font-black text-slate-900">
                {resultSegment.is_losing ? "Dommage…" : "Félicitations !"}
              </p>
              <p className="m-0 mt-0.5 truncate text-sm font-extrabold text-slate-800">
                {resultSegment.label}
              </p>
            </div>
            <button
              type="button"
              onClick={onReplay}
              className={cn(
                ACTION_BTN,
                "h-10 bg-white text-sm text-[#2f6fed] shadow-[0_8px_18px_rgba(47,111,237,0.12)] ring-1 ring-[#2f6fed]/25",
              )}
            >
              {replayButtonLabel}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
