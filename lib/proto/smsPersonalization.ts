import { analyzeSmsMessage } from "@/lib/proto/smsEncoding";
import { isValidFrMobile } from "@/lib/proto/smsUtils";
import type { ContactRowData } from "@/lib/types/contact";
import type { CustomFieldDef } from "@/lib/types/customFields";

export const SYSTEM_MERGE_KEYS = ["prenom", "nom", "anniversaire"] as const;
export type SystemMergeKey = (typeof SYSTEM_MERGE_KEYS)[number];

/** Libellé inséré dans `[…]` — même orthographe que les champs (accents, casse). */
export const SYSTEM_MERGE_LABELS: Record<SystemMergeKey, string> = {
  prenom: "Prénom",
  nom: "Nom",
  anniversaire: "Anniversaire",
};

/** Token canonique (plain text). */
export const SMS_PRENOM_TAG = `[${SYSTEM_MERGE_LABELS.prenom}]`;
export const SMS_NOM_TAG = `[${SYSTEM_MERGE_LABELS.nom}]`;
export const SMS_ANNIVERSAIRE_TAG = `[${SYSTEM_MERGE_LABELS.anniversaire}]`;

export type MergeTagKey = SystemMergeKey | `custom:${string}`;

/** Aperçu iPhone : prénom d’exemple. */
export const SMS_PRENOM_PREVIEW_SAMPLE = "Marie";
export const SMS_NOM_PREVIEW_SAMPLE = "Dupont";
export const SMS_ANNIVERSAIRE_PREVIEW_ISO = "1990-08-24";

/** Estimation étape 2 si aucun prénom connu (saisie manuelle). */
export const SMS_PRENOM_ESTIMATE_FALLBACK = "Prénom";
export const SMS_NOM_ESTIMATE_FALLBACK = "Nom";
export const SMS_ANNIVERSAIRE_ESTIMATE = "31/12";

const LEGACY_PRENOM_RE =
  /⟦prénom⟧|\{PRENOM\}|\{prenom\}|\{\{prenom\}\}/gi;

const BRACKET_TAG_RE = /\[([^[\]]+)\]/g;

export type SmsMergeValues = {
  firstName: string;
  lastName: string;
  birthday: string;
  customFields: Record<string, string>;
};

export function foldMergeLabel(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function customMergeKey(id: string): MergeTagKey {
  return `custom:${id}`;
}

export function mergeTagToken(
  key: MergeTagKey,
  defs: readonly CustomFieldDef[] = [],
): string {
  if (key === "prenom") return SMS_PRENOM_TAG;
  if (key === "nom") return SMS_NOM_TAG;
  if (key === "anniversaire") return SMS_ANNIVERSAIRE_TAG;
  const id = key.slice("custom:".length);
  const def = defs.find((d) => d.id === id);
  const label = def?.label.trim();
  return label ? `[${label}]` : "";
}

export function formatBirthdayShort(iso: string): string {
  const trimmed = iso.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (!m) return trimmed;
  return `${m[3]}/${m[2]}`;
}

function tidyMergeGaps(text: string): string {
  return text
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ ,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/^,\s*/g, "")
    .replace(/\s+,/g, ",")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isSystemMergeKey(fold: string): fold is SystemMergeKey {
  return (SYSTEM_MERGE_KEYS as readonly string[]).includes(fold);
}

function systemKeyFromInner(inner: string): SystemMergeKey | null {
  const trimmed = inner.trim();
  for (const key of SYSTEM_MERGE_KEYS) {
    if (trimmed === SYSTEM_MERGE_LABELS[key]) return key;
  }
  const fold = foldMergeLabel(trimmed);
  return isSystemMergeKey(fold) ? fold : null;
}

function customDefByExactLabel(
  defs: readonly CustomFieldDef[],
): Map<string, CustomFieldDef> {
  const map = new Map<string, CustomFieldDef>();
  const sorted = [...defs].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const def of sorted) {
    const label = def.label.trim();
    if (!label) continue;
    if (systemKeyFromInner(label)) continue;
    if (map.has(label)) continue;
    map.set(label, def);
  }
  return map;
}

