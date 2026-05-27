export const BUSINESS_ACTIVITIES = [
  { id: "fleuriste", label: "Fleuriste" },
  { id: "boulangerie", label: "Boulangerie / Pâtisserie" },
  { id: "tabac", label: "Tabac / Presse" },
  { id: "retail", label: "Commerce de détail" },
  { id: "restaurant", label: "Restaurant / Bar / Café" },
  { id: "coiffure", label: "Coiffure / Beauté" },
  { id: "sport", label: "Sport / Fitness" },
  { id: "sante", label: "Santé / Pharmacie" },
  { id: "automobile", label: "Automobile / Garage" },
  { id: "services", label: "Services aux particuliers" },
  { id: "autre", label: "Autre" },
] as const;

export type BusinessActivityId = (typeof BUSINESS_ACTIVITIES)[number]["id"];

export function businessActivityLabel(id: string): string {
  const label = BUSINESS_ACTIVITIES.find((a) => a.id === id)?.label;
  if (label) return label;
  const trimmed = id.trim();
  return trimmed || "—";
}

export function isValidBusinessActivityId(id: string): boolean {
  return BUSINESS_ACTIVITIES.some((a) => a.id === id);
}
