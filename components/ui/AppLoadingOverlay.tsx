"use client";

import { cn } from "@/lib/cn";

type AppLoadingOverlayProps = {
  className?: string;
};

/** Overlay semi-transparent bloquant les interactions pendant le chargement initial. */
export function AppLoadingOverlay({ className }: AppLoadingOverlayProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/25 backdrop-blur-[2px]",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Chargement"
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/50 border-t-ring shadow-[0_4px_20px_rgba(15,23,42,0.15)]"
        aria-hidden
      />
    </div>
  );
}