function customDefByFold(
  defs: readonly CustomFieldDef[],
): Map<string, CustomFieldDef> {
  const map = new Map<string, CustomFieldDef>();
  const sorted = [...defs].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const def of sorted) {
    const fold = foldMergeLabel(def.label);
    if (!fold) continue;
    if (isSystemMergeKey(fold)) continue;
    if (map.has(fold)) continue;
    map.set(fold, def);
  }
  return map;
}

function resolveBracketInner(
  inner: string,
  defs: readonly CustomFieldDef[],
): { kind: "system"; key: SystemMergeKey } | { kind: "custom"; id: string } | null {
  const trimmed = inner.trim();
  const systemKey = systemKeyFromInner(trimmed);
  if (systemKey) return { kind: "system", key: systemKey };
  const exact = customDefByExactLabel(defs).get(trimmed);
  if (exact) return { kind: "custom", id: exact.id };
  const fold = foldMergeLabel(trimmed);
  const def = customDefByFold(defs).get(fold);
  if (!def) return null;
  return { kind: "custom", id: def.id };
}

export function normalizePrenomTokens(text: string): string {
  return text.replace(LEGACY_PRENOM_RE, SMS_PRENOM_TAG);
}

export function containsPrenomTag(text: string): boolean {
  return containsKnownMergeTag(text, []);
}

export function containsKnownMergeTag(
  text: string,
  defs: readonly CustomFieldDef[] = [],
): boolean {
  const normalized = normalizePrenomTokens(text);
  BRACKET_TAG_RE.lastIndex = 0;
  for (const match of normalized.matchAll(BRACKET_TAG_RE)) {
    if (resolveBracketInner(match[1] ?? "", defs)) return true;
  }
  return false;
}

export function expandMergeTags(
  text: string,
  values: SmsMergeValues,
  defs: readonly CustomFieldDef[] = [],
): string {
  const normalized = normalizePrenomTokens(text);
  const replaced = normalized.replace(BRACKET_TAG_RE, (full, inner: string) => {
    const resolved = resolveBracketInner(inner, defs);
    if (!resolved) return full;
    if (resolved.kind === "system") {
      if (resolved.key === "prenom") return values.firstName.trim();
      if (resolved.key === "nom") return values.lastName.trim();
      return formatBirthdayShort(values.birthday);
    }
    return (values.customFields[resolved.id] ?? "").trim();
  });
  return tidyMergeGaps(replaced);
}

export function expandPrenomTag(text: string, firstName: string): string {
  return expandMergeTags(
    text,
    {
      firstName,
      lastName: "",
      birthday: "",
      customFields: {},
    },
    [],
  );
}

export function removePrenomTag(text: string): string {
  const normalized = normalizePrenomTokens(text);
  BRACKET_TAG_RE.lastIndex = 0;
  const stripped = normalized.replace(BRACKET_TAG_RE, (full, inner: string) => {
    const resolved = resolveBracketInner(inner, []);
    if (resolved?.kind === "system" && resolved.key === "prenom") return "";
    return full;
  });
  return tidyMergeGaps(stripped);
}

/** Ajoute la balise prénom si elle est absente. */
export function ensurePrenomInMessage(text: string): string {
  if (containsPrenomTag(text)) return normalizePrenomTokens(text);
  const trimmed = text.trim();
  if (!trimmed) return `Bonjour ${SMS_PRENOM_TAG}, `;
  if (/^bonjour[,\s]/i.test(trimmed)) {
    return trimmed.replace(/^bonjour[,\s]*/i, `Bonjour ${SMS_PRENOM_TAG}, `);
  }
  return `Bonjour ${SMS_PRENOM_TAG}, ${trimmed}`;
}

