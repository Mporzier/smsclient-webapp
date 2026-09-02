export type AppRoute =
  | "dashboard"
  | "contacts"
  | "groupes"
  | "campagnes"
  | "automatisations"
  | "statistiques"
  | "parametres"
  | "qr-boutique"
  | "liens"
  | "modeles-sms"
  | "reglementations-sms"
  | "aide"
  | "nouvelle-campagne"
  | "acheter-credits";

export const APP_ROUTES: AppRoute[] = [
  "dashboard",
  "contacts",
  "groupes",
  "campagnes",
  "automatisations",
  "statistiques",
  "parametres",
  "qr-boutique",
  "liens",
  "modeles-sms",
  "reglementations-sms",
  "aide",
  "nouvelle-campagne",
  "acheter-credits",
];

export function isAppRoute(s: string): s is AppRoute {
  return APP_ROUTES.includes(s as AppRoute);
}

export const ROUTE_TITLES: Record<AppRoute, string> = {
  dashboard: "Accueil",
  contacts: "Contacts",
  groupes: "Groupes",
  campagnes: "Campagnes",
  automatisations: "Automatisations",
  statistiques: "Statistiques",
  parametres: "Paramètres",
  "qr-boutique": "QR code boutique",
  liens: "Liens",
  "modeles-sms": "Modèles SMS",
  "reglementations-sms": "Réglementations SMS",
  aide: "Centre d'aide",
  "nouvelle-campagne": "Nouvelle campagne",
  "acheter-credits": "Acheter des crédits",
};

/** Nav item highlight: which sidebar key is “active”. Wizard = aucun item actif. */
export function navOverrideForRoute(route: AppRoute): string {
  if (isCampaignWizardRoute(route)) return "";
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
  if (h === "" || h === "home" || h === "features") return "dashboard";
  if (h === "soumettre-avis") return "dashboard";
  if (h === "nouvelle-campagne" || h.startsWith("nouvelle-campagne-")) {
    return "nouvelle-campagne";
  }
  if (isAppRoute(h)) return h;
  return "contacts";
}
