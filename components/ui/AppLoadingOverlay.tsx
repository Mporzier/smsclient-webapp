"use client";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";

type AppLoadingOverlayProps = {
  className?: string;
};

/** Overlay semi-transparent bloquant les interactions pendant le chargement initial. */
export function AppLoadingOverlay({ className }: AppLoadingOverlayProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-background",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Chargement"
    >
      <Spinner className="size-8" />
    </div>
  );
}
