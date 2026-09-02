import type { CampaignWizardStep } from "@/lib/proto/campaignWizardSession";

export type CampaignComposerPreset =
  | string
  | {
      contactIds?: string[];
      groupNames?: string[];
      /** Numéros bruts (séparateurs `\n`, `,`, `;`) — mode « numbers ». */
      manualNumbers?: string;
      title?: string;
      sender?: string;
      sms?: string;
      sendMode?: "now" | "sched";
      /** Ouvre directement cette étape (renvoi de campagne). */
      step?: CampaignWizardStep;
    };

export type PendingWizardLeaveAction =
  | { type: "navigate"; path: string; after?: () => void }
  | { type: "open"; preset?: CampaignComposerPreset };
