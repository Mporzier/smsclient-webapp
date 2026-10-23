import { describe, expect, it } from "vitest";
import {
  analyzeSmsMessage,
  clampSmsMessageToBillableLimit,
  countGsmSeptets,
  SMS_LIMITS,
} from "@/lib/proto/smsEncoding";
import { SMS_STOP_SUFFIX } from "@/lib/proto/smsStopMention";

describe("smsEncoding", () => {
  it("compte 160 caractères max pour un SMS GSM simple", () => {
    const stats = analyzeSmsMessage("a".repeat(160));
    expect(stats.encoding).toBe("GSM_7BIT");
    expect(stats.smsCount).toBe(1);
    expect(stats.singleSegmentLimit).toBe(SMS_LIMITS.GSM_SINGLE);
    expect(stats.remainingInTier).toBe(0);
  });

  it("réserve 11 caractères pour STOP 36000 en GSM", () => {
    expect(countGsmSeptets(SMS_STOP_SUFFIX)).toBe(11);
  });

  it("plafonne à 2 SMS GSM (306 septets)", () => {
    expect(SMS_LIMITS.MAX_SEGMENTS).toBe(2);
    const stats = analyzeSmsMessage("a".repeat(306));
    expect(stats.smsCount).toBe(2);
    expect(stats.maxBillableCharacters).toBe(306);
    expect(stats.exceedsMaxSegments).toBe(false);
    const over = analyzeSmsMessage("a".repeat(307));
    expect(over.exceedsMaxSegments).toBe(true);
  });

  it("emoji bascule Unicode et plafond 134 unités (2 SMS)", () => {
    expect(analyzeSmsMessage("hello").encoding).toBe("GSM_7BIT");
    expect(analyzeSmsMessage("hello😀").encoding).toBe("UNICODE");

    const withEmoji = "😀".repeat(135);
    const stats = analyzeSmsMessage(withEmoji);
    expect(stats.encoding).toBe("UNICODE");
    expect(stats.maxBillableCharacters).toBe(134);
    expect(stats.exceedsMaxSegments).toBe(true);
    const clamped = clampSmsMessageToBillableLimit(withEmoji);
    const clampedStats = analyzeSmsMessage(clamped);
    expect(clampedStats.characterCount).toBeLessThanOrEqual(134);
    expect(clampedStats.exceedsMaxSegments).toBe(false);
  });
});