export function mergeValuesFromContact(
  contact: Pick<
    ContactRowData,
    "firstName" | "lastName" | "birthday" | "customFields"
  >,
): SmsMergeValues {
  return {
    firstName: contact.firstName,
    lastName: contact.lastName,
    birthday: contact.birthday,
    customFields: contact.customFields ?? {},
  };
}

export function buildEstimateMergeValues(
  contacts: readonly Pick<
    ContactRowData,
    "firstName" | "lastName" | "birthday" | "customFields"
  >[],
  defs: readonly CustomFieldDef[] = [],
): SmsMergeValues {
  const firstName = longestFirstName(contacts.map((c) => c.firstName));
  const lastNames = contacts.map((c) => c.lastName.trim()).filter(Boolean);
  const lastName = lastNames.length
    ? lastNames.reduce((a, b) => (b.length > a.length ? b : a))
    : SMS_NOM_ESTIMATE_FALLBACK;
  const customFields: Record<string, string> = {};
  for (const def of defs) {
    let longest = "";
    for (const c of contacts) {
      const v = (c.customFields?.[def.id] ?? "").trim();
      if (v.length > longest.length) longest = v;
    }
    customFields[def.id] = longest || def.label.trim().slice(0, 12) || "x";
  }
  return {
    firstName,
    lastName,
    birthday: SMS_ANNIVERSAIRE_PREVIEW_ISO,
    customFields,
  };
}

export function previewMergeValues(
  defs: readonly CustomFieldDef[] = [],
): SmsMergeValues {
  const customFields: Record<string, string> = {};
  for (const def of defs) {
    customFields[def.id] = "Valeur";
  }
  return {
    firstName: SMS_PRENOM_PREVIEW_SAMPLE,
    lastName: SMS_NOM_PREVIEW_SAMPLE,
    birthday: SMS_ANNIVERSAIRE_PREVIEW_ISO,
    customFields,
  };
}

export function longestFirstName(names: readonly string[]): string {
  const trimmed = names.map((n) => n.trim()).filter(Boolean);
  if (!trimmed.length) return SMS_PRENOM_ESTIMATE_FALLBACK;
  return trimmed.reduce((longest, name) =>
    name.length > longest.length ? name : longest,
  );
}

export function buildCampaignRecipientIdSet(args: {
  contacts: ContactRowData[];
  recipientMode: "manual" | "lists" | "all" | "numbers";
  selectedContactIds: string[];
  selectedGroupNames: string[];
  excludedContactIds?: string[];
  /** Membres groupes résolus serveur (mode lists) — pas le scan lazy page. */
  resolvedGroupMemberIds?: readonly string[];
}): Set<string> {
  const {
    contacts,
    recipientMode,
    selectedContactIds,
    selectedGroupNames,
    excludedContactIds = [],
    resolvedGroupMemberIds,
  } = args;

  const ids = new Set<string>();

  if (recipientMode === "all") {
    for (const c of contacts) ids.add(c.id);
  } else if (recipientMode === "manual") {
    for (const id of selectedContactIds) ids.add(id);
  } else if (recipientMode === "lists") {
    for (const id of selectedContactIds) ids.add(id);
    if (resolvedGroupMemberIds != null && resolvedGroupMemberIds.length > 0) {
      for (const id of resolvedGroupMemberIds) ids.add(id);
    } else if (resolvedGroupMemberIds == null && selectedGroupNames.length > 0) {
      const wanted = new Set(
        selectedGroupNames.map((x) => x.trim().toLowerCase()),
      );
      for (const c of contacts) {
        if (c.groups.some((g) => wanted.has(g.trim().toLowerCase()))) {
          ids.add(c.id);
        }
      }
    }
  }

  for (const id of excludedContactIds) ids.delete(id);
  return ids;
}

