import { describe, expect, it } from "vitest";
import {
  buildPayloadFromMappedRow,
  parseImportBirthday,
  suggestColumnRoles,
} from "@/lib/import/contactImportMap";

describe("parseImportBirthday", () => {
  it("accepte ISO YYYY-MM-DD", () => {
    expect(parseImportBirthday("1990-03-15")).toBe("1990-03-15");
  });

  it("accepte formats FR DD/MM/YYYY", () => {
    expect(parseImportBirthday("15/03/1990")).toBe("1990-03-15");
    expect(parseImportBirthday("1-3-1990")).toBe("1990-03-01");
    expect(parseImportBirthday("15.03.1990")).toBe("1990-03-15");
  });

  it("vide → chaîne vide", () => {
    expect(parseImportBirthday("")).toBe("");
    expect(parseImportBirthday("  ")).toBe("");
  });

  it("invalide → null", () => {
    expect(parseImportBirthday("32/01/1990")).toBeNull();
    expect(parseImportBirthday("1990/03/15")).toBeNull();
    expect(parseImportBirthday("pas-une-date")).toBeNull();
  });

  it("date future → null", () => {
    expect(parseImportBirthday("2099-01-01")).toBeNull();
    expect(parseImportBirthday("01/01/2099")).toBeNull();
  });
});

describe("suggestColumnRoles birthday", () => {
  it("mappe Date de naissance / birthday", () => {
    expect(
      suggestColumnRoles(["Téléphone", "Date de naissance", "Prénom"]),
    ).toEqual(["phone", "birthday", "first_name"]);
    expect(suggestColumnRoles(["Phone", "Birthday", "Last name"])).toEqual([
      "phone",
      "birthday",
      "last_name",
    ]);
  });
});

describe("buildPayloadFromMappedRow birthday", () => {
  it("remplit birthday depuis date FR", () => {
    const payload = buildPayloadFromMappedRow(
      ["0612345678", "Alice", "15/03/1990"],
      ["phone", "first_name", "birthday"],
    );
    expect(payload).not.toBeNull();
    expect(payload?.birthday).toBe("1990-03-15");
  });

  it("retourne null si birthday invalide", () => {
    expect(
      buildPayloadFromMappedRow(
        ["0612345678", "Alice", "nope"],
        ["phone", "first_name", "birthday"],
      ),
    ).toBeNull();
  });
});
