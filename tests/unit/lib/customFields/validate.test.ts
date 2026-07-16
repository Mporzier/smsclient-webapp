import { describe, expect, it } from "vitest";
import {
  formatCustomFieldDisplay,
  isAllowedNumberFieldDraft,
  normalizeCustomFieldValue,
} from "@/lib/customFields/validate";

describe("normalizeCustomFieldValue", () => {
  it("accepte texte et tronque à 500", () => {
    expect(normalizeCustomFieldValue("  hello  ", "text")).toBe("hello");
    expect(normalizeCustomFieldValue("x".repeat(600), "text")?.length).toBe(
      500,
    );
  });

  it("normalise les nombres (virgule ou point)", () => {
    expect(normalizeCustomFieldValue("42", "number")).toBe("42");
    expect(normalizeCustomFieldValue("3,5", "number")).toBe("3.5");
    expect(normalizeCustomFieldValue("abc", "number")).toBeNull();
  });

  it("valide les dates ISO calendrier", () => {
    expect(normalizeCustomFieldValue("2024-02-29", "date")).toBe("2024-02-29");
    expect(normalizeCustomFieldValue("2023-02-29", "date")).toBeNull();
    expect(normalizeCustomFieldValue("15/02/2024", "date")).toBeNull();
  });

  it("vide → chaîne vide", () => {
    expect(normalizeCustomFieldValue("  ", "text")).toBe("");
    expect(normalizeCustomFieldValue("", "number")).toBe("");
    expect(normalizeCustomFieldValue("", "date")).toBe("");
  });
});

describe("isAllowedNumberFieldDraft", () => {
  it("accepte brouillons numériques, rejette lettres", () => {
    expect(isAllowedNumberFieldDraft("")).toBe(true);
    expect(isAllowedNumberFieldDraft("-")).toBe(true);
    expect(isAllowedNumberFieldDraft("12")).toBe(true);
    expect(isAllowedNumberFieldDraft("12,5")).toBe(true);
    expect(isAllowedNumberFieldDraft("12.")).toBe(true);
    expect(isAllowedNumberFieldDraft("a")).toBe(false);
    expect(isAllowedNumberFieldDraft("12e3")).toBe(false);
    expect(isAllowedNumberFieldDraft("1+2")).toBe(false);
  });
});

describe("formatCustomFieldDisplay", () => {
  it("formate date FR et vide en tiret", () => {
    expect(formatCustomFieldDisplay("2024-06-15", "date")).toBe("15/06/2024");
    expect(formatCustomFieldDisplay("", "text")).toBe("—");
    expect(formatCustomFieldDisplay("42", "number")).toBe("42");
  });
});