export function resolveEligibleCampaignRecipients(args: {
  contacts: ContactRowData[];
  recipientMode: "manual" | "lists" | "all" | "numbers";
  selectedContactIds: string[];
  selectedGroupNames: string[];
  excludedContactIds?: string[];
  resolvedGroupMemberIds?: readonly string[];
}): ContactRowData[] {
  const { contacts, recipientMode } = args;

  if (recipientMode === "numbers") return [];

  const ids = buildCampaignRecipientIdSet(args);
  return contacts
    .filter((c) => ids.has(c.id))
    .filter((c) => c.optIn && !c.stopSms && isValidFrMobile(c.phone));
}

export type CampaignCreditsEstimate = {
  parts: number;
  totalCredits: number;
  indicative: boolean;
  hasPrenomTag: boolean;
  partsMin?: number;
  partsMax?: number;
};

/** Coût indicatif (étape 2) : valeurs d’estimation les plus longues. */
export function estimateCampaignCredits(
  message: string,
  recipientCount: number,
  firstNames: readonly string[],
  contacts: readonly Pick<
    ContactRowData,
    "firstName" | "lastName" | "birthday" | "customFields"
  >[] = [],
  defs: readonly CustomFieldDef[] = [],
): CampaignCreditsEstimate {
  const hasPrenomTag = containsKnownMergeTag(message, defs);
  const sample =
    contacts.length > 0
      ? buildEstimateMergeValues(contacts, defs)
      : buildEstimateMergeValues(
          firstNames.map((firstName) => ({
            firstName,
            lastName: "",
            birthday: "",
            customFields: {},
          })),
          defs,
        );
  const expanded = hasPrenomTag
    ? expandMergeTags(message, sample, defs)
    : message;
  const parts = analyzeSmsMessage(expanded).smsCount;
  return {
    parts,
    totalCredits: parts * Math.max(0, recipientCount),
    indicative: hasPrenomTag,
    hasPrenomTag,
  };
}

/** Coût définitif (étape 3) : somme des segments par destinataire. */
export function definitiveCampaignCredits(
  message: string,
  recipients: readonly Pick<
    ContactRowData,
    "firstName" | "lastName" | "birthday" | "customFields"
  >[],
  manualRecipientCount = 0,
  defs: readonly CustomFieldDef[] = [],
): CampaignCreditsEstimate {
  const hasPrenomTag = containsKnownMergeTag(message, defs);

  if (!hasPrenomTag) {
    const parts = analyzeSmsMessage(message).smsCount;
    const count = recipients.length + manualRecipientCount;
    return {
      parts,
      totalCredits: parts * count,
      indicative: false,
      hasPrenomTag: false,
    };
  }

  let totalCredits = 0;
  let partsMin = Infinity;
  let partsMax = 0;
  const empty: SmsMergeValues = {
    firstName: "",
    lastName: "",
    birthday: "",
    customFields: {},
  };

  for (const r of recipients) {
    const parts = analyzeSmsMessage(
      expandMergeTags(message, mergeValuesFromContact(r), defs),
    ).smsCount;
    totalCredits += parts;
    partsMin = Math.min(partsMin, parts);
    partsMax = Math.max(partsMax, parts);
  }

  if (manualRecipientCount > 0) {
    const parts = analyzeSmsMessage(
      expandMergeTags(message, empty, defs),
    ).smsCount;
    totalCredits += parts * manualRecipientCount;
    partsMin = Math.min(partsMin, parts);
    partsMax = Math.max(partsMax, parts);
  }

  if (totalCredits === 0) {
    return {
      parts: 0,
      totalCredits: 0,
      indicative: false,
      hasPrenomTag,
      partsMin: 0,
      partsMax: 0,
    };
  }

  return {
    parts: partsMax,
    totalCredits,
    indicative: false,
    hasPrenomTag,
    partsMin: partsMin === Infinity ? 0 : partsMin,
    partsMax,
  };
}

export function previewSmsMessage(
  message: string,
  defs: readonly CustomFieldDef[] = [],
): string {
  if (!message.trim()) return "";
  return expandMergeTags(message, previewMergeValues(defs), defs);
}
