/** Ton choisi dans Options IA (libellés produit). */
export type SmsAiMessageTone =
  | "default"
  | "chaleureux"
  | "direct"
  | "dynamique"
  | "urgent"
  | "promo"
  | "premium"
  | "festif"
  | "professionnel";

export const SMS_AI_MESSAGE_TONE_OPTIONS: {
  value: SmsAiMessageTone;
  label: string;
  hint: string;
}[] = [
  {
    value: "default",
    label: "Par défaut (neutre)",
    hint: "L’IA s’appuie sur votre consigne, sans ton marketing imposé.",
  },
  {
    value: "chaleureux",
    label: "Chaleureux",
    hint: "Accueillant, proche de vos clients.",
  },
  {
    value: "direct",
    label: "Direct",
    hint: "Court, clair, sans détour.",
  },
  {
    value: "dynamique",
    label: "Dynamique",
    hint: "Énergique, orienté action.",
  },
  {
    value: "urgent",
    label: "Urgent",
    hint: "FOMO, dernières heures, offre limitée.",
  },
  {
    value: "promo",
    label: "Promo",
    hint: "Offre chiffrée, bon plan, incitation rapide.",
  },
  {
    value: "premium",
    label: "Premium",
    hint: "Soigné, exclusif, image haut de gamme.",
  },
  {
    value: "festif",
    label: "Festif",
    hint: "Événement, fêtes, ambiance célébration.",
  },
  {
    value: "professionnel",
    label: "Professionnel",
    hint: "Formel, rassurant, B2B ou rendez-vous.",
  },
];

export const DEFAULT_SMS_AI_MESSAGE_TONE: SmsAiMessageTone = "default";

export function isSmsAiMarketingTone(tone: SmsAiMessageTone): boolean {
  return tone !== "default";
}

/** Paramètre `tone` de `generateAiVariants`. */
export function smsAiMessageToneToApi(tone: SmsAiMessageTone): string {
  switch (tone) {
    case "default":
      return "neutral";
    case "direct":
      return "direct";
    case "dynamique":
      return "energetic";
    case "urgent":
      return "urgent";
    case "promo":
      return "promo";
    case "premium":
      return "premium";
    case "festif":
      return "festive";
    case "professionnel":
      return "pro";
    case "chaleureux":
    default:
      return "amical";
  }
}
