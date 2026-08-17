import type { ColumnSizingState } from "@tanstack/react-table";

/**
 * Poids relatifs pour la répartition initiale (% de la largeur liste).
 * Au resize manuel, DataTable peut dépasser 100 % (scroll horizontal).
 */
export const CONTACT_COL = {
  select: 40,
  avatar: 50,
  firstName: 130,
  lastName: 150,
  /** « 06 12 34 56 78 » + icône téléphone */
  phone: 160,
  /** 1–2 pastilles groupe */
  groups: 180,
  /** Champ perso (label dynamique) */
  customField: 130,
  notes: 120,
  lastSms: 160,
  /** Import CSV / QR / Manuel */
  source: 140,
  /** JJ/MM/AAAA court */
  created: 140,
  /** Menu … sticky droite — même largeur que select */
  actions: 40,
} as const;

export const GROUP_COL = {
  select: 40,
  avatar: 50,
  name: 180,
  description: 240,
  contactCount: 90,
  lastCampaign: 160,
  created: 130,
  /** Menu … sticky droite — même largeur que select */
  actions: 40,
} as const;

export const CAMPAIGN_COL = {
  created: 120,
  name: 220,
  recipients: 110,
  status: 120,
  send: 160,
  credits: 100,
  /** Menu … sticky droite — même largeur que select contacts */
  actions: 40,
} as const;

export const LINK_COL = {
  created: 130,
  label: 140,
  originalUrl: 220,
  shortUrl: 168,
  clickCount: 56,
  /** Menu … sticky droite — même largeur que select contacts */
  actions: 40,
} as const;

export const MODELE_SMS_COL = {
  created: 130,
  title: 140,
  description: 160,
  body: 280,
  actions: 48,
} as const;

export type ColumnWidthWeight = {
  id: string;
  weight: number;
  minSize: number;
  maxSize: number;
};

/** Répartit containerWidth selon les poids, en respectant min/max. */
export function distributeColumnWidths(
  columns: ColumnWidthWeight[],
  containerWidth: number
): ColumnSizingState {
  if (containerWidth <= 0 || columns.length === 0) return {};

  const weightSum = columns.reduce((s, c) => s + Math.max(1, c.weight), 0);
  const sizes = columns.map((c) => {
    const ideal = Math.round(
      (Math.max(1, c.weight) / weightSum) * containerWidth
    );
    return Math.min(c.maxSize, Math.max(c.minSize, ideal));
  });

  const sum = sizes.reduce((a, b) => a + b, 0);
  let diff = containerWidth - sum;
  let guard = 0;
  while (diff !== 0 && guard < containerWidth + 1000) {
    let stepped = false;
    for (let i = 0; i < columns.length; i++) {
      if (diff === 0) break;
      const col = columns[i]!;
      if (diff > 0 && sizes[i]! < col.maxSize) {
        sizes[i]! += 1;
        diff -= 1;
        stepped = true;
      } else if (diff < 0 && sizes[i]! > col.minSize) {
        sizes[i]! -= 1;
        diff += 1;
        stepped = true;
      }
    }
    if (!stepped) break;
    guard += 1;
  }

  const out: ColumnSizingState = {};
  columns.forEach((c, i) => {
    out[c.id] = sizes[i]!;
  });
  return out;
}
