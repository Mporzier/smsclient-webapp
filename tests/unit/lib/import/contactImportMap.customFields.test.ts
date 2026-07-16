import { describe, expect, it } from "vitest";
import {
  buildPayloadFromMappedRow,
  customImportRole,
  suggestColumnRoles,
} from "@/lib/import/contactImportMap";
import type { CustomFieldDef } from "@/lib/types/customFields";

const defs: CustomFieldDef[] = [
  {
    id: "fld-score",
    label: "Score NPS",
    fieldType: "number",
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "fld-inscrit",
    label: "Date inscription",
    fieldType: "date",
    sortOrder: 1,
    createdAt: "2026-01-01T00:00:00Z",
  },
];

describe("suggestColumnRoles custom fields", () => {
  it("mappe un header égal au label (normalize)", () => {
    const roles = suggestColumnRoles(
      ["Téléphone", "Prénom", "Score NPS", "Date inscription"],
      undefined,
      defs,
    );
    expect(roles).toEqual([
      "phone",
      "first_name",
      customImportRole("fld-score"),
      customImportRole("fld-inscrit"),
    ]);
  });
});

describe("buildPayloadFromMappedRow custom fields", () => {
  it("remplit customFields validés", () => {
    const payload = buildPayloadFromMappedRow(
      ["0612345678", "Alice", "10", "2024-03-01"],
      [
        "phone",
        "first_name",
        customImportRole("fld-score"),
        customImportRole("fld-inscrit"),
      ],
      defs,
    );
    expect(payload).not.toBeNull();
    expect(payload?.customFields).toEqual({
      "fld-score": "10",
      "fld-inscrit": "2024-03-01",
    });
  });

  it("retourne null si valeur custom invalide", () => {
    const payload = buildPayloadFromMappedRow(
      ["0612345678", "Alice", "pas-un-nombre"],
      ["phone", "first_name", customImportRole("fld-score")],
      defs,
    );
    expect(payload).toBeNull();
  });
});
