import { describe, expect, it } from "vitest";
import {
  orFilterForText,
  resolveClientFilterColumn,
} from "@/lib/supabase/clientListFilters";

describe("resolveClientFilterColumn", () => {
  it("maps native ids", () => {
    expect(resolveClientFilterColumn("firstName")).toEqual({
      kind: "text",
      column: "first_name",
    });
    expect(resolveClientFilterColumn("lastSms")).toEqual({
      kind: "date",
      column: "last_sms_sent_at",
    });
    expect(resolveClientFilterColumn("groups")).toEqual({ kind: "groups" });
  });
  it("maps safe custom_ uuid", () => {
    const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    expect(resolveClientFilterColumn(`custom_${id}`)).toEqual({
      kind: "custom",
      fieldId: id,
    });
  });
  it("returns null for junk", () => {
    expect(resolveClientFilterColumn("custom_nope")).toBeNull();
    expect(resolveClientFilterColumn("avatar")).toBeNull();
  });
});

describe("orFilterForText", () => {
  it("contains uses escaped ilike", () => {
    expect(orFilterForText("notes", "contains", "a%b")).toBe(
      `notes.ilike."%a\\%b%"`,
    );
  });
  it("notContains includes empty", () => {
    expect(orFilterForText("notes", "notContains", "x")).toBe(
      `notes.is.null,notes.eq.,notes.not.ilike."%x%"`,
    );
  });
  it("isEmpty is null or empty string", () => {
    expect(orFilterForText("notes", "isEmpty")).toBe(`notes.is.null,notes.eq.`);
  });
});
