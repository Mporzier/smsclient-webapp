import { describe, expect, it } from "vitest";
import { orFilterForText } from "@/lib/supabase/listFilterSql";
import { resolveGroupFilterColumn } from "@/lib/supabase/groupListFilters";

describe("resolveGroupFilterColumn", () => {
  it("maps group column ids", () => {
    expect(resolveGroupFilterColumn("name")).toEqual({
      kind: "text",
      column: "name",
    });
    expect(resolveGroupFilterColumn("description")).toEqual({
      kind: "text",
      column: "description",
    });
    expect(resolveGroupFilterColumn("contactCount")).toEqual({
      kind: "number",
      column: "member_count",
    });
    expect(resolveGroupFilterColumn("lastCampaignLabel")).toEqual({
      kind: "date",
      column: "last_campaign_at",
    });
    expect(resolveGroupFilterColumn("createdLabel")).toEqual({
      kind: "date",
      column: "created_at",
    });
  });

  it("returns null for junk", () => {
    expect(resolveGroupFilterColumn("select")).toBeNull();
    expect(resolveGroupFilterColumn("avatar")).toBeNull();
  });
});

describe("orFilterForText reuse", () => {
  it("contains uses escaped ilike", () => {
    expect(orFilterForText("name", "contains", "a%b")).toBe(
      `name.ilike."%a\\%b%"`,
    );
  });
});
