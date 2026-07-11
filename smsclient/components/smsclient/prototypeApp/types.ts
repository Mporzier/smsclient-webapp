export type CampaignComposerPreset =
  | string
  | { contactIds?: string[]; groupNames?: string[] };

export type PendingWizardLeaveAction =
  | { type: "navigate"; path: string }
  | { type: "open"; preset?: CampaignComposerPreset };
