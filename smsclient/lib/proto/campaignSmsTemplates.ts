import { SMS_PRENOM_TAG } from "@/lib/proto/smsPersonalization";

export type CampaignSmsTemplate = {
  id: string;
  title: string;
  description: string;
  body: string;
};

export const CAMPAIGN_SMS_TEMPLATES: CampaignSmsTemplate[] = [
  {
    id: "promo",
    title: "Promotion",
    description: "Annonce une offre limitée en boutique.",
    body: `Bonjour ${SMS_PRENOM_TAG}, profitez de -20 % cette semaine en boutique ! Présentez ce SMS en caisse. STOP 36000`,
  },
  {
    id: "event",
    title: "Événement",
    description: "Invite vos clients à un moment spécial.",
    body: `Bonjour ${SMS_PRENOM_TAG}, vous êtes invité(e) à notre événement samedi de 10h à 18h. Répondez STOP pour ne plus recevoir de SMS.`,
  },
  {
    id: "relaunch",
    title: "Relance",
    description: "Fait revenir des clients inactifs.",
    body: `${SMS_PRENOM_TAG}, ça fait longtemps ! Revenez nous voir et bénéficiez d'une surprise en boutique. STOP 36000`,
  },
  {
    id: "thanks",
    title: "Remerciement",
    description: "Remercie après un achat ou une visite.",
    body: `Merci ${SMS_PRENOM_TAG} pour votre visite ! N'hésitez pas à revenir bientôt. STOP 36000`,
  },
];
