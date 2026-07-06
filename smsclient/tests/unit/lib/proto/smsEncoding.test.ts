import { describe, expect, it } from "vitest";
import {
  analyzeSmsMessage,
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
});
