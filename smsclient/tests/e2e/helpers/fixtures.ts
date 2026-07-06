import { test } from "@playwright/test";
import { hasE2ECredentials } from "./env";

/** Ignore le test si aucun compte E2E n'est configuré. */
export function skipWithoutE2ECredentials() {
  test.skip(
    !hasE2ECredentials(),
    "Définir E2E_USER_EMAIL et E2E_USER_PASSWORD pour les tests app",
  );
}

/** Suffixe unique par test (évite collisions Supabase). */
export function e2eUniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

/** Mobile FR valide 10 chiffres (06…). */
export function uniqueFrMobile(): string {
  const n = e2eUniqueSuffix().replace(/\D/g, "").slice(-8).padStart(8, "0");
  return `06${n}`;
}

export function formatFrMobileDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 10);
  return d.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}
