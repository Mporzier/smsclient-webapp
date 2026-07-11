import { analyzeSmsMessage } from "@/lib/proto/smsEncoding";
import { isValidFrMobile } from "@/lib/proto/smsUtils";
import type { ContactRowData } from "@/lib/types/contact";

/** Balise visuelle insérée dans le composer. */
export const SMS_PRENOM_TAG = "⟦prénom⟧";

/** Aperçu iPhone : prénom d’exemple. */
export const SMS_PRENOM_PREVIEW_SAMPLE = "Marie";

/** Estimation étape 2 si aucun prénom connu (saisie manuelle). */
export const SMS_PRENOM_ESTIMATE_FALLBACK = "Prénom";

const PRENOM_TOKEN_RE =
  /⟦prénom⟧|\{PRENOM\}|\{prenom\}|\{\{prenom\}\}/gi;

export function containsPrenomTag(text: string): boolean {
  PRENOM_TOKEN_RE.lastIndex = 0;
  return PRENOM_TOKEN_RE.test(text);
}

export function normalizePrenomTokens(text: string): string {
  return text.replace(PRENOM_TOKEN_RE, SMS_PRENOM_TAG);
}

export function expandPrenomTag(text: string, firstName: string): string {
  PRENOM_TOKEN_RE.lastIndex = 0;
  return text.replace(PRENOM_TOKEN_RE, firstName.trim());
}

export function removePrenomTag(text: string): string {
  PRENOM_TOKEN_RE.lastIndex = 0;
  return text
    .replace(PRENOM_TOKEN_RE, "")
    .replace(/\s{2,}/g, " ")
    .replace(/,\s*,/g, ",")
    .replace(/^,\s*/g, "")
    .replace(/\s+,/g, ",")
    .trim();
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
}): Set<string> {
  const {
    contacts,
    recipientMode,
    selectedContactIds,
    selectedGroupNames,
    excludedContactIds = [],
  } = args;

  const ids = new Set<string>();

  if (recipientMode === "all") {
    for (const c of contacts) ids.add(c.id);
  } else if (recipientMode === "manual") {
    for (const id of selectedContactIds) ids.add(id);
  } else if (recipientMode === "lists") {
    for (const id of selectedContactIds) ids.add(id);
    if (selectedGroupNames.length > 0) {
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

/** Coût indicatif (étape 2) : prénom le plus long parmi les destinataires. */
export function estimateCampaignCredits(
  message: string,
  recipientCount: number,
  firstNames: readonly string[],
): CampaignCreditsEstimate {
  const hasPrenomTag = containsPrenomTag(message);
  const expanded = hasPrenomTag
    ? expandPrenomTag(message, longestFirstName(firstNames))
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
  recipients: readonly Pick<ContactRowData, "firstName">[],
  manualRecipientCount = 0,
): CampaignCreditsEstimate {
  const hasPrenomTag = containsPrenomTag(message);

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

  for (const r of recipients) {
    const parts = analyzeSmsMessage(
      expandPrenomTag(message, r.firstName),
    ).smsCount;
    totalCredits += parts;
    partsMin = Math.min(partsMin, parts);
    partsMax = Math.max(partsMax, parts);
  }

  if (manualRecipientCount > 0) {
    const parts = analyzeSmsMessage(expandPrenomTag(message, "")).smsCount;
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

export function previewSmsMessage(message: string): string {
  if (!message.trim()) return "";
  return expandPrenomTag(message, SMS_PRENOM_PREVIEW_SAMPLE);
}
