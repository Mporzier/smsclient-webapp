import type { CustomFieldType } from "@/lib/types/customFields";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Brouillon champ nombre : vide, `-`, digits, une virgule/point décimal.
 * Rejette lettres et `e`/`E` (type=number navigateur).
 */
export function isAllowedNumberFieldDraft(raw: string): boolean {
  return raw === "" || /^-?\d*([.,]\d*)?$/.test(raw);
}

/** Normalise / valide une valeur selon le type. Vide → "". Invalide → null. */
export function normalizeCustomFieldValue(
  raw: string,
  fieldType: CustomFieldType,
): string | null {
  const t = raw.trim();
  if (!t) return "";

  if (fieldType === "text") {
    return t.slice(0, 500);
  }

  if (fieldType === "number") {
    const normalized = t.replace(",", ".");
    if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
    const n = Number(normalized);
    if (!Number.isFinite(n)) return null;
    return String(n);
  }

  // date
  if (!DATE_RE.test(t)) return null;
  const [y, m, d] = t.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return t;
}

/** Affichage liste : date FR, sinon valeur brute (ou —). */
export function formatCustomFieldDisplay(
  value: string | undefined,
  fieldType: CustomFieldType,
): string {
  const v = (value ?? "").trim();
  if (!v) return "—";
  if (fieldType === "date" && DATE_RE.test(v)) {
    const [y, m, d] = v.split("-");
    return `${d}/${m}/${y}`;
  }
  return v;
}
