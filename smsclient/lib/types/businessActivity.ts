export const BUSINESS_ACTIVITIES = [
  { id: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { id: "bar", label: "Bar / Café", emoji: "🍸" },
  { id: "coiffure", label: "Coiffeur / Beauté", emoji: "💇" },
  { id: "fleuriste", label: "Fleuriste", emoji: "💐" },
  { id: "boulangerie", label: "Boulangerie / Pâtisserie", emoji: "🥐" },
  { id: "retail", label: "Commerce de détail", emoji: "🛍️" },
  { id: "tabac", label: "Tabac / Presse", emoji: "📰" },
  { id: "sport", label: "Sport / Fitness", emoji: "🏋️" },
  { id: "sante", label: "Santé / Pharmacie", emoji: "💊" },
  { id: "automobile", label: "Automobile / Garage", emoji: "🚗" },
  { id: "services", label: "Services aux particuliers", emoji: "🔧" },
  { id: "autre", label: "Autres", emoji: "✨" },
] as const;

export type BusinessActivityId = (typeof BUSINESS_ACTIVITIES)[number]["id"];

export type BusinessActivity = (typeof BUSINESS_ACTIVITIES)[number];

export function businessActivityLabel(id: string): string {
  const label = BUSINESS_ACTIVITIES.find((a) => a.id === id)?.label;
  if (label) return label;
  const trimmed = id.trim();
  return trimmed || "—";
}

export function isValidBusinessActivityId(id: string): boolean {
  return BUSINESS_ACTIVITIES.some((a) => a.id === id);
}
