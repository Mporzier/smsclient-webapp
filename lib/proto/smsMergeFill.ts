import type { MergeTagKey } from "@/lib/proto/smsPersonalization";

export type MergeFillCounts = {
  total: number;
  prenom: number;
  nom: number;
  anniversaire: number;
  custom: Record<string, number>;
};

export const EMPTY_MERGE_FILL_COUNTS: MergeFillCounts = {
  total: 0,
  prenom: 0,
  nom: 0,
  anniversaire: 0,
  custom: {},
};

export type MergeFillStatus = "ready" | "loading" | "na" | "error";

export function filledCountForMergeKey(
  counts: MergeFillCounts,
  key: MergeTagKey,
): number {
  if (key === "prenom") return counts.prenom;
  if (key === "nom") return counts.nom;
  if (key === "anniversaire") return counts.anniversaire;
  if (key.startsWith("custom:")) {
    return counts.custom[key.slice("custom:".length)] ?? 0;
  }
  return 0;
}

/** `742/800 · 93%` — vide si total 0. */
export function formatMergeFillSuffix(
  filled: number,
  total: number,
): string {
  if (total <= 0) return "";
  const safe = Math.min(Math.max(0, filled), total);
  const pct = Math.round((safe / total) * 100);
  return `${safe}/${total} · ${pct}%`;
}
