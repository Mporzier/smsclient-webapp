"use client";

import { cn } from "@/lib/cn";
import { toast } from "@/components/ui/sonner";
import { Copy } from "lucide-react";
import { useCallback } from "react";

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

type CopyableLinkFieldProps = {
  value: string;
  /** Texte affiché (copie = `value`). */
  displayValue?: string;
  className?: string;
  size?: "default" | "compact" | "dense";
  disabled?: boolean;
  /** Toast après copie réussie */
  copiedToast?: string;
  /** Toast si la copie échoue */
  copyFailedToast?: string;
  onCopied?: () => void;
  /** Liste Liens : texte visible en entier (retour ligne si besoin). */
  wrapDisplay?: boolean;
  "aria-labelledby"?: string;
};

export function CopyableLinkField({
  value,
  displayValue,
  className,
  size = "default",
  disabled,
  copiedToast,
  copyFailedToast,
  onCopied,
  wrapDisplay,
  "aria-labelledby": ariaLabelledBy,
}: CopyableLinkFieldProps) {
  const handleCopy = useCallback(() => {
    void copyTextToClipboard(value).then((ok) => {
      if (!ok) {
        if (copyFailedToast) toast.error(copyFailedToast);
        return;
      }
      if (copiedToast) toast(copiedToast);
      onCopied?.();
    });
  }, [value, copiedToast, copyFailedToast, onCopied]);

  const isDisabled = disabled ?? !value;

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        "cursor-pointer overflow-hidden border border-blue-100/90 bg-blue-50/40 text-left transition-colors hover:bg-blue-100/45 disabled:cursor-not-allowed disabled:opacity-50",
        size === "dense"
          ? "inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-1"
          : "flex w-full items-center gap-2 rounded-lg",
        size === "default" && "px-3 py-3",
        size === "compact" && "min-h-[2.75rem] px-3 py-2",
        className,
      )}
      onClick={(e) => {
        e.stopPropagation();
        handleCopy();
      }}
    >
      <span
        className={cn(
          "min-w-0 flex-1 text-foreground",
          size === "default"
            ? "text-sm font-medium leading-snug break-all"
            : size === "dense"
              ? wrapDisplay
                ? "break-all text-xs font-semibold leading-snug"
                : "truncate text-xs font-semibold leading-snug"
              : "truncate text-[11px] font-semibold leading-snug",
        )}
      >
        {displayValue ?? (value || "—")}
      </span>
      <Copy
        className={cn(
          "shrink-0 text-blue-600",
          size === "default"
            ? "h-4 w-4"
            : size === "dense"
              ? "size-3.5"
              : "h-3.5 w-3.5",
        )}
        strokeWidth={2.25}
        aria-hidden
      />
    </button>
  );
}
