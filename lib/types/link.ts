import type { SmsLinkIconId } from "@/lib/proto/smsLinkIcons";

export type LinkRowData = {
  id: string;
  icon: SmsLinkIconId;
  label: string;
  description: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  clickCount: number;
  /** Date seule — affichage liste */
  createdDateLabel: string;
  /** Heure seule — sous la date */
  createdTimeLabel: string;
  /** Date + heure — filtres / tri */
  createdLabel: string;
  campaignId: string | null;
};
