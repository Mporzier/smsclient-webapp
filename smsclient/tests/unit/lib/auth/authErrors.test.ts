import { describe, expect, it } from "vitest";
import {
  getLoginValidationErrors,
  mapAuthErrorToFrench,
} from "@/lib/auth/authErrors";

describe("authErrors", () => {
  it("valide l'e-mail et le mot de passe requis", () => {
    expect(getLoginValidationErrors("", "")).toEqual({
      emailError: "L’e-mail est requis.",
      passwordError: "Le mot de passe est requis.",
    });
  });

  it("retourne un message générique pour une erreur inconnue", () => {
    expect(mapAuthErrorToFrench(new Error("network down"))).toBe(
      "network down",
    );
    expect(mapAuthErrorToFrench(null)).toBe(
      "Une erreur est survenue. Réessayez.",
    );
  });
});
