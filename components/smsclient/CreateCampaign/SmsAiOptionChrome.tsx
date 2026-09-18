"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function aiOptionCardClass(active: boolean) {
  return cn(
    "flex h-full min-h-0 flex-col gap-3 rounded-xl border bg-card p-3 text-card-foreground shadow-sm transition-colors",
    active
      ? "border-primary/35 bg-accent/50 ring-1 ring-primary/10"
      : "border-border hover:border-border/80 hover:bg-muted/20",
  );
}

export function SmsAiOptionEmoji({
  emoji,
  tone = "neutral",
}: {
  emoji: string;
  tone?: "neutral" | "active" | "link";
}) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-lg leading-none",
        tone === "active" && "bg-blue-100",
        tone === "link" && "bg-green-100",
        tone === "neutral" && "bg-muted",
      )}
      aria-hidden
    >
      {emoji}
    </span>
  );
}

/** En-tête commun : emoji rond + titre (+ slot droite). */
export function SmsAiOptionHeader({
  emoji,
  emojiTone = "neutral",
  title,
  trailing,
}: {
  emoji: string;
  emojiTone?: "neutral" | "active" | "link";
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <SmsAiOptionEmoji emoji={emoji} tone={emojiTone} />
        <p className="m-0 text-sm font-semibold leading-snug tracking-tight text-foreground">
          {title}
        </p>
      </div>
      {trailing ? (
        <div className="shrink-0 pt-0.5">{trailing}</div>
      ) : null}
    </div>
  );
}

export function SmsAiOptionSwitch({
  enabled,
  className,
}: {
  enabled: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
        enabled ? "bg-primary" : "bg-muted-foreground/25",
        className,
      )}
      aria-hidden
    >
      <span
        className={cn(
          "absolute top-0.5 size-4 rounded-full bg-background shadow-sm transition-transform",
          enabled ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </span>
  );
}
