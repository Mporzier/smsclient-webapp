export type CustomFieldType = "text" | "number" | "date";

export type CustomFieldDef = {
  id: string;
  label: string;
  fieldType: CustomFieldType;
  sortOrder: number;
  createdAt: string;
};

/** Clés = id de définition ; valeurs toujours string normalisée. */
export type CustomFieldValues = Record<string, string>;

export const CUSTOM_FIELD_MAX_PER_ACCOUNT = 15;

export const CUSTOM_FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: "Texte",
  number: "Nombre",
  date: "Date",
};
