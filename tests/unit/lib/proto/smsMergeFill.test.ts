import { describe, expect, it } from "vitest";
import { parseMergeFillCounts } from "@/lib/supabase/campaignMergeFill";
import {
  filledCountForMergeKey,
  formatMergeFillSuffix,
} from "@/lib/proto/smsMergeFill";

describe("merge fill counts", () => {
  it("parse JSON RPC", () => {
    const parsed = parseMergeFillCounts({
      total: 800,
      prenom: 742,
      nom: 10,
      anniversaire: 3,
      custom: { cf1: 120 },
    });
    expect(parsed?.total).toBe(800);
    expect(parsed?.prenom).toBe(742);
    expect(filledCountForMergeKey(parsed!, "prenom")).toBe(742);
    expect(filledCountForMergeKey(parsed!, "custom:cf1")).toBe(120);
    expect(filledCountForMergeKey(parsed!, "custom:missing")).toBe(0);
  });

  it("format suffix", () => {
    expect(formatMergeFillSuffix(742, 800)).toBe("742/800 · 93%");
    expect(formatMergeFillSuffix(0, 0)).toBe("");
    expect(formatMergeFillSuffix(0, 10)).toBe("0/10 · 0%");
  });
});
