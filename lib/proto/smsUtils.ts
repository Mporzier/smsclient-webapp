import {
  analyzeSmsMessage,
  isGsm7Message,
  maxBillableCharacters,
  SMS_LIMITS,
  type SmsEncoding,
  type SmsMessageStats,
} from "@/lib/proto/smsEncoding";

export type { SmsEncoding, SmsMessageStats };
export { analyzeSmsMessage, isGsm7Message, maxBillableCharacters, SMS_LIMITS };

/** @deprecated Préférer `analyzeSmsMessage(text).encoding === "UNICODE"`. */
export function isUnicode(str: string): boolean {
  return !isGsm7Message(str);
}

export function smsPartsFor(text: string): number {
  return analyzeSmsMessage(text).smsCount;
}

export function formatInt(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Libellé lisible pour le nombre de SMS facturés par contact. */
export function formatSmsPartsPerContact(
  parts: number,
  partsMin?: number,
  partsMax?: number,
): string {
  if (partsMin != null && partsMax != null && partsMin !== partsMax) {
    return `${formatInt(partsMin)} à ${formatInt(partsMax)} SMS`;
  }
  const count = Math.max(0, parts);
  return count === 1 ? "1 SMS" : `${formatInt(count)} SMS`;
}

export function sanitizeSender(v: string): string {
  return v.toUpperCase().replace(/[^A-Z0-9 ]/g, "");
}

/**
 * Aplanit les formats qu’Excel/Sheets sort souvent (notation scientifique, décimale ,0, guillemets).
 * À utiliser en import CSV avant `normalizeFRPhone`.
 */
export function coerceFrPhoneForImport(raw: unknown): string {
  const s0 = String(raw ?? "").trim().replace(/^\uFEFF/, "");
  if (!s0) return "";
  let t = s0.replace(/^['’`"]+|['’`"]+$/g, "");
  t = t.replace(/[\s\u00a0\u2007\u202f]+/g, " ");
  const compact = t.replace(/\s/g, "");
  if (/[eE]/.test(compact)) {
    const withDotDecimal = t.replace(/,/g, (ch, i, str) => {
      const ei = str.toLowerCase().indexOf("e");
      if (ei < 0) return ch;
      return ch === "," && i < ei ? "." : ch;
    });
    const n = parseFloat(withDotDecimal);
    if (Number.isFinite(n) && n >= 6e6 && n < 1e11) {
      return String(Math.round(n));
    }
  }
  if (/^\d+([,.]0+)$/.test(compact) || /^\d+([,.]00+)$/.test(compact)) {
    return compact.split(/[,.]/)[0] ?? t;
  }
  return t;
}

function frPhoneDigitsOnly(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  // +33 / 0033 / 33… → national ; ne pas re-préfixer 0 si déjà présent (ex. +3306…).
  if (digits.startsWith("0033")) digits = digits.slice(4);
  else if (digits.startsWith("33") && digits.length >= 11) digits = digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(0, 10);
  if (digits.length === 9 && /^[67]/.test(digits)) return `0${digits}`;
  return digits.slice(0, 10);
}

/** Saisie progressive : 10 chiffres max, espaces tous les 2 (ex. 06 12 34 56 78). */
export function formatFrPhoneInput(raw: string): string {
  const digits = frPhoneDigitsOnly(raw);
  if (!digits) return "";
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ");
}

export function normalizeFRPhone(v: string): string {
  const formatted = formatFrPhoneInput(v);
  if (formatted) return formatted;

  let s = v.trim().replace(/^\uFEFF/, "");
  if (!s) return "";
  s = s.replace(/[\s\u00a0\u2007\u202f]/g, " ");
  s = s.replace(/[.\-]/g, " ");
  s = s.replace(/\((\s*0\s*)\)/g, " ");
  return s.replace(/[^0-9+]/g, "").length > 0 ? s : v.trim();
}

/** Mobile FR affiché (ex. 06 …) → +33… pour stockage / unique constraint */
export function frDisplayToE164(display: string): string | null {
  const d = frPhoneDigitsOnly(display);
  if (!/^0[67]\d{8}$/.test(d)) return null;
  return `+33${d.slice(1)}`;
}

export function e164ToFrDisplay(e164: string): string {
  if (e164.startsWith("+33")) {
    return normalizeFRPhone(`0${e164.slice(3)}`);
  }
  return e164;
}

/** Mobile FR uniquement (06 / 07), national ou +33 / 0033. */
export function isValidFrMobile(display: string): boolean {
  return /^0[67]\d{8}$/.test(frPhoneDigitsOnly(display));
}
