"use client";

import { RewardWheel } from "@/components/public/RewardWheel";
import type { QrWheelConfig, QrWheelPublicSegment } from "@/lib/types/qrWheel";
import { useCallback, useMemo, useState } from "react";

type QrWheelPreviewProps = {
  wheelConfig: QrWheelConfig | null;
  loading?: boolean;
  /** Remet la prévisualisation à zéro quand la modale se ferme. */
  open?: boolean;
};

function toPublicSegments(
  config: QrWheelConfig | null,
): QrWheelPublicSegment[] {
  return (config?.segments ?? []).map((segment) => ({
    id: segment.id,
    label: segment.label,
    color: segment.color,
    is_losing: segment.isLosing,
  }));
}

export function QrWheelPreview({
  wheelConfig,
  loading,
  open = true,
}: QrWheelPreviewProps) {
  const [spinning, setSpinning] = useState(false);
  const [winIndex, setWinIndex] = useState<number | null>(null);

  const segments = useMemo(() => toPublicSegments(wheelConfig), [wheelConfig]);

  const resetPreview = useCallback(() => {
    setSpinning(false);
    setWinIndex(null);
  }, []);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) resetPreview();
  }

  const handleSpin = useCallback(() => {
    if (segments.length === 0 || spinning || winIndex != null) return;
    setSpinning(true);
    setWinIndex(null);
    window.setTimeout(() => {
      setWinIndex(Math.floor(Math.random() * segments.length));
    }, 400);
  }, [segments.length, spinning, winIndex]);

  const handleAnimationEnd = useCallback(() => {
    setSpinning(false);
  }, []);

  const handleReplay = useCallback(() => {
    resetPreview();
  }, [resetPreview]);

  if (loading) {
    return (
      <div className="grid min-h-[420px] place-items-center text-sm font-bold text-slate-500">
        Chargement de la roue…
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm font-bold text-amber-900">
          Ajoutez au moins une récompense pour prévisualiser la roue.
        </div>
      </div>
    );
  }

  return (
    <RewardWheel
      segments={segments}
      title={wheelConfig?.title?.trim() || "Tournez la roue !"}
      subtitle={wheelConfig?.subtitle?.trim() ?? ""}
      spinning={spinning}
      winIndex={winIndex}
      onSpin={handleSpin}
      onAnimationEnd={handleAnimationEnd}
      onReplay={handleReplay}
      spinButtonLabel="Tourner la roue !"
      replayButtonLabel="Rejouer"
    />
  );
}
