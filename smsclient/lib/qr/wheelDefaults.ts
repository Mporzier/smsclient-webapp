import type { QrWheelSegment } from "@/lib/types/qrWheel";

/** Segments par défaut à l’activation (poids = parts sur 100). */
export function defaultWheelSegments(): Omit<QrWheelSegment, "id">[] {
  return [
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
}

export function totalWheelWeight(
  segments: Pick<QrWheelSegment, "probabilityWeight">[],
): number {
  return segments.reduce((s, x) => s + x.probabilityWeight, 0);
}
