import type { ContactFormSubmitPayload } from "@/lib/supabase/clients";
import { normalizeCustomFieldValue } from "@/lib/customFields/validate";
import {
  coerceFrPhoneForImport,
  isValidFrMobile,
  normalizeFRPhone,
} from "@/lib/proto/smsUtils";
import type { CustomFieldDef } from "@/lib/types/customFields";

export type FixedImportColumnRole =
  | "skip"
  | "phone"
  | "first_name"
  | "last_name";

export type ImportColumnRole = FixedImportColumnRole | `custom:${string}`;

export const FIXED_IMPORT_ROLE_LABELS: Record<FixedImportColumnRole, string> = {
  skip: "Sélectionner…",
  phone: "Téléphone (obligatoire)",
  first_name: "Prénom",
  last_name: "Nom",
};

/** @deprecated Prefer FIXED_IMPORT_ROLE_LABELS + buildImportRoleLabels */
export const IMPORT_ROLE_LABELS = FIXED_IMPORT_ROLE_LABELS;

export function isCustomImportRole(
  role: ImportColumnRole,
): role is `custom:${string}` {
  return role.startsWith("custom:");
}

export function customFieldIdFromRole(role: `custom:${string}`): string {
  return role.slice("custom:".length);
}

export function customImportRole(fieldId: string): `custom:${string}` {
  return `custom:${fieldId}`;
}

export function buildImportRoleLabels(
  defs: CustomFieldDef[],
): Record<string, string> {
  const labels: Record<string, string> = { ...FIXED_IMPORT_ROLE_LABELS };
  for (const def of defs) {
    labels[customImportRole(def.id)] = def.label;
  }
  return labels;
}

function normalizeHeaderKey(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Teste si une valeur brute est un mobile FR importable (même règles que l’insert). */
export function looksLikeFrPhone(raw: string): boolean {
  const phoneDisplay = normalizeFRPhone(coerceFrPhoneForImport(raw));
  return Boolean(phoneDisplay && isValidFrMobile(phoneDisplay));
}

/** Formate un numéro FR en "06 12 34 56 78" (+33 / 0033 → 0X). Brut si non-parsable. */
export function formatFrPhoneDisplay(raw: string): string {
  const coerced = coerceFrPhoneForImport(raw);
  const normalized = normalizeFRPhone(coerced);
  if (normalized && isValidFrMobile(normalized)) {
    return normalized;
  }
  const compact = coerced.replace(/[\s.\-()]/g, "");
  let digits: string;
  if (compact.startsWith("+33")) digits = `0${compact.slice(3)}`;
  else if (compact.startsWith("0033")) digits = `0${compact.slice(4)}`;
  else if (/^33[67]\d{8}$/.test(compact)) digits = `0${compact.slice(2)}`;
  else if (/^[67]\d{8}$/.test(compact)) digits = `0${compact}`;
  else digits = compact;

  if (/^0[67]\d{8}$/.test(digits)) {
    return digits.replace(
      /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
      "$1 $2 $3 $4 $5",
    );
  }
  return raw;
}

/** Suggestion selon l'intitulé de colonne + détection par contenu (numéros FR). */
export function suggestColumnRoles(
  headers: string[],
  rows?: string[][],
  defs: CustomFieldDef[] = [],
): ImportColumnRole[] {
  let phoneAssigned = false;
  const usedCustom = new Set<string>();
  const roles: ImportColumnRole[] = headers.map((h) => {
    const x = normalizeHeaderKey(h);

    if (
      /tel|phone|mobile|portable|gsm|numero|n°|no\s*tel/.test(x) &&
      !/nom/.test(x)
    ) {
      if (phoneAssigned) return "skip";
      phoneAssigned = true;
      return "phone";
    }
    if (/prenom|firstname|first\s*name/.test(x)) return "first_name";
    if (
      /^nom$|^lastname|last\s*name|family|nom\s*famille/.test(x) ||
      (/nom/.test(x) && !/groupe|entreprise|societe|company/.test(x))
    ) {
      return "last_name";
    }

    for (const def of defs) {
      if (usedCustom.has(def.id)) continue;
      if (normalizeHeaderKey(def.label) === x) {
        usedCustom.add(def.id);
        return customImportRole(def.id);
      }
    }
    return "skip";
  });

  if (!phoneAssigned && rows && rows.length > 0) {
    const sample = rows.slice(0, Math.min(20, rows.length));
    const need = Math.max(1, Math.ceil(sample.length * 0.5));
    for (let col = 0; col < headers.length; col++) {
      const matches = sample.filter(
        (row) => row[col] && looksLikeFrPhone(row[col]),
      ).length;
      if (matches >= need) {
        roles[col] = "phone";
        break;
      }
    }
  }

  return roles;
}

export function buildPayloadFromMappedRow(
  cells: string[],
  roles: ImportColumnRole[],
  defs: CustomFieldDef[] = [],
): ContactFormSubmitPayload | null {
  let phoneRaw = "";
  let firstName = "";
  let lastName = "";
  const customFields: Record<string, string> = {};
  const defById = new Map(defs.map((d) => [d.id, d]));

  const n = Math.min(cells.length, roles.length);
  for (let i = 0; i < n; i++) {
    const v = (cells[i] ?? "").trim();
    const role = roles[i];
    if (role === "phone") {
      phoneRaw = v;
      continue;
    }
    if (role === "first_name") {
      firstName = v;
      continue;
    }
    if (role === "last_name") {
      lastName = v;
      continue;
    }
    if (isCustomImportRole(role)) {
      const fieldId = customFieldIdFromRole(role);
      const def = defById.get(fieldId);
      if (!def) continue;
      if (!v) continue;
      const normalized = normalizeCustomFieldValue(v, def.fieldType);
      if (normalized === null) return null;
      if (normalized) customFields[fieldId] = normalized;
    }
  }

  const phoneDisplay = normalizeFRPhone(coerceFrPhoneForImport(phoneRaw));
  if (!phoneDisplay || !isValidFrMobile(phoneDisplay)) {
    return null;
  }

  return {
    firstName,
    lastName,
    phoneDisplay,
    groupLabels: [],
    birthday: "",
    notes: "",
    customFields,
    optIn: true,
    stop: false,
  };
}
