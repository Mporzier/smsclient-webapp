export type LandingScreen = "home" | "features";

export type AppRoute =
  | "contacts"
  | "groupes"
  | "campagnes"
  | "credits"
  | "statistiques"
  | "parametres"
  | "deconnexion"
  | "nouvelle-campagne-1"
  | "nouvelle-campagne-2"
  | "nouvelle-campagne-3"
  | "nouvelle-campagne-4"
  | "nouvelle-campagne-5"
  | "ajouter-contact-1"
  | "ajouter-contact-2"
  | "creer-groupe-1"
  | "creer-groupe-2";

export const APP_ROUTES: AppRoute[] = [
  "contacts",
  "groupes",
  "campagnes",
  "credits",
  "statistiques",
  "parametres",
  "deconnexion",
  "nouvelle-campagne-1",
  "nouvelle-campagne-2",
  "nouvelle-campagne-3",
  "nouvelle-campagne-4",
  "nouvelle-campagne-5",
  "ajouter-contact-1",
  "ajouter-contact-2",
  "creer-groupe-1",
  "creer-groupe-2",
];

export function isAppRoute(s: string): s is AppRoute {
  return APP_ROUTES.includes(s as AppRoute);
}

export const ROUTE_TITLES: Record<AppRoute, string> = {
  contacts: "Contacts",
  groupes: "Groupes",
  campagnes: "Campagnes",
  credits: "Crédits",
  statistiques: "Statistiques",
  parametres: "Paramètres",
  deconnexion: "Déconnexion",
  "nouvelle-campagne-1": "Nouvelle campagne — Infos",
  "nouvelle-campagne-2": "Nouvelle campagne — Destinataires",
  "nouvelle-campagne-3": "Nouvelle campagne — Message",
  "nouvelle-campagne-4": "Nouvelle campagne — Prévisualisation",
  "nouvelle-campagne-5": "Nouvelle campagne — Envoi",
  "ajouter-contact-1": "Ajouter un contact — Informations",
  "ajouter-contact-2": "Ajouter un contact — Vérification",
  "creer-groupe-1": "Créer un groupe — Informations",
  "creer-groupe-2": "Créer un groupe — Contacts",
};

/** Nav item highlight: which sidebar key is “active” */
export function navOverrideForRoute(route: AppRoute): string {
  if (route.startsWith("nouvelle-campagne-")) return "campagnes";
  if (route.startsWith("ajouter-contact-")) return "contacts";
  if (route.startsWith("creer-groupe-")) return "groupes";
  return route;
}

export function parseHash(raw: string): {
  landing: LandingScreen | null;
  route: AppRoute;
} {
  const h = raw.replace(/^#/, "").trim();
  if (h === "" || h === "home") return { landing: "home", route: "contacts" };
  if (h === "features") return { landing: "features", route: "contacts" };
  if (h === "ajouter-contact-3")
    return { landing: null, route: "ajouter-contact-2" };
  if (isAppRoute(h)) return { landing: null, route: h };
  return { landing: null, route: "contacts" };
}
