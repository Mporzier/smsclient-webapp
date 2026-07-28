/** Option groupe pour sélection (ex. modale contact). */
export type ContactGroupOption = {
  name: string;
  contactCount: number;
};

/** Ligne affichée dans la vue Groupes. */
export type GroupRowData = {
  id: string;
  name: string;
  description: string;
  contactCount: number;
  lastCampaignLabel: string;
  /** ISO dernière campagne, null si aucune. */
  lastCampaignAt: string | null;
  createdLabel: string;
  /** ISO pour tri chronologique. */
  createdAt: string;
};
