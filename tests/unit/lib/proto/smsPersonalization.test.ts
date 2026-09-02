import { describe, expect, it } from "vitest";
import {
  containsKnownMergeTag,
  expandMergeTags,
  formatBirthdayShort,
  mergeTagToken,
  normalizePrenomTokens,
  SMS_PRENOM_TAG,
} from "@/lib/proto/smsPersonalization";
import type { CustomFieldDef } from "@/lib/types/customFields";

const defs: CustomFieldDef[] = [
  {
    id: "cf1",
    label: "Numéro client",
    fieldType: "text",
    sortOrder: 0,
    createdAt: "",
  },
];

describe("sms merge tags", () => {
  it("normalise legacy prénom vers [Prénom]", () => {
    expect(normalizePrenomTokens("Hello ⟦prénom⟧")).toBe("Hello [Prénom]");
    expect(normalizePrenomTokens("{PRENOM}")).toBe(SMS_PRENOM_TAG);
  });

  it("mergeTagToken suit l’orthographe du champ", () => {
    expect(mergeTagToken("prenom")).toBe("[Prénom]");
    expect(mergeTagToken("nom")).toBe("[Nom]");
    expect(mergeTagToken("anniversaire")).toBe("[Anniversaire]");
    expect(
      mergeTagToken("custom:cf2", [
        {
          id: "cf2",
          label: "N° client (T.V.A.)",
          fieldType: "text",
          sortOrder: 0,
          createdAt: "",
        },
      ]),
    ).toBe("[N° client (T.V.A.)]");
  });

  it("expand system + custom, vide nettoie", () => {
    const out = expandMergeTags(
      "Bonjour [Prénom] [Nom], fête le [Anniversaire] ([Numéro client]).",
      {
        firstName: "Marie",
        lastName: "",
        birthday: "1990-08-24",
        customFields: { cf1: "" },
      },
      defs,
    );
    expect(out).toBe("Bonjour Marie, fête le 24/08.");
  });

  it("expand accepte encore [prenom] ascii", () => {
    expect(
      expandMergeTags("[prenom]", {
        firstName: "Ada",
        lastName: "",
        birthday: "",
        customFields: {},
      }),
    ).toBe("Ada");
  });

  it("custom : match exact avec ponctuation", () => {
    const punctDefs: CustomFieldDef[] = [
      {
        id: "cf2",
        label: "N° client (T.V.A.)",
        fieldType: "text",
        sortOrder: 0,
        createdAt: "",
      },
    ];
    expect(
      expandMergeTags("Ref [N° client (T.V.A.)]", {
        firstName: "",
        lastName: "",
        birthday: "",
        customFields: { cf2: "42" },
      }, punctDefs),
    ).toBe("Ref 42");
  });

  it("laisse [inconnu] intact", () => {
    expect(
      expandMergeTags("[promo] [prenom]", {
        firstName: "Ada",
        lastName: "",
        birthday: "",
        customFields: {},
      }),
    ).toBe("[promo] Ada");
  });

  it("formatBirthdayShort", () => {
    expect(formatBirthdayShort("1990-08-24")).toBe("24/08");
  });

  it("containsKnownMergeTag custom via defs", () => {
    expect(containsKnownMergeTag("[Numéro client]", defs)).toBe(true);
    expect(containsKnownMergeTag("[Numéro client]", [])).toBe(false);
  });

  it("mergeTagToken custom", () => {
    expect(mergeTagToken("custom:cf1", defs)).toBe("[Numéro client]");
  });
});
