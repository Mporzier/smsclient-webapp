import businessTargets from "@/lib/types/businessTargets.json";

export type BusinessTypeEntry = {
  id: string;
  label: string;
  emoji: string;
  examples: string[];
  smsHooks: string[];
};

export type BusinessCategoryEntry = {
  id: string;
  label: string;
  emoji: string;
  types: BusinessTypeEntry[];
};

export const BUSINESS_CATEGORIES =
  businessTargets.categories as readonly BusinessCategoryEntry[];

export type BusinessCategoryId = (typeof BUSINESS_CATEGORIES)[number]["id"];

/** Flat list of selectable business types (stored in profile). */
export const BUSINESS_ACTIVITIES: readonly (BusinessTypeEntry & {
  categoryId: BusinessCategoryId;
})[] = BUSINESS_CATEGORIES.flatMap((cat) =>
  cat.types.map((t) => ({ ...t, categoryId: cat.id as BusinessCategoryId })),
);

export type BusinessActivityId = (typeof BUSINESS_ACTIVITIES)[number]["id"];

export type BusinessActivity = (typeof BUSINESS_ACTIVITIES)[number];

/** Old picker IDs → canonical type id. */
const LEGACY_ALIASES: Record<string, BusinessActivityId> = {
  restaurant: "restaurant",
  bar: "bar",
  coiffure: "coiffeur_barber",
  fleuriste: "fleuriste",
  boulangerie: "boulangerie",
  retail: "concept_store",
  tabac: "tabac_presse",
  sport: "salle_sport",
  sante: "pharmacie",
  automobile: "concessionnaire",
  services: "autre",
  autre: "autre",
  /** Ancien type unique « immobilier » → agence */
  immobilier: "agence_immobiliere",
};

export function normalizeBusinessActivityId(
  id: string,
): BusinessActivityId | null {
  const trimmed = id.trim();
  if (!trimmed) return null;
  if (BUSINESS_ACTIVITIES.some((a) => a.id === trimmed)) {
    return trimmed as BusinessActivityId;
  }
  const mapped = LEGACY_ALIASES[trimmed];
  return mapped ?? null;
}

export function isValidBusinessActivityId(id: string): boolean {
  return normalizeBusinessActivityId(id) !== null;
}

export function businessCategoryOf(
  id: string,
): BusinessCategoryId | null {
  const canonical = normalizeBusinessActivityId(id);
  if (!canonical) return null;
  const entry = BUSINESS_ACTIVITIES.find((a) => a.id === canonical);
  return entry?.categoryId ?? null;
}

export function typesForCategory(
  categoryId: BusinessCategoryId,
): readonly BusinessActivity[] {
  return BUSINESS_ACTIVITIES.filter((a) => a.categoryId === categoryId);
}

export function businessActivityLabel(id: string): string {
  const canonical = normalizeBusinessActivityId(id);
  if (canonical) {
    const label = BUSINESS_ACTIVITIES.find((a) => a.id === canonical)?.label;
    if (label) return label;
  }
  const trimmed = id.trim();
  return trimmed || "—";
}

export function businessCategoryLabel(id: string): string {
  const label = BUSINESS_CATEGORIES.find((c) => c.id === id)?.label;
  if (label) return label;
  const trimmed = id.trim();
  return trimmed || "—";
}
