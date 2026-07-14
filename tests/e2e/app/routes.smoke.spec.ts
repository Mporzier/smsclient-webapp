import { test } from "@playwright/test";
import { hasE2ECredentials } from "../helpers/env";
import {
  APP_ROUTES,
  gotoAppRoute,
  expectAppRouteTitle,
} from "../helpers/app";

/**
 * Smoke : chaque route principale charge et affiche son titre.
 * Étendre ensuite avec des specs dédiées par flow (campagnes, contacts, …).
 */
test.describe("Routes SMSClient (authentifié)", () => {
  test.beforeEach(() => {
    test.skip(
      !hasE2ECredentials(),
      "Définir E2E_USER_EMAIL et E2E_USER_PASSWORD pour les tests app",
    );
  });

  for (const route of APP_ROUTES) {
    test(`route #${route} — titre de page`, async ({ page }) => {
      await gotoAppRoute(page, route);
      await expectAppRouteTitle(page, route);
    });
  }
});
