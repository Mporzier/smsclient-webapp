import { describe, expect, it } from "vitest";
import {
  APP_ROUTES,
  isAppRoute,
  parseHash,
  parseLegacyCampaignWizardStep,
} from "@/lib/proto/routes";

describe("routes", () => {
  it("parseHash résout les routes hash connues", () => {
    expect(parseHash("#contacts")).toBe("contacts");
    expect(parseHash("#campagnes")).toBe("campagnes");
    expect(parseHash("#nouvelle-campagne")).toBe("nouvelle-campagne");
    expect(parseHash("#dashboard")).toBe("dashboard");
    expect(parseHash("")).toBe("dashboard");
  });

  it("parseLegacyCampaignWizardStep lit les anciennes URLs", () => {
    expect(parseLegacyCampaignWizardStep("nouvelle-campagne-2")).toBe(2);
    expect(parseLegacyCampaignWizardStep("contacts")).toBeNull();
  });

  it("isAppRoute valide les routes exportées", () => {
    for (const route of APP_ROUTES) {
      expect(isAppRoute(route)).toBe(true);
    }
    expect(isAppRoute("inconnu")).toBe(false);
  });
});
