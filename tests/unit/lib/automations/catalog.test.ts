import { describe, expect, it } from "vitest";
import type { CatalogAutomation } from "@/lib/automations/catalog";
import {
  clampRelevance,
  filterCatalogAutomations,
  normalizeCatalogTag,
  sortByRelevance,
  splitByActivity,
} from "@/lib/automations/catalog";

function auto(
  partial: Partial<CatalogAutomation> & Pick<CatalogAutomation, "id" | "label">,
): CatalogAutomation {
  return {
    description: partial.description ?? "",
    kind: partial.kind ?? "custom",
    status: partial.status ?? "available",
    integrationIds: partial.integrationIds ?? ["native"],
    defaultBody: partial.defaultBody ?? "",
    tags: partial.tags,
    relevance: partial.relevance,
    activityGroups: partial.activityGroups,
    businessActivityIds: partial.businessActivityIds,
    ...partial,
  };
}

describe("clampRelevance", () => {
  it("clamps and rounds", () => {
    expect(clampRelevance(undefined)).toBe(0);
    expect(clampRelevance("3")).toBe(0);
    expect(clampRelevance(3.6)).toBe(4);
    expect(clampRelevance(0)).toBe(0);
    expect(clampRelevance(9)).toBe(5);
    expect(clampRelevance(-2)).toBe(0);
  });
});

describe("normalizeCatalogTag", () => {
  it("maps aliases", () => {
    expect(normalizeCatalogTag("fidélité")).toBe("fidelisation");
    expect(normalizeCatalogTag("iPaaS")).toBe("api");
    expect(normalizeCatalogTag("Promo")).toBe("promo");
  });
});

describe("filterCatalogAutomations", () => {
  const source = [
    auto({
      id: "a",
      label: "Anniversaire client",
      description: "SMS date",
      tags: ["calendrier", "fidélité"],
      relevance: 5,
    }),
    auto({
      id: "b",
      label: "Relance panier",
      description: "Ecommerce abandon",
      tags: ["promo", "ecommerce"],
      relevance: 3,
    }),
    auto({
      id: "c",
      label: "Zapier hook",
      description: "Bridge",
      tags: ["iPaaS"],
      relevance: 2,
    }),
  ];

  it("filters by query on label/description/tags", () => {
    const r = filterCatalogAutomations({ source, query: "panier" });
    expect(r.map((x) => x.id)).toEqual(["b"]);
  });

  it("filters by single normalized tag", () => {
    const r = filterCatalogAutomations({ source, tag: "fidelisation" });
    expect(r.map((x) => x.id)).toEqual(["a"]);
    const api = filterCatalogAutomations({ source, tag: "api" });
    expect(api.map((x) => x.id)).toEqual(["c"]);
  });

  it("filters favorites only", () => {
    const r = filterCatalogAutomations({
      source,
      favoritesOnly: true,
      favoriteIds: ["c", "a"],
    });
    expect(r.map((x) => x.id).sort()).toEqual(["a", "c"]);
  });
});

describe("splitByActivity", () => {
  const source = [
    auto({
      id: "all",
      label: "All",
      activityGroups: ["all"],
    }),
    auto({
      id: "butcher",
      label: "Boucher",
      businessActivityIds: ["boucherie"],
    }),
  ];

  it("returns all as matched when no activity", () => {
    const { matched, other } = splitByActivity(source, null);
    expect(matched).toHaveLength(2);
    expect(other).toHaveLength(0);
  });

  it("splits matched vs other when activity set", () => {
    const { matched, other } = splitByActivity(source, "boucherie");
    expect(matched.map((x) => x.id).sort()).toEqual(["all", "butcher"]);
    expect(other).toHaveLength(0);

    const resto = splitByActivity(source, "restaurant");
    // "all" matches *; butcher goes to other if restaurant is valid
    expect(resto.matched.some((x) => x.id === "all")).toBe(true);
    expect(resto.other.some((x) => x.id === "butcher")).toBe(true);
  });
});

describe("sortByRelevance", () => {
  it("sorts relevance desc then label", () => {
    const sorted = sortByRelevance([
      auto({ id: "1", label: "B", relevance: 3 }),
      auto({ id: "2", label: "A", relevance: 5 }),
      auto({ id: "3", label: "C", relevance: 5 }),
    ]);
    expect(sorted.map((x) => x.id)).toEqual(["2", "3", "1"]);
  });
});
