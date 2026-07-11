import type { QrWheelConfig, QrWheelSegment } from "@/lib/types/qrWheel";

const WHEEL_COLOR_PALETTE = [
  "#4a86ff",
  "#2f6fed",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#38bdf8",
  "#fb7185",
  "#fbbf24",
] as const;

export function randomWheelColor(used: string[] = []): string {
  const available = WHEEL_COLOR_PALETTE.filter((color) => !used.includes(color));
  const pool = available.length > 0 ? available : [...WHEEL_COLOR_PALETTE];
  return pool[Math.floor(Math.random() * pool.length)] ?? "#4a86ff";
}

export function randomizeSegmentColors<T extends Pick<QrWheelSegment, "color">>(
  segments: T[],
): T[] {
  const used: string[] = [];
  return segments.map((segment) => {
    const color = randomWheelColor(used);
    used.push(color);
    return { ...segment, color };
  });
}

/** Segments par défaut à l’activation (poids = parts sur 100). */
export function defaultWheelSegments(): Omit<QrWheelSegment, "id">[] {
  const segments: Omit<QrWheelSegment, "id">[] = [
    {
      sortOrder: 0,
      label: "5 % de réduction",
      probabilityWeight: 12,
      isLosing: false,
      screenMessage: "Bravo ! Vous gagnez 5 % de réduction sur votre prochain achat.",
      smsMessage:
        "Félicitations {prenom} ! Vous avez gagné 5 % de réduction. Présentez ce SMS en boutique.",
      color: "#4a86ff",
    },
    {
      sortOrder: 1,
      label: "10 % de réduction",
      probabilityWeight: 6,
      isLosing: false,
      screenMessage: "Super ! 10 % de réduction pour vous.",
      smsMessage:
        "Félicitations {prenom} ! Vous avez gagné 10 % de réduction. Valable en boutique.",
      color: "#2f6fed",
    },
    {
      sortOrder: 2,
      label: "Un cadeau offert",
      probabilityWeight: 4,
      isLosing: false,
      screenMessage: "Vous avez gagné un cadeau offert !",
      smsMessage:
        "{prenom}, vous avez gagné un cadeau offert ! Venez le récupérer en boutique.",
      color: "#0ea5e9",
    },
    {
      sortOrder: 3,
      label: "Un produit offert",
      probabilityWeight: 3,
      isLosing: false,
      screenMessage: "Un produit offert vous attend en boutique.",
      smsMessage:
        "{prenom}, vous avez gagné un produit offert. Présentez ce SMS en caisse.",
      color: "#38bdf8",
    },
    {
      sortOrder: 4,
      label: "Livraison offerte",
      probabilityWeight: 5,
      isLosing: false,
      screenMessage: "Livraison offerte sur votre prochaine commande !",
      smsMessage:
        "{prenom}, vous avez gagné la livraison offerte. Profitez-en vite !",
      color: "#7dd3fc",
    },
    {
      sortOrder: 5,
      label: "Retentez votre chance",
      probabilityWeight: 70,
      isLosing: true,
      screenMessage: "Pas de chance cette fois… Retentez votre chance une prochaine fois !",
      smsMessage: "",
      color: "#94a3b8",
    },
  ];
  return randomizeSegmentColors(segments);
}

export function totalWheelWeight(
  segments: Pick<QrWheelSegment, "probabilityWeight">[],
): number {
  return segments.reduce((s, x) => s + x.probabilityWeight, 0);
}

/** Répartit 100 % équitablement entre les cases (reste +1 % sur les premières). */
export function distributeEqualWheelPercents(
  segments: QrWheelSegment[],
): QrWheelSegment[] {
  if (segments.length === 0) return segments;
  const base = Math.floor(100 / segments.length);
  const remainder = 100 - base * segments.length;
  return segments.map((segment, index) => ({
    ...segment,
    probabilityWeight: base + (index < remainder ? 1 : 0),
  }));
}

export function defaultPercentForNewSegment(
  segments: Pick<QrWheelSegment, "probabilityWeight">[],
): number {
  const used = totalWheelWeight(segments);
  const remaining = 100 - used;
  if (remaining >= 5) return remaining;
  if (remaining >= 1) return remaining;
  return 5;
}

export function qrWheelConfigsEqual(a: QrWheelConfig, b: QrWheelConfig): boolean {
  if (
    a.title.trim() !== b.title.trim() ||
    a.subtitle.trim() !== b.subtitle.trim() ||
    a.allowRepeat !== b.allowRepeat ||
    a.prizeValidityDays !== b.prizeValidityDays ||
    a.sendPrizeSms !== b.sendPrizeSms ||
    a.segments.length !== b.segments.length
  ) {
    return false;
  }

  return a.segments.every((seg, i) => {
    const other = b.segments[i];
    if (!other) return false;
    return (
      seg.id === other.id &&
      seg.label.trim() === other.label.trim() &&
      seg.probabilityWeight === other.probabilityWeight &&
      seg.isLosing === other.isLosing &&
      seg.screenMessage.trim() === other.screenMessage.trim() &&
      seg.smsMessage.trim() === other.smsMessage.trim() &&
      seg.color === other.color
    );
  });
}
