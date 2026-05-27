"use client";

import { cn } from "@/lib/cn";
import type { QrWheelPublicSegment } from "@/lib/types/qrWheel";
import { useEffect, useMemo, useState } from "react";

type RewardWheelProps = {
  segments: QrWheelPublicSegment[];
  title: string;
  subtitle: string;
  spinning: boolean;
  /** Index du segment gagnant (après tirage serveur). */
  winIndex: number | null;
  onSpin: () => void;
  onAnimationEnd?: () => void;
};

export function RewardWheel({
  segments,
  title,
  subtitle,
  spinning,
  winIndex,
  onSpin,
  onAnimationEnd,
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

  useEffect(() => {
    if (!spinning || winIndex == null || n === 0) return;
    const extraTurns = 5;
    const land =
      360 * extraTurns +
      (360 - winIndex * segmentAngle - segmentAngle / 2);
    setAnimating(true);
    setRotation(land);
    const t = window.setTimeout(() => {
      setAnimating(false);
      onAnimationEnd?.();
    }, 4200);
    return () => window.clearTimeout(t);
  }, [spinning, winIndex, n, segmentAngle, onAnimationEnd]);

  if (n === 0) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <h2 className="m-0 text-2xl font-extrabold text-slate-900">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm font-semibold text-slate-600">{subtitle}</p>
        )}
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

      {!spinning && winIndex == null && (
        <button
          type="button"
          onClick={onSpin}
          className="inline-flex h-12 w-full max-w-xs cursor-pointer items-center justify-center rounded-[14px] border border-transparent bg-gradient-to-br from-[#4a86ff] to-[#2f6fed] px-6 text-base font-bold text-white shadow-[0_18px_30px_rgba(47,111,237,0.22)]"
        >
          Tourner la roue
        </button>
      )}
      {spinning && winIndex == null && (
        <p className="text-sm font-bold text-slate-500">Préparation du tirage…</p>
      )}
      {animating && (
        <p className="text-sm font-bold text-[#2f6fed]">La roue tourne…</p>
      )}
    </div>
  );
}
