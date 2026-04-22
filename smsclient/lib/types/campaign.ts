export type SmsCampaignStatus = "draft" | "scheduled" | "sent" | "failed" | "cancelled";

/** Ligne liste Campagnes (dérivée de `public.sms_campaigns`). */
export type CampaignRowData = {
  id: string;
  createdLabel: string;
  name: string;
  recipients: number;
  status: SmsCampaignStatus;
  /** Texte d’affichage : date d’envoi, programmation, ou "—" */
  sendLabel: string;
  creditsLabel: string;
};
