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

export function normalizeFRPhone(v: string): string {
  let s = v.trim().replace(/[^0-9+]/g, "");
  if (s.startsWith("+33")) s = "0" + s.slice(3);
  const digits = s.replace(/[^0-9]/g, "");
  if (digits.length === 10 && digits.startsWith("0")) {
    return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  }
  return s;
}
