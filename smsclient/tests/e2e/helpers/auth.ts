import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/** Attend l’affichage du formulaire auth (indépendant de l’overlay Supabase). */
export async function waitForAuthForm(
  page: Page,
  heading: "Connexion" | "Créer un compte",
) {
  await expect(page.getByRole("heading", { name: heading })).toBeVisible({
    timeout: 30_000,
  });
}

/** True si le formulaire auth est utilisable (Supabase configuré). */
export async function isAuthFormEnabled(page: Page) {
  const submit = page.locator('[data-cy="authForm-submit"]');
  return submit.isEnabled();
}
