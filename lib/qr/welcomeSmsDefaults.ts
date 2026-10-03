import { SMS_PRENOM_TAG } from "@/lib/proto/smsPersonalization";

const FALLBACK_COMPANY_LABEL = "votre commerce";

export function buildDefaultQrWelcomeSmsTemplate(companyName: string): string {
  const company = companyName.trim() || FALLBACK_COMPANY_LABEL;
  return `Bienvenue, ${SMS_PRENOM_TAG} ! Bienvenue chez ${company} ! Nous sommes ravis de vous avoir parmi nous.`;
}

/** Fallback UI when le template DB n'est pas encore chargé (nom entreprise inconnu). */
export const DEFAULT_QR_WELCOME_SMS_TEMPLATE =
  buildDefaultQrWelcomeSmsTemplate(FALLBACK_COMPANY_LABEL);
