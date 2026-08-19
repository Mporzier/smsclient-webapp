export type CampaignComposerPreset =
  | string
  | { contactIds?: string[]; groupNames?: string[] };

export type PendingWizardLeaveAction =
  | { type: "navigate"; path: string; after?: () => void }
  | { type: "open"; preset?: CampaignComposerPreset };
