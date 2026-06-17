"use client";

import { cn } from "@/lib/cn";
import {
  containsPrenomTag,
  expandPrenomTag,
} from "@/lib/proto/smsPersonalization";
import { analyzeSmsMessage, formatInt } from "@/lib/proto/smsUtils";
import { useMemo } from "react";

export function SmsCompositionCounter({
  message,
  estimateFirstName,
}: {
  message: string;
  estimateFirstName?: string;
}) {
  const stats = useMemo(() => {
    const text =
      containsPrenomTag(message) && estimateFirstName
        ? expandPrenomTag(message, estimateFirstName)
        : message;
    return analyzeSmsMessage(text);
  }, [message, estimateFirstName]);
  const overPlatform =
    stats.exceedsMaxSegments ||
    stats.characterCount > stats.maxBillableCharacters;
  const remaining = overPlatform ? 0 : stats.remainingInTier;
  const smsLabel =
    stats.smsCount === 1 ? "1 message" : `${formatInt(stats.smsCount)} messages`;

  return (
    <p
      className={cn(
        "m-0 shrink-0 text-right text-[11px] font-semibold tabular-nums text-slate-500",
        overPlatform && "text-rose-700",
        stats.remainingInTier <= 10 &&
          stats.remainingInTier > 0 &&
          !overPlatform &&
          "text-amber-700",
      )}
    >
      {smsLabel}
      {overPlatform ? (
        <span className="font-extrabold"> · limite atteinte</span>
      ) : (
        <>
          , {formatInt(remaining)} car. restant{remaining === 1 ? "" : "s"}
        </>
      )}
    </p>
  );
}
