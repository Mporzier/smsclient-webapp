import type { ContactFormSubmitPayload } from "@/lib/supabase/clients";
import {
  coerceFrPhoneForImport,
  isValidFrMobile,
  normalizeFRPhone,
} from "@/lib/proto/smsUtils";

export type ImportColumnRole =
  | "skip"
  | "phone"
  | "first_name"
  | "last_name";

export const IMPORT_ROLE_LABELS: Record<ImportColumnRole, string> = {
  skip: "Sélectionner…",
  phone: "Téléphone (obligatoire)",
  first_name: "Prénom",
  last_name: "Nom",
};

const FR_PHONE_RE = /^(?:\+33|0033|0)[67]\d{8}$|^[67]\d{8}$/;

/** Teste si une valeur brute ressemble à un numéro de mobile français. */
export function looksLikeFrPhone(raw: string): boolean {
  const cleaned = raw.replace(/[\s.\-()]/g, "");
  return FR_PHONE_RE.test(cleaned);
}

/** Formate un numéro FR en "06 12 34 56 78". Retourne la valeur brute si non-parsable. */
export function formatFrPhoneDisplay(raw: string): string {
  const cleaned = raw.replace(/[\s.\-()]/g, "");
  let digits: string;
  if (cleaned.startsWith("+33")) digits = "0" + cleaned.slice(3);
  else if (cleaned.startsWith("0033")) digits = "0" + cleaned.slice(4);
  else if (/^[67]\d{8}$/.test(cleaned)) digits = "0" + cleaned;
  else digits = cleaned;

  if (/^0[67]\d{8}$/.test(digits)) {
    return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
  }
  return raw;
}

/** Suggestion selon l'intitulé de colonne + détection par contenu (numéros FR). */
export function suggestColumnRoles(
  headers: string[],
  rows?: string[][],
): ImportColumnRole[] {
  const roles: ImportColumnRole[] = headers.map((h) => {
    const x = h
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/\s+/g, " ")
      .trim();

    if (
      /tel|phone|mobile|portable|gsm|numero|n°|no\s*tel/.test(x) &&
      !/nom/.test(x)
    ) {
      return "phone";
    }
    if (/prenom|firstname|first\s*name/.test(x)) return "first_name";
    if (
      /^nom$|^lastname|last\s*name|family|nom\s*famille/.test(x) ||
      (/nom/.test(x) && !/groupe|entreprise|societe|company/.test(x))
    ) {
      return "last_name";
    }
    return "skip";
  });

  if (!roles.includes("phone") && rows && rows.length > 0) {
    const sample = rows.slice(0, Math.min(5, rows.length));
    for (let col = 0; col < headers.length; col++) {
      const matches = sample.filter(
        (row) => row[col] && looksLikeFrPhone(row[col]),
      ).length;
      if (matches >= Math.ceil(sample.length * 0.6)) {
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
): ContactFormSubmitPayload | null {
  let phoneRaw = "";
  let firstName = "";
  let lastName = "";

  const n = Math.min(cells.length, roles.length);
  for (let i = 0; i < n; i++) {
    const v = (cells[i] ?? "").trim();
    switch (roles[i]) {
      case "phone":
        phoneRaw = v;
        break;
      case "first_name":
        firstName = v;
        break;
      case "last_name":
        lastName = v;
        break;
      default:
        break;
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
    optIn: true,
    stop: false,
  };
}
