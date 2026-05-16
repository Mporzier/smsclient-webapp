export type AppRoute =
  | "contacts"
  | "groupes"
  | "campagnes"
  | "statistiques"
  | "parametres"
  | "nouvelle-campagne-1"
  | "nouvelle-campagne-2"
  | "nouvelle-campagne-3"
  | "acheter-credits";

export const APP_ROUTES: AppRoute[] = [
  "contacts",
  "groupes",
  "campagnes",
  "statistiques",
  "parametres",
  "nouvelle-campagne-1",
  "nouvelle-campagne-2",
  "nouvelle-campagne-3",
  "acheter-credits",
];

export function isAppRoute(s: string): s is AppRoute {
  return APP_ROUTES.includes(s as AppRoute);
}

export const ROUTE_TITLES: Record<AppRoute, string> = {
  contacts: "Contacts",
  groupes: "Groupes",
  campagnes: "Campagnes",
  statistiques: "Statistiques",
  parametres: "Paramètres",
  "nouvelle-campagne-1": "Nouvelle campagne — Destinataires",
  "nouvelle-campagne-2": "Nouvelle campagne — Message",
  "nouvelle-campagne-3": "Nouvelle campagne — Confirmation",
  "acheter-credits": "Acheter des crédits",
};

/** Nav item highlight: which sidebar key is “active” */
export function navOverrideForRoute(route: AppRoute): string {
  if (route.startsWith("nouvelle-campagne-")) return "campagnes";
  return route;
}

export function parseHash(raw: string): AppRoute {
  const h = raw.replace(/^#/, "").trim();
  if (h === "" || h === "home" || h === "features") return "contacts";
  if (isAppRoute(h)) return h;
  return "contacts";
}
