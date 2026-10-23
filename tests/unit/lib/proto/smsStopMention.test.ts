import { describe, expect, it } from "vitest";
import {
  appendStopMention,
  billableCampaignMessage,
  buildEffectiveSms,
  clampSmsEditorBody,
  SMS_STOP_SUFFIX,
  stripStopMention,
} from "@/lib/proto/smsStopMention";
import { analyzeSmsMessage } from "@/lib/proto/smsEncoding";

describe("smsStopMention", () => {
  it("appendStopMention ajoute STOP 36000 au corps", () => {
    expect(appendStopMention("Bonjour")).toBe(`Bonjour${SMS_STOP_SUFFIX}`);
  });

  it("stripStopMention retire une mention STOP en fin de message", () => {
    expect(stripStopMention(`Promo du jour${SMS_STOP_SUFFIX}`)).toBe(
      "Promo du jour",
    );
  });

  it("buildEffectiveSms inclut toujours STOP pour une campagne", () => {
    expect(buildEffectiveSms("Offre -20 %", true)).toBe(
      `Offre -20 %${SMS_STOP_SUFFIX}`,
    );
  });

  it("clampSmsEditorBody réserve STOP (306 septets facturés max)", () => {
    const body = "a".repeat(400);
    const clamped = clampSmsEditorBody(body, true);
    const billable = billableCampaignMessage(clamped, true);
    const stats = analyzeSmsMessage(billable);
    expect(stats.exceedsMaxSegments).toBe(false);
    expect(stats.characterCount).toBeLessThanOrEqual(306);
    expect(clamped.length).toBeLessThan(400);
  });
});
