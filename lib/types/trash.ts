export type DeletedContactRow = {
  id: string;
  name: string;
  phone: string;
  groupsLabel: string;
  deletedLabel: string;
  expiresLabel: string;
};

export type DeletedGroupRow = {
  id: string;
  name: string;
  description: string;
  contactCount: number;
  deletedLabel: string;
  expiresLabel: string;
};
