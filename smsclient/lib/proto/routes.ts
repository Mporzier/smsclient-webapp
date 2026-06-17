export type AppRoute =
  | "contacts"
  | "groupes"
  | "campagnes"
  | "automatisations"
  | "statistiques"
  | "parametres"
  | "qr-boutique"
  | "liens"
  | "reglementations-sms"
  | "soumettre-avis"
  | "nouvelle-campagne"
  | "acheter-credits";

export const APP_ROUTES: AppRoute[] = [
  "contacts",
  "groupes",
  "campagnes",
  "automatisations",
  "statistiques",
  "parametres",
  "qr-boutique",
  "liens",
  "reglementations-sms",
  "soumettre-avis",
  "nouvelle-campagne",
  "acheter-credits",
];

export function isAppRoute(s: string): s is AppRoute {
  return APP_ROUTES.includes(s as AppRoute);
}

export const ROUTE_TITLES: Record<AppRoute, string> = {
  contacts: "Contacts",
  groupes: "Groupes",
  campagnes: "Campagnes",
  automatisations: "Automatisations",
  statistiques: "Statistiques",
  parametres: "Paramètres",
  "qr-boutique": "QR code boutique",
  liens: "Liens",
  "reglementations-sms": "Réglementations SMS",
  "soumettre-avis": "Soumettre un avis",
  "nouvelle-campagne": "Nouvelle campagne",
  "acheter-credits": "Acheter des crédits",
};

/** Nav item highlight: which sidebar key is “active” */
export function navOverrideForRoute(route: AppRoute): string {
  if (isCampaignWizardRoute(route)) return "campagnes";
  return route;
}

export function isCampaignWizardRoute(route: AppRoute): boolean {
  return route === "nouvelle-campagne";
}

/** Anciennes URLs (#nouvelle-campagne-1/2/3) pour redirection au rechargement. */
export function parseLegacyCampaignWizardStep(raw: string): 1 | 2 | 3 | null {
  const h = raw.replace(/^#/, "").trim();
  if (h === "nouvelle-campagne-1") return 1;
  if (h === "nouvelle-campagne-2") return 2;
  if (h === "nouvelle-campagne-3") return 3;
  return null;
}

export function parseHash(raw: string): AppRoute {
  const h = raw.replace(/^#/, "").trim();
  if (h === "" || h === "home" || h === "features") return "contacts";
  if (h === "nouvelle-campagne" || h.startsWith("nouvelle-campagne-")) {
    return "nouvelle-campagne";
  }
  if (isAppRoute(h)) return h;
  return "contacts";
}
