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
  | "last_name"
  | "group";

export const IMPORT_ROLE_LABELS: Record<ImportColumnRole, string> = {
  skip: "— Ignorer",
  phone: "Téléphone (obligatoire)",
  first_name: "Prénom",
  last_name: "Nom",
  group: "Groupe",
};

/** Suggestion simple selon l’intitulé de colonne (FR / EN courants). */
export function suggestColumnRoles(headers: string[]): ImportColumnRole[] {
  return headers.map((h) => {
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
    if (/groupe|group|categorie|segment/.test(x)) return "group";
    return "skip";
  });
}

export function buildPayloadFromMappedRow(
  cells: string[],
  roles: ImportColumnRole[],
): ContactFormSubmitPayload | null {
  let phoneRaw = "";
  let firstName = "";
  let lastName = "";
  let group = "";

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
      case "group":
        group = v;
        break;
      default:
        break;
    }
  }

  const phoneDisplay = normalizeFRPhone(coerceFrPhoneForImport(phoneRaw));
  if (!phoneDisplay || !isValidFrMobile(phoneDisplay)) {
    return null;
  }

  const g = group.trim();
  return {
    firstName,
    lastName,
    phoneDisplay,
    groupLabels: g ? [g] : [],
    notes: "",
    optIn: true,
    stop: false,
  };
}
