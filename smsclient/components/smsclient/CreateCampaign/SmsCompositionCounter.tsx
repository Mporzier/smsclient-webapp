"use client";

import { cn } from "@/lib/cn";
import {
  containsPrenomTag,
  expandPrenomTag,
} from "@/lib/proto/smsPersonalization";
import {
  buildEffectiveSms,
  stopSuffixBillableLength,
} from "@/lib/proto/smsStopMention";
import { analyzeSmsMessage, formatInt } from "@/lib/proto/smsUtils";
import { useMemo } from "react";

export function SmsCompositionCounter({
  message,
  reserveStop = false,
  billableMessage,
  estimateFirstName,
}: {
  /** Corps éditable du message (sans STOP auto). */
  message: string;
  /** Réserve STOP 36000 dans le compteur (manuel / modèle). */
  reserveStop?: boolean;
  /** Message facturé complet (ex. variante IA avec STOP déjà inclus). */
  billableMessage?: string;
  estimateFirstName?: string;
}) {
  const stats = useMemo(() => {
    const bodyText =
      containsPrenomTag(message) && estimateFirstName
        ? expandPrenomTag(message, estimateFirstName)
        : message;

    if (reserveStop) {
      const effective = buildEffectiveSms(message, true);
      const effectiveText =
        containsPrenomTag(effective) && estimateFirstName
          ? expandPrenomTag(effective, estimateFirstName)
          : effective;
      const bodyStats = analyzeSmsMessage(bodyText);
      const effectiveStats = analyzeSmsMessage(effectiveText);
      const stopLen = stopSuffixBillableLength(message);

      const remainingInTier =
        effectiveStats.smsCount === 1
          ? Math.max(
              0,
              effectiveStats.singleSegmentLimit - stopLen - bodyStats.characterCount,
            )
          : effectiveStats.remainingInTier;

      return { ...effectiveStats, remainingInTier };
    }

    const source = billableMessage ?? message;
    const text =
      containsPrenomTag(source) && estimateFirstName
        ? expandPrenomTag(source, estimateFirstName)
        : source;
    return analyzeSmsMessage(text);
  }, [message, reserveStop, billableMessage, estimateFirstName]);

  const stopReserved = reserveStop ? stopSuffixBillableLength(message) : 0;

  const overPlatform =
    stats.exceedsMaxSegments ||
    stats.characterCount > stats.maxBillableCharacters;
  const remaining = overPlatform ? 0 : stats.remainingInTier;
  const smsLabel =
    stats.smsCount === 1 ? "1 message" : `${formatInt(stats.smsCount)} messages`;

  return (
    <div className="text-right">
      <p
        className={cn(
          "m-0 shrink-0 text-[11px] font-semibold tabular-nums text-slate-500",
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
      {reserveStop ? (
        <p className="m-0 text-[10px] font-semibold text-slate-400">
          STOP réservé ({formatInt(stopReserved)} car.)
        </p>
      ) : null}
    </div>
  );
}
