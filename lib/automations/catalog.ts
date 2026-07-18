import catalog from "@/lib/types/automationCatalog.json";
import type { AutomationPresetKey } from "@/lib/types/automation";
import {
  isValidBusinessActivityId,
  normalizeBusinessActivityId,
} from "@/lib/types/businessActivity";

export type IntegrationStatus = "available" | "planned";

export type CatalogIntegration = {
  id: string;
  label: string;
  category: string;
  status: IntegrationStatus;
  description: string;
};

export type CatalogAutomation = {
  id: string;
  label: string;
  description: string;
  kind: string;
  status: IntegrationStatus;
  trigger?: string;
  fixedMonth?: number;
  fixedDay?: number;
  activityGroups?: string[];
  businessActivityIds?: string[];
  integrationIds: string[];
  defaultBody: string;
  tags?: string[];
  /** Pertinence catalogue 1–5 (read-only UI). */
  relevance?: number;
};

type CatalogFile = {
  version: number;
  activityGroups: Record<string, string[]>;
  integrations: CatalogIntegration[];
  automations: CatalogAutomation[];
};

const DATA = catalog as CatalogFile;

export const AUTOMATION_CATALOG_INTEGRATIONS: readonly CatalogIntegration[] =
  DATA.integrations;

export const AUTOMATION_CATALOG: readonly CatalogAutomation[] =
  DATA.automations;

export const PRIMARY_CATALOG_TAGS = [
  "promo",
  "api",
  "fidelisation",
  "acquisition",
  "calendrier",
] as const;

const TAG_ALIASES: Record<string, string> = {
  fidélité: "fidelisation",
  fidelite: "fidelisation",
  ipaas: "api",
};

const CONFIGURABLE_PRESET_IDS = new Set<string>([
  "birthday",
  "saint_valentin",
  "noel",
  "nouvel_an",
  "fete_des_meres",
]);

/** Clamp relevance pour affichage étoiles (0 = aucune). */
export function clampRelevance(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(5, Math.round(value)));
}

export function normalizeCatalogTag(tag: string): string {
  const raw = tag.trim().toLowerCase();
  if (!raw) return "";
  return TAG_ALIASES[raw] ?? TAG_ALIASES[tag.trim()] ?? raw;
}

export function automationNormalizedTags(
  automation: CatalogAutomation,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const tag of automation.tags ?? []) {
    const n = normalizeCatalogTag(tag);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

/** Tags pour chips : primary d’abord (si présents), puis reste alpha. */
export function listCatalogFilterTags(
  automations: readonly CatalogAutomation[] = AUTOMATION_CATALOG,
): string[] {
  const present = new Set<string>();
  for (const auto of automations) {
    for (const t of automationNormalizedTags(auto)) present.add(t);
  }
  const primary = PRIMARY_CATALOG_TAGS.filter((t) => present.has(t));
  const rest = [...present]
    .filter((t) => !(PRIMARY_CATALOG_TAGS as readonly string[]).includes(t))
    .sort((a, b) => a.localeCompare(b, "fr"));
  return [...primary, ...rest];
}

export function sortByRelevance(
  automations: readonly CatalogAutomation[],
): CatalogAutomation[] {
  return [...automations].sort((a, b) => {
    const rel = clampRelevance(b.relevance) - clampRelevance(a.relevance);
    if (rel !== 0) return rel;
    return a.label.localeCompare(b.label, "fr");
  });
}

export type FilterCatalogOptions = {
  query?: string;
  /** Tag normalisé ; null/undefined/"" = tous. */
  tag?: string | null;
  favoritesOnly?: boolean;
  favoriteIds?: ReadonlySet<string> | readonly string[];
  source?: readonly CatalogAutomation[];
};

export function filterCatalogAutomations(
  opts: FilterCatalogOptions = {},
): CatalogAutomation[] {
  const source = opts.source ?? AUTOMATION_CATALOG;
  const q = (opts.query ?? "").trim().toLowerCase();
  const tag = opts.tag ? normalizeCatalogTag(opts.tag) : "";
  const favSet =
    opts.favoriteIds instanceof Set
      ? opts.favoriteIds
      : new Set(opts.favoriteIds ?? []);

  return source.filter((auto) => {
    if (opts.favoritesOnly && !favSet.has(auto.id)) return false;
    if (tag) {
      const tags = automationNormalizedTags(auto);
      if (!tags.includes(tag)) return false;
    }
    if (!q) return true;
    const hay = [
      auto.label,
      auto.description,
      ...(auto.tags ?? []),
      ...automationNormalizedTags(auto),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function splitByActivity(
  automations: readonly CatalogAutomation[],
  activityId: string | null | undefined,
): { matched: CatalogAutomation[]; other: CatalogAutomation[] } {
  const id = (activityId ?? "").trim();
  if (!id || !normalizeBusinessActivityId(id)) {
    return { matched: [...automations], other: [] };
  }
  const matched: CatalogAutomation[] = [];
  const other: CatalogAutomation[] = [];
  for (const auto of automations) {
    if (automationMatchesActivity(auto, id)) matched.push(auto);
    else other.push(auto);
  }
  return { matched, other };
}

export function primaryTagForDisplay(
  automation: CatalogAutomation,
  activeFilterTag?: string | null,
): string | undefined {
  const tags = automationNormalizedTags(automation);
  if (!tags.length) return undefined;
  const active = activeFilterTag
    ? normalizeCatalogTag(activeFilterTag)
    : "";
  if (active && tags.includes(active)) return active;
  for (const p of PRIMARY_CATALOG_TAGS) {
    if (tags.includes(p)) return p;
  }
  return tags[0];
}

export function isConfigurableCatalogId(
  id: string,
): id is AutomationPresetKey {
  return CONFIGURABLE_PRESET_IDS.has(id);
}

function expandActivityTargets(automation: CatalogAutomation): Set<string> {
  const ids = new Set<string>();
  for (const groupKey of automation.activityGroups ?? []) {
    const members = DATA.activityGroups[groupKey];
    if (!members) continue;
    for (const memberId of members) {
      if (memberId === "*") {
        ids.add("*");
      } else {
        ids.add(memberId);
      }
    }
  }
  for (const memberId of automation.businessActivityIds ?? []) {
    ids.add(memberId);
  }
  return ids;
}

/** True si l’automatisation s’applique au type d’activité (ID businessTargets). */
export function automationMatchesActivity(
  automation: CatalogAutomation,
  activityId: string,
): boolean {
  const canonical = normalizeBusinessActivityId(activityId);
  if (!canonical || !isValidBusinessActivityId(canonical)) return false;
  const targets = expandActivityTargets(automation);
  if (targets.has("*")) return true;
  return targets.has(canonical);
}

export function automationsForActivity(
  activityId: string,
): CatalogAutomation[] {
  return AUTOMATION_CATALOG.filter((a) =>
    automationMatchesActivity(a, activityId),
  );
}

export function integrationsForAutomation(
  automation: CatalogAutomation,
): CatalogIntegration[] {
  const set = new Set(automation.integrationIds);
  return AUTOMATION_CATALOG_INTEGRATIONS.filter((i) => set.has(i.id));
}

export function catalogIntegrationById(
  id: string,
): CatalogIntegration | undefined {
  return AUTOMATION_CATALOG_INTEGRATIONS.find((i) => i.id === id);
}
