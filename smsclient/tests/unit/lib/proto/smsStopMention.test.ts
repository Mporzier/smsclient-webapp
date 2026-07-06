import { describe, expect, it } from "vitest";
import {
  appendStopMention,
  buildEffectiveSms,
  SMS_STOP_SUFFIX,
  stripStopMention,
} from "@/lib/proto/smsStopMention";

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
});
