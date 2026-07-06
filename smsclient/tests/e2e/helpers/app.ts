import type { Page } from "@playwright/test";
import {
  APP_ROUTES,
  ROUTE_TITLES,
  type AppRoute,
} from "@/lib/proto/routes";

export { APP_ROUTES, ROUTE_TITLES, type AppRoute };

/** Navigation hash SPA (#contacts, #campagnes, …). */
export async function gotoAppRoute(page: Page, route: AppRoute) {
  await page.goto(`/#${route}`);
}

export async function expectAppRouteTitle(page: Page, route: AppRoute) {
  await page.getByRole("heading", {
    name: ROUTE_TITLES[route],
    level: 1,
  }).waitFor({ state: "visible" });
}
