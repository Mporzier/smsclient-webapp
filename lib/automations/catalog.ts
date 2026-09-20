import catalog from "@/lib/types/automationCatalog.json";
import { automationScheduleLabel } from "@/lib/automations/scheduleLabel";
import type { AutomationKind, AutomationPresetKey } from "@/lib/types/automation";
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

export function catalogAutomationScheduleLabel(
  automation: CatalogAutomation,
): string {
  return automationScheduleLabel(automation.kind as AutomationKind, {
    fixedMonth: automation.fixedMonth,
    fixedDay: automation.fixedDay,
  });
}

type CatalogFile = {
  version: number;
  activityGroups: Record<string, string[]>;
  integrations: CatalogIntegration[];
  automations: CatalogAutomation[];
};

const DATA = catalog as CatalogFile;

export const AUTOMATION_CATALOG_INTEGRATIONS: readonly CatalogIntegration[] =
  DATA.integrations;

const CONFIGURABLE_PRESET_IDS = new Set<string>([
  "birthday",
  "saint_valentin",
  "paques",
  "fete_des_meres",
  "fete_des_peres",
  "rentree",
  "halloween",
  "toussaint",
  "noel",
  "nouvel_an",
]);

export type CatalogScopeFilter = "all" | "general" | "activity";

/** Automatisation proposée à tous les commerces (groupe « all »). */
export function isGeneralCatalogAutomation(
  automation: CatalogAutomation,
): boolean {
  const groups = automation.activityGroups ?? [];
  if ((automation.businessActivityIds?.length ?? 0) > 0) return false;
  if (groups.length === 0) return true;
  return groups.length === 1 && groups[0] === "all";
}

export function filterCatalogByScope(
  automations: readonly CatalogAutomation[],
  scope: CatalogScopeFilter,
  activityId: string | null | undefined,
): CatalogAutomation[] {
  if (scope === "all") return [...automations];
  if (scope === "general") {
    return automations.filter(isGeneralCatalogAutomation);
  }
  const id = (activityId ?? "").trim();
  if (!id) return [];
  return automations.filter((a) => automationMatchesActivity(a, id));
}

/** Filtres catalogue — jeu volontairement restreint. */
export const PRIMARY_CATALOG_TAGS = [
  "calendrier",
  "fidelisation",
  "promo",
] as const;

const TAG_ALIASES: Record<string, string> = {
  fidélité: "fidelisation",
  fidelite: "fidelisation",
  cadeau: "calendrier",
  acquisition: "fidelisation",
  retail: "promo",
  ecommerce: "promo",
};

function catalogTagsForUi(tags: string[] | undefined): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const tag of tags ?? []) {
    const n = normalizeCatalogTag(tag);
    if (!n || seen.has(n)) continue;
    if (!(PRIMARY_CATALOG_TAGS as readonly string[]).includes(n)) continue;
    seen.add(n);
    out.push(n);
  }
  if (out.length === 0) return ["fidelisation"];
  return out;
}

function prepareCatalogAutomation(raw: CatalogAutomation): CatalogAutomation {
  return { ...raw, tags: catalogTagsForUi(raw.tags) };
}

/** Catalogue UI : presets activables uniquement (pas de scénarios « Bientôt »). */
export const AUTOMATION_CATALOG: readonly CatalogAutomation[] =
  DATA.automations
    .filter(
      (a) =>
        CONFIGURABLE_PRESET_IDS.has(a.id) && a.status === "available",
    )
    .map(prepareCatalogAutomation);

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

/** Tags affichés en filtres (primary uniquement, présents dans le catalogue). */
export function listCatalogFilterTags(
  automations: readonly CatalogAutomation[] = AUTOMATION_CATALOG,
): string[] {
  const present = new Set<string>();
  for (const auto of automations) {
    for (const t of automationNormalizedTags(auto)) present.add(t);
  }
  return PRIMARY_CATALOG_TAGS.filter((t) => present.has(t));
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

/** CRM proposés dans la modale « Connecter un outil » (ordre produit). */
export const CONNECT_MODAL_CRM_INTEGRATION_IDS = [
  "hubspot",
  "brevo",
  "pipedrive",
  "sellsy",
  "axonaut",
  "zoho_crm",
] as const;

export function listConnectModalIntegrations(): CatalogIntegration[] {
  const byId = new Map(
    AUTOMATION_CATALOG_INTEGRATIONS.map((i) => [i.id, i]),
  );
  const out: CatalogIntegration[] = [];
  for (const id of CONNECT_MODAL_CRM_INTEGRATION_IDS) {
    const item = byId.get(id);
    if (item) out.push(item);
  }
  return out;
}

export function listCatalogIntegrations(): CatalogIntegration[] {
  return [...AUTOMATION_CATALOG_INTEGRATIONS].sort((a, b) =>
    a.label.localeCompare(b.label, "fr"),
  );
}

export function integrationConnectLabel(
  status: IntegrationStatus,
): "Connecter" | "Sur demande" {
  return status === "available" ? "Connecter" : "Sur demande";
}

export function filterCatalogIntegrations(
  integrations: readonly CatalogIntegration[],
  query: string,
): CatalogIntegration[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...integrations];
  return integrations.filter((item) => {
    const hay = [item.label, item.description, item.category]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
