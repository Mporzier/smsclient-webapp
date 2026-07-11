import { SMS_PRENOM_TAG } from "@/lib/proto/smsPersonalization";
import {
  BUSINESS_ACTIVITIES,
  type BusinessActivityId,
  isValidBusinessActivityId,
} from "@/lib/types/businessActivity";

export type CampaignSmsTemplate = {
  id: string;
  title: string;
  description: string;
  body: string;
};

type TemplateDraft = {
  title: string;
  description: string;
  body: string;
};

function tpl(sector: BusinessActivityId, slug: string, draft: TemplateDraft): CampaignSmsTemplate {
  return { id: `${sector}-${slug}`, ...draft };
}


const CAMPAIGN_SMS_TEMPLATES_BY_ACTIVITY: Record<
  BusinessActivityId,
  CampaignSmsTemplate[]
> = {
  restaurant: [
    tpl("restaurant", "menu", {
      title: "Menu du jour",
      description: "Annonce le plat ou formule du jour.",
      body: `Bonjour ${SMS_PRENOM_TAG}, menu du jour : entrée + plat + dessert à 22 €. Réservez votre table !`,
    }),
    tpl("restaurant", "resa", {
      title: "Réservation week-end",
      description: "Incite à réserver pour un service chargé.",
      body: `${SMS_PRENOM_TAG}, places limitées ce week-end ! Réservez dès maintenant par téléphone ou en ligne.`,
    }),
    tpl("restaurant", "dejeuner", {
      title: "Promo déjeuner",
      description: "Offre midi en semaine.",
      body: `Bonjour ${SMS_PRENOM_TAG}, formule déjeuner à 15 € du lundi au vendredi, 12h-14h. On vous attend !`,
    }),
    tpl("restaurant", "soiree", {
      title: "Soirée thématique",
      description: "Invite à un dîner événement.",
      body: `${SMS_PRENOM_TAG}, soirée tapas samedi à partir de 19h ! Menu spécial et ambiance live. Réservez vite.`,
    }),
    tpl("restaurant", "relance", {
      title: "On vous manque",
      description: "Relance les clients absents.",
      body: `Bonjour ${SMS_PRENOM_TAG}, ça fait un moment ! Revenez dîner chez nous et profitez d'un apéritif offert.`,
    }),
    tpl("restaurant", "merci", {
      title: "Remerciement",
      description: "Remercie après une visite.",
      body: `Merci ${SMS_PRENOM_TAG} pour votre visite ! Au plaisir de vous accueillir à nouveau très bientôt.`,
    }),
  ],
  bar: [
    tpl("bar", "happy-hour", {
      title: "Happy hour",
      description: "Promo cocktails en début de soirée.",
      body: `${SMS_PRENOM_TAG}, happy hour ce soir 18h-20h : -30 % sur tous les cocktails !`,
    }),
    tpl("bar", "live", {
      title: "Soirée live",
      description: "Annonce un concert ou DJ set.",
      body: `Bonjour ${SMS_PRENOM_TAG}, concert live samedi dès 21h ! Entrée gratuite avant 22h.`,
    }),
    tpl("bar", "cocktail", {
      title: "Cocktail du mois",
      description: "Met en avant une création.",
      body: `${SMS_PRENOM_TAG}, découvrez notre cocktail signature du mois à 9 €. Venez le tester au bar !`,
    }),
    tpl("bar", "brunch", {
      title: "Brunch dominical",
      description: "Invite au brunch du week-end.",
      body: `Bonjour ${SMS_PRENOM_TAG}, brunch tous les dimanches 10h-15h. Formule à 24 €, réservation conseillée.`,
    }),
    tpl("bar", "relance", {
      title: "On vous attend",
      description: "Relance les habitués du bar.",
      body: `${SMS_PRENOM_TAG}, on ne vous a pas vu depuis un moment ! Passez prendre un verre, la première bière est à -50 %.`,
    }),
    tpl("bar", "merci", {
      title: "Remerciement",
      description: "Remercie après une visite.",
      body: `Merci ${SMS_PRENOM_TAG} pour votre visite ! À très vite au bar.`,
    }),
  ],
  coiffure: [
    tpl("coiffure", "coloration", {
      title: "Promo coloration",
      description: "Offre sur une prestation couleur.",
      body: `${SMS_PRENOM_TAG}, -20 % sur votre coloration en salon jusqu'à vendredi ! Prenez RDV par téléphone.`,
    }),
    tpl("coiffure", "creneaux", {
      title: "Créneaux disponibles",
      description: "Propose des rendez-vous libres.",
      body: `Bonjour ${SMS_PRENOM_TAG}, des créneaux sont disponibles cette semaine au salon. Réservez votre coupe !`,
    }),
    tpl("coiffure", "brushing", {
      title: "Offre brushing",
      description: "Promo sur le brushing ou le lissage.",
      body: `${SMS_PRENOM_TAG}, brushing à 25 € au lieu de 35 € en ce moment ! Offre limitée.`,
    }),
    tpl("coiffure", "fidelite", {
      title: "Carte fidélité",
      description: "Rappelle les avantages fidélité.",
      body: `Bonjour ${SMS_PRENOM_TAG}, votre carte fidélité vous offre -15 % sur votre prochaine visite au salon !`,
    }),
    tpl("coiffure", "relance", {
      title: "Rappel entretien",
      description: "Relance pour un nouveau rendez-vous.",
      body: `${SMS_PRENOM_TAG}, il est temps de prendre soin de votre chevelure ! Réservez votre prochain RDV au salon.`,
    }),
    tpl("coiffure", "merci", {
      title: "Remerciement",
      description: "Remercie après une prestation.",
      body: `Merci ${SMS_PRENOM_TAG} pour votre visite ! Vous êtes superbe, à très bientôt au salon.`,
    }),
  ],
  fleuriste: [
    tpl("fleuriste", "bouquet", {
      title: "Promo bouquets",
      description: "Réduction sur les compositions florales.",
      body: `${SMS_PRENOM_TAG}, -15 % sur tous nos bouquets cette semaine ! Commandez en boutique ou par téléphone.`,
    }),
    tpl("fleuriste", "fete-meres", {
      title: "Fête des mères",
      description: "Rappel commande pour une fête.",
      body: `Bonjour ${SMS_PRENOM_TAG}, la fête des mères approche ! Réservez votre bouquet dès maintenant.`,
    }),
    tpl("fleuriste", "livraison", {
      title: "Livraison locale",
      description: "Annonce un service de livraison.",
      body: `${SMS_PRENOM_TAG}, livraison de fleurs à domicile disponible aujourd'hui ! Commandez avant 14h.`,
    }),
    tpl("fleuriste", "saison", {
      title: "Fleurs de saison",
      description: "Met en avant une nouveauté florale.",
      body: `Bonjour ${SMS_PRENOM_TAG}, découvrez nos nouvelles compositions de saison en boutique !`,
    }),
    tpl("fleuriste", "relance", {
      title: "Une touche de couleur",
      description: "Relance avec une incitation douce.",
      body: `${SMS_PRENOM_TAG}, offrez-vous un bouquet cette semaine : -10 % pour votre retour en boutique.`,
    }),
    tpl("fleuriste", "merci", {
      title: "Remerciement",
      description: "Remercie après un achat floral.",
      body: `Merci ${SMS_PRENOM_TAG} pour votre confiance ! Vos fleurs vous attendent en boutique.`,
    }),
  ],
  boulangerie: [
    tpl("boulangerie", "matin", {
      title: "Spécial matin",
      description: "Annonce les produits frais du matin.",
      body: `Bonjour ${SMS_PRENOM_TAG}, nos croissants au beurre sortent du four à 7h ! Passez ce matin.`,
    }),
    tpl("boulangerie", "patisserie", {
      title: "Promo pâtisserie",
      description: "Offre sur les gâteaux et entremets.",
      body: `${SMS_PRENOM_TAG}, -10 % sur toute la pâtisserie aujourd'hui ! Présentez ce SMS en caisse.`,
    }),
    tpl("boulangerie", "saison", {
      title: "Produit de saison",
      description: "Met en avant une spécialité du moment.",
      body: `Bonjour ${SMS_PRENOM_TAG}, galette des rois disponible dès aujourd'hui ! Pensez à commander à l'avance.`,
    }),
    tpl("boulangerie", "fetes", {
      title: "Commandes fêtes",
      description: "Ouverture des commandes pour les fêtes.",
      body: `${SMS_PRENOM_TAG}, commandes de bûches et gâteaux de fête ouvertes ! Réservez en boutique ou par téléphone.`,
    }),
    tpl("boulangerie", "relance", {
      title: "On vous manque",
      description: "Relance les clients du quartier.",
      body: `Bonjour ${SMS_PRENOM_TAG}, ça fait longtemps ! Un pain offert pour toute commande supérieure à 10 € cette semaine.`,
    }),
    tpl("boulangerie", "merci", {
      title: "Remerciement",
      description: "Remercie après une visite.",
      body: `Merci ${SMS_PRENOM_TAG} pour votre visite ! Bonne journée et à demain matin.`,
    }),
  ],
  retail: [
    tpl("retail", "soldes", {
      title: "Soldes privées",
      description: "Accès anticipé à une remise.",
      body: `${SMS_PRENOM_TAG}, soldes privées dès demain : -30 % sur une sélection ! Réservé à nos clients fidèles.`,
    }),
    tpl("retail", "collection", {
      title: "Nouvelle collection",
      description: "Annonce l'arrivée de nouveautés.",
      body: `Bonjour ${SMS_PRENOM_TAG}, la nouvelle collection est en boutique ! Venez découvrir nos dernières arrivées.`,
    }),
    tpl("retail", "flash", {
      title: "Promo flash",
      description: "Offre limitée dans le temps.",
      body: `${SMS_PRENOM_TAG}, promo flash 48h : -20 % sur tout le magasin ! Ne tardez pas.`,
    }),
    tpl("retail", "fidelite", {
      title: "Points fidélité",
      description: "Rappelle un avantage fidélité.",
      body: `Bonjour ${SMS_PRENOM_TAG}, vous avez des points fidélité à utiliser ! Valables jusqu'à la fin du mois en boutique.`,
    }),
    tpl("retail", "relance", {
      title: "On vous attend",
      description: "Relance les clients inactifs.",
      body: `${SMS_PRENOM_TAG}, ça fait un moment ! Revenez en boutique et profitez de -15 % sur votre prochain achat.`,
    }),
    tpl("retail", "merci", {
      title: "Remerciement",
      description: "Remercie après un achat.",
      body: `Merci ${SMS_PRENOM_TAG} pour votre achat ! À très bientôt en boutique.`,
    }),
  ],
  tabac: [
    tpl("tabac", "presse", {
      title: "Arrivage presse",
      description: "Annonce les nouveautés presse.",
      body: `Bonjour ${SMS_PRENOM_TAG}, les magazines de la semaine sont arrivés ! Passez au tabac-presse.`,
    }),
    tpl("tabac", "loto", {
      title: "Jackpot loto",
      description: "Rappelle un tirage ou une grosse cagnotte.",
      body: `${SMS_PRENOM_TAG}, le jackpot FDJ est à son maximum ! Pensez à jouer avant samedi 20h.`,
    }),
    tpl("tabac", "promo", {
      title: "Promo boutique",
      description: "Offre sur une sélection produits.",
      body: `Bonjour ${SMS_PRENOM_TAG}, -10 % sur les e-liquides et accessoires cette semaine au tabac !`,
    }),
    tpl("tabac", "horaires", {
      title: "Horaires étendus",
      description: "Informe sur des horaires exceptionnels.",
      body: `${SMS_PRENOM_TAG}, ouvert ce dimanche de 8h à 13h ! Passez nous voir au tabac-presse.`,
    }),
    tpl("tabac", "relance", {
      title: "On vous manque",
      description: "Relance les clients du quartier.",
      body: `Bonjour ${SMS_PRENOM_TAG}, ça fait un moment ! Un café offert pour toute visite cette semaine.`,
    }),
    tpl("tabac", "merci", {
      title: "Remerciement",
      description: "Remercie après une visite.",
      body: `Merci ${SMS_PRENOM_TAG} pour votre visite ! À bientôt au tabac.`,
    }),
  ],
  sport: [
    tpl("sport", "decouverte", {
      title: "Séance découverte",
      description: "Invite à essayer la salle ou un cours.",
      body: `${SMS_PRENOM_TAG}, séance découverte gratuite à la salle ! Réservez votre créneau cette semaine.`,
    }),
    tpl("sport", "abonnement", {
      title: "Promo abonnement",
      description: "Offre sur un abonnement mensuel.",
      body: `Bonjour ${SMS_PRENOM_TAG}, -30 % sur l'abonnement 3 mois jusqu'à dimanche ! Rejoignez-nous.`,
    }),
    tpl("sport", "cours", {
      title: "Cours collectif",
      description: "Annonce un cours ou un planning.",
      body: `${SMS_PRENOM_TAG}, nouveau cours collectif yoga mardi et jeudi 18h30 ! Places limitées, inscrivez-vous.`,
    }),
    tpl("sport", "challenge", {
      title: "Challenge fitness",
      description: "Lance un défi ou un programme.",
      body: `Bonjour ${SMS_PRENOM_TAG}, challenge 30 jours : relevez-vous avec nous ! Infos à l'accueil de la salle.`,
    }),
    tpl("sport", "relance", {
      title: "Reprise sportive",
      description: "Relance les membres inactifs.",
      body: `${SMS_PRENOM_TAG}, on ne vous a pas vu depuis un moment ! Reprenez le sport avec 1 semaine offerte.`,
    }),
    tpl("sport", "merci", {
      title: "Remerciement",
      description: "Remercie un membre actif.",
      body: `Merci ${SMS_PRENOM_TAG} pour votre motivation ! Continuez comme ça, on est fiers de vous.`,
    }),
  ],
  sante: [
    tpl("sante", "ordonnance", {
      title: "Rappel ordonnance",
      description: "Rappelle un renouvellement ou retrait.",
      body: `Bonjour ${SMS_PRENOM_TAG}, votre ordonnance est prête à retirer à la pharmacie. Passez quand vous le souhaitez.`,
    }),
    tpl("sante", "para", {
      title: "Promo parapharmacie",
      description: "Offre sur des produits para.",
      body: `${SMS_PRENOM_TAG}, -15 % sur la gamme solaire en pharmacie cette semaine !`,
    }),
    tpl("sante", "conseil", {
      title: "Conseil saison",
      description: "Conseil santé de saison.",
      body: `Bonjour ${SMS_PRENOM_TAG}, pensez à votre vaccin grippe ! Prenez RDV en pharmacie, sans attente.`,
    }),
    tpl("sante", "horaires", {
      title: "Pharmacie de garde",
      description: "Informe sur les horaires ou la garde.",
      body: `${SMS_PRENOM_TAG}, nous sommes ouverts ce dimanche de 9h à 13h. Votre pharmacie vous accueille.`,
    }),
    tpl("sante", "relance", {
      title: "Suivi bien-être",
      description: "Relance pour un suivi ou produit.",
      body: `Bonjour ${SMS_PRENOM_TAG}, votre complément alimentaire est de nouveau disponible en pharmacie !`,
    }),
    tpl("sante", "merci", {
      title: "Remerciement",
      description: "Remercie après une visite.",
      body: `Merci ${SMS_PRENOM_TAG} pour votre confiance ! Votre équipe de pharmacie.`,
    }),
  ],
  automobile: [
    tpl("automobile", "revision", {
      title: "Promo révision",
      description: "Offre sur une révision ou vidange.",
      body: `${SMS_PRENOM_TAG}, forfait révision à 99 € au garage ! Prenez RDV avant la fin du mois.`,
    }),
    tpl("automobile", "pneus", {
      title: "Changement pneus",
      description: "Rappel changement de saison.",
      body: `Bonjour ${SMS_PRENOM_TAG}, pensez à vos pneus hiver ! Montage à partir de 15 €/pneu au garage.`,
    }),
    tpl("automobile", "controle", {
      title: "Contrôle technique",
      description: "Rappel échéance contrôle technique.",
      body: `${SMS_PRENOM_TAG}, votre contrôle technique arrive à échéance. Réservez un créneau au garage !`,
    }),
    tpl("automobile", "lavage", {
      title: "Offre lavage",
      description: "Promo lavage ou detailing.",
      body: `Bonjour ${SMS_PRENOM_TAG}, lavage intérieur + extérieur à 29 € cette semaine au garage !`,
    }),
    tpl("automobile", "relance", {
      title: "Entretien véhicule",
      description: "Relance pour un entretien.",
      body: `${SMS_PRENOM_TAG}, ça fait 6 mois depuis votre dernière visite ! -10 % sur votre prochain entretien.`,
    }),
    tpl("automobile", "merci", {
      title: "Remerciement",
      description: "Remercie après une intervention.",
      body: `Merci ${SMS_PRENOM_TAG} pour votre confiance ! Bonne route et à bientôt au garage.`,
    }),
  ],
  services: [
    tpl("services", "promo", {
      title: "Promo intervention",
      description: "Offre sur une prestation.",
      body: `${SMS_PRENOM_TAG}, -15 % sur votre prochaine intervention cette semaine ! Contactez-nous pour un RDV.`,
    }),
    tpl("services", "creneau", {
      title: "Créneau disponible",
      description: "Propose un créneau d'intervention.",
      body: `Bonjour ${SMS_PRENOM_TAG}, un créneau s'est libéré demain matin. Souhaitez-vous qu'on intervienne chez vous ?`,
    }),
    tpl("services", "devis", {
      title: "Devis gratuit",
      description: "Propose un devis sans engagement.",
      body: `${SMS_PRENOM_TAG}, devis gratuit pour vos travaux ! Appelez-nous ou répondez à ce SMS.`,
    }),
    tpl("services", "saison", {
      title: "Offre saisonnière",
      description: "Promo liée à la saison (chauffage, clim…).",
      body: `Bonjour ${SMS_PRENOM_TAG}, contrôle chaudière à 79 € avant l'hiver ! Réservez votre intervention.`,
    }),
    tpl("services", "relance", {
      title: "On repasse ?",
      description: "Relance pour une nouvelle prestation.",
      body: `${SMS_PRENOM_TAG}, besoin d'un entretien ? Nous repassons dans votre quartier la semaine prochaine.`,
    }),
    tpl("services", "merci", {
      title: "Remerciement",
      description: "Remercie après une intervention.",
      body: `Merci ${SMS_PRENOM_TAG} pour votre confiance ! N'hésitez pas à nous recommander.`,
    }),
  ],
  autre: [
    tpl("autre", "promo", {
      title: "Promotion",
      description: "Annonce une offre limitée.",
      body: `Bonjour ${SMS_PRENOM_TAG}, profitez de -20 % cette semaine ! Présentez ce SMS en boutique.`,
    }),
    tpl("autre", "event", {
      title: "Événement",
      description: "Invite à un moment spécial.",
      body: `${SMS_PRENOM_TAG}, vous êtes invité(e) à notre événement samedi de 10h à 18h !`,
    }),
    tpl("autre", "nouveaute", {
      title: "Nouveauté",
      description: "Annonce une nouveauté produit ou service.",
      body: `Bonjour ${SMS_PRENOM_TAG}, découvrez nos nouveautés en boutique dès aujourd'hui !`,
    }),
    tpl("autre", "flash", {
      title: "Offre flash",
      description: "Promo courte durée.",
      body: `${SMS_PRENOM_TAG}, offre flash 48h : -15 % sur tout ! Ne tardez pas.`,
    }),
    tpl("autre", "relance", {
      title: "Relance clients",
      description: "Fait revenir des clients inactifs.",
      body: `Bonjour ${SMS_PRENOM_TAG}, ça fait longtemps ! Revenez nous voir et profitez d'une surprise en boutique.`,
    }),
    tpl("autre", "merci", {
      title: "Remerciement",
      description: "Remercie après une visite ou un achat.",
      body: `Merci ${SMS_PRENOM_TAG} pour votre confiance ! À très bientôt.`,
    }),
  ],
};

/** Vérifie que chaque secteur a exactement 6 modèles. */
for (const activity of BUSINESS_ACTIVITIES) {
  const templates = CAMPAIGN_SMS_TEMPLATES_BY_ACTIVITY[activity.id];
  if (templates.length !== 6) {
    throw new Error(
      `campaignSmsTemplates: ${activity.id} must have 6 templates (got ${templates.length})`,
    );
  }
}

export const CAMPAIGN_SMS_TEMPLATES: CampaignSmsTemplate[] =
  BUSINESS_ACTIVITIES.flatMap((a) => CAMPAIGN_SMS_TEMPLATES_BY_ACTIVITY[a.id]);

export function getCampaignSmsTemplatesForActivity(
  activity: BusinessActivityId | "" | undefined,
): CampaignSmsTemplate[] {
  if (activity && isValidBusinessActivityId(activity)) {
    return CAMPAIGN_SMS_TEMPLATES_BY_ACTIVITY[activity];
  }
  return CAMPAIGN_SMS_TEMPLATES_BY_ACTIVITY.autre;
}
