import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { test as setup, expect } from "@playwright/test";
import { getE2ECredentials } from "./helpers/env";
import { waitForAuthForm } from "./helpers/auth";

const authFile = "tests/e2e/.auth/user.json";

setup("authenticate test user", async ({ page }) => {
  const creds = getE2ECredentials();
  mkdirSync(dirname(authFile), { recursive: true });

  if (!creds) {
    await page.goto("/auth/login/");
    await page.context().storageState({ path: authFile });
    return;
  }

  await page.goto("/auth/login/");
  await waitForAuthForm(page, "Connexion");

  await page.locator("#email").fill(creds.email);
  await page.locator("#password").fill(creds.password);
  await page.locator('[data-cy="authForm-submit"]').click();

  await page.waitForURL((url) => !url.pathname.includes("/auth/login"), {
    timeout: 30_000,
  });

  await expect(page).not.toHaveURL(/\/auth\/login/);
  await page.context().storageState({ path: authFile });
});
