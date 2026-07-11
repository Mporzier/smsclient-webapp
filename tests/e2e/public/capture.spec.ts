import { test, expect } from "@playwright/test";

test.describe("Page capture QR (public)", () => {
  test("s’affiche sans authentification", async ({ page }) => {
    await page.goto("/capture/?s=demo");

    await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
  });
});
