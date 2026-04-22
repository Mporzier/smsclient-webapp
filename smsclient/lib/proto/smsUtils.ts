export const SELECTED_CONTACTS = 1284;

export function isUnicode(str: string): boolean {
  for (const ch of str) {
    if ((ch.codePointAt(0) ?? 0) > 127) return true;
  }
  return false;
}

export function smsPartsFor(text: string): number {
  const unicode = isUnicode(text);
  const per = unicode ? 70 : 160;
  const len = [...text].length;
  return Math.max(1, Math.ceil(len / per));
}

export function formatInt(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
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

export function normalizeFRPhone(v: string): string {
  let s = v.trim().replace(/^\uFEFF/, "");
  s = s.replace(/[\s\u00a0\u2007\u202f]/g, " ");
  s = s.replace(/[.\-]/g, " ");
  s = s.replace(/\((\s*0\s*)\)/g, " ");
  s = s.replace(/[^0-9+]/g, "");
  if (s.startsWith("0033")) s = "0" + s.slice(4);
  else if (s.startsWith("+33")) s = "0" + s.slice(3);

  let digits = s.replace(/[^0-9]/g, "");
  if (digits.length === 11 && digits.startsWith("33")) {
    digits = "0" + digits.slice(2);
  } else if (digits.length === 9 && /^[6-7]/.test(digits)) {
    digits = "0" + digits;
  }
  if (digits.length === 10 && digits.startsWith("0")) {
    return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  }
  return s.length > 0 ? s : v.trim();
}

/** Mobile FR affiché (ex. 06 …) → +33… pour stockage / unique constraint */
export function frDisplayToE164(display: string): string | null {
  const compact = display.replace(/[^\d+]/g, "");
  if (compact.startsWith("+33") && compact.length === 12) {
    return compact;
  }
  let d = display.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("33")) {
    d = "0" + d.slice(2);
  } else if (d.length === 9 && /^[6-7]/.test(d)) {
    d = "0" + d;
  }
  if (d.length === 10 && d.startsWith("0")) {
    return `+33${d.slice(1)}`;
  }
  return null;
}

export function e164ToFrDisplay(e164: string): string {
  if (e164.startsWith("+33")) {
    return normalizeFRPhone(`0${e164.slice(3)}`);
  }
  return e164;
}

export function isValidFrMobile(display: string): boolean {
  const d = display.replace(/\D/g, "");
  return d.length === 10 && d.startsWith("0");
}
