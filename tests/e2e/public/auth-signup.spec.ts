import { test, expect } from "@playwright/test";
import { waitForAuthForm } from "../helpers/auth";

test.describe("Inscription (public)", () => {
  test("affiche le formulaire de création de compte", async ({ page }) => {
    await page.goto("/auth/signup/");
    await waitForAuthForm(page, "Créer un compte");

    await expect(
      page.getByRole("heading", { name: "Créer un compte" }),
    ).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "S'inscrire" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Se connecter" }),
    ).toBeVisible();
  });
});
