import { test, expect } from "@playwright/test";
import { authSelectors } from "../helpers/selectors";
import { waitForAuthForm } from "../helpers/auth";
import { hasSupabaseEnv } from "../helpers/env";

test.describe("Connexion (public)", () => {
  test("affiche le formulaire de connexion", async ({ page }) => {
    await page.goto("/auth/login/");
    await waitForAuthForm(page, "Connexion");

    await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Se connecter" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "S'inscrire" })).toBeVisible();
  });

  test("affiche une erreur si identifiants invalides", async ({ page }) => {
    test.skip(
      !hasSupabaseEnv(),
      "NEXT_PUBLIC_SUPABASE_URL / ANON_KEY requis pour tester la connexion",
    );

    await page.goto("/auth/login/");
    await waitForAuthForm(page, "Connexion");

    await page.locator("#email").fill("invalid@example.com");
    await page.locator("#password").fill("wrong-password-123");
    await page.locator(authSelectors.submit).click();

    await expect(page.locator(authSelectors.error)).toBeVisible({
      timeout: 15_000,
    });
  });
});
