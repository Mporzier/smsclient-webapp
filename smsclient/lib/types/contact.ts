/** Ligne affichée dans la liste Contacts (clients + segments via `client_group_members`). */
export type ContactRowData = {
  id: string;
  created: string;
  firstName: string;
  lastName: string;
  /** Prénom + nom pour affichage tableau */
  name: string;
  phone: string;
  /** Segments (`client_groups`) auxquels le contact est rattaché */
  groups: string[];
  lastSms: string;
  source: string;
  optIn: boolean;
  stopSms: boolean;
  tag?: string;
};

/** Texte unique pour colonne / recherche (groupes triés, « Non classé » si vide). */
export function formatContactGroups(groups: string[]): string {
  const g = [...new Set(groups.map((x) => x.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
  return g.length ? g.join(", ") : "Non classé";
}
