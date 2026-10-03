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
  className?: string;
  size?: "default" | "compact";
  disabled?: boolean;
  /** Toast après copie réussie */
  copiedToast?: string;
  /** Toast si la copie échoue */
  copyFailedToast?: string;
  onCopied?: () => void;
  "aria-labelledby"?: string;
};

export function CopyableLinkField({
  value,
  className,
  size = "default",
  disabled,
  copiedToast,
  copyFailedToast,
  onCopied,
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
        "flex w-full cursor-pointer items-center gap-2 overflow-hidden rounded-lg border border-blue-100/90 bg-blue-50/40 text-left transition-colors hover:bg-blue-100/45 disabled:cursor-not-allowed disabled:opacity-50",
        size === "default" ? "px-3 py-3" : "min-h-[2.75rem] px-3 py-2",
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
            : "truncate text-[11px] font-semibold leading-snug",
        )}
      >
        {value || "—"}
      </span>
      <Copy
        className={cn(
          "shrink-0 text-blue-600",
          size === "default" ? "h-4 w-4" : "h-3.5 w-3.5",
        )}
        strokeWidth={2.25}
        aria-hidden
      />
    </button>
  );
}
