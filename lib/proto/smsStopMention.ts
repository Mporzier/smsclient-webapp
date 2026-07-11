import {
  analyzeSmsMessage,
  countGsmSeptets,
  countUcs2Units,
  type SmsEncoding,
} from "@/lib/proto/smsEncoding";

/** Mention STOP courte conforme (GSM). */
export const SMS_STOP_SUFFIX = " STOP 36000";

const STOP_TRAILING_PATTERNS = [
  /\s+répondez\s+stop[\s\S]*$/i,
  /\s+réponds\s+stop[\s\S]*$/i,
  /\s+stop\s+pour\s+ne\s+plus[\s\S]*$/i,
  /\s+stop\s*36000\s*$/i,
  /\s+stop\s+\d{4,6}\s*$/i,
] as const;

export function hasStopMention(text: string): boolean {
  return /\bstop\b/i.test(text);
}

export function stripStopMention(text: string): string {
  let result = text.trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of STOP_TRAILING_PATTERNS) {
      const next = result.replace(pattern, "").trim();
      if (next !== result) {
        result = next;
        changed = true;
      }
    }
  }
  return result;
}

export function appendStopMention(body: string): string {
  const clean = stripStopMention(body).trim();
  if (!clean) return SMS_STOP_SUFFIX.trim();
  return `${clean}${SMS_STOP_SUFFIX}`;
}

/** Message facturé / envoyé selon le toggle STOP. */
export function buildEffectiveSms(
  body: string,
  includeStop: boolean,
): string {
  const trimmed = body.trim();
  if (!includeStop) return trimmed;
  if (hasStopMention(trimmed)) return trimmed;
  return appendStopMention(trimmed);
}

function encodingForMessage(text: string): SmsEncoding {
  return analyzeSmsMessage(text).encoding;
}

export function stopSuffixBillableLength(body: string): number {
  const encoding = encodingForMessage(body || "A");
  return encoding === "GSM_7BIT"
    ? countGsmSeptets(SMS_STOP_SUFFIX)
    : countUcs2Units(SMS_STOP_SUFFIX);
}

export type StopSegmentImpact = {
  partsWithoutStop: number;
  partsWithStop: number;
  jumpsSegment: boolean;
  extraParts: number;
};

export function getStopSegmentImpact(
  body: string,
  includeStop: boolean,
): StopSegmentImpact {
  const trimmed = body.trim();
  const partsWithoutStop = analyzeSmsMessage(trimmed).smsCount;
  if (!includeStop) {
    return {
      partsWithoutStop,
      partsWithStop: partsWithoutStop,
      jumpsSegment: false,
      extraParts: 0,
    };
  }
  const partsWithStop = analyzeSmsMessage(
    buildEffectiveSms(trimmed, true),
  ).smsCount;
  return {
    partsWithoutStop,
    partsWithStop,
    jumpsSegment: partsWithStop > partsWithoutStop,
    extraParts: Math.max(0, partsWithStop - partsWithoutStop),
  };
}
