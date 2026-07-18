import { SMS_PRENOM_TAG } from "@/lib/proto/smsPersonalization";
import {
  BUSINESS_CATEGORIES,
  type BusinessActivityId,
  type BusinessCategoryId,
  businessCategoryOf,
  isValidBusinessActivityId,
  normalizeBusinessActivityId,
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

function tpl(
  sector: BusinessCategoryId,
  slug: string,
  draft: TemplateDraft,
): CampaignSmsTemplate {
  return { id: `${sector}-${slug}`, ...draft };
}

const CAMPAIGN_SMS_TEMPLATES_BY_CATEGORY: Record<
  BusinessCategoryId,
  CampaignSmsTemplate[]
> = {
  commerce: [
    tpl("commerce", "soldes", {
      title: "Soldes privées",
      description: "Accès anticipé à une remise.",
      body: `${SMS_PRENOM_TAG}, soldes privées dès demain : -30 % sur une sélection ! Réservé à nos clients fidèles.`,
    }),
    tpl("commerce", "collection", {
      title: "Nouvelle collection",
      description: "Annonce l'arrivée de nouveautés.",
      body: `Bonjour ${SMS_PRENOM_TAG}, la nouvelle collection est en boutique ! Venez découvrir nos dernières arrivées.`,
    }),
    tpl("commerce", "flash", {
      title: "Promo flash",
      description: "Offre limitée dans le temps.",
      body: `${SMS_PRENOM_TAG}, promo flash 48h : -20 % sur tout le magasin ! Ne tardez pas.`,
    }),
    tpl("commerce", "fidelite", {
      title: "Points fidélité",
      description: "Rappelle un avantage fidélité.",
      body: `Bonjour ${SMS_PRENOM_TAG}, vous avez des points fidélité à utiliser ! Valables jusqu'à la fin du mois en boutique.`,
    }),
    tpl("commerce", "relance", {
      title: "On vous attend",
      description: "Relance les clients inactifs.",
      body: `${SMS_PRENOM_TAG}, ça fait un moment ! Revenez en boutique et profitez de -15 % sur votre prochain achat.`,
    }),
    tpl("commerce", "merci", {
      title: "Remerciement",
      description: "Remercie après un achat.",
      body: `Merci ${SMS_PRENOM_TAG} pour votre achat ! À très bientôt en boutique.`,
    }),
  ],
  restauration: [
    tpl("restauration", "menu", {
      title: "Menu du jour",
      description: "Annonce le plat ou formule du jour.",
      body: `Bonjour ${SMS_PRENOM_TAG}, menu du jour : entrée + plat + dessert à 22 €. Réservez votre table !`,
    }),
    tpl("restauration", "resa", {
      title: "Réservation week-end",
      description: "Incite à réserver pour un service chargé.",
      body: `${SMS_PRENOM_TAG}, places limitées ce week-end ! Réservez dès maintenant par téléphone ou en ligne.`,
    }),
    tpl("restauration", "happy-hour", {
      title: "Happy hour",
      description: "Promo boissons en début de soirée.",
      body: `${SMS_PRENOM_TAG}, happy hour ce soir 18h-20h : -30 % sur tous les cocktails !`,
    }),
    tpl("restauration", "matin", {
      title: "Spécial matin",
      description: "Annonce les produits frais du matin.",
      body: `Bonjour ${SMS_PRENOM_TAG}, nos croissants au beurre sortent du four à 7h ! Passez ce matin.`,
    }),
    tpl("restauration", "relance", {
      title: "On vous manque",
      description: "Relance les clients absents.",
      body: `Bonjour ${SMS_PRENOM_TAG}, ça fait un moment ! Revenez dîner chez nous et profitez d'un apéritif offert.`,
    }),
    tpl("restauration", "merci", {
      title: "Remerciement",
      description: "Remercie après une visite.",
      body: `Merci ${SMS_PRENOM_TAG} pour votre visite ! Au plaisir de vous accueillir à nouveau très bientôt.`,
    }),
  ],
  services: [
    tpl("services", "creneaux", {
      title: "Créneaux disponibles",
      description: "Propose des rendez-vous libres.",
      body: `Bonjour ${SMS_PRENOM_TAG}, des créneaux sont disponibles cette semaine. Réservez votre RDV !`,
    }),
    tpl("services", "promo", {
      title: "Promo prestation",
      description: "Offre sur une prestation.",
      body: `${SMS_PRENOM_TAG}, -20 % sur votre prochaine prestation jusqu'à vendredi ! Prenez RDV.`,
    }),
    tpl("services", "devis", {
      title: "Devis prêt",
      description: "Annonce un devis disponible.",
      body: `Bonjour ${SMS_PRENOM_TAG}, votre devis est prêt. On en discute par téléphone ?`,
    }),
    tpl("services", "pret", {
      title: "Prestation prête",
      description: "Réparation / pressing prêt à retirer.",
      body: `${SMS_PRENOM_TAG}, c'est prêt ! Vous pouvez passer retirer dès maintenant.`,
    }),
    tpl("services", "relance", {
      title: "Rappel entretien",
      description: "Relance pour un nouveau rendez-vous.",
      body: `${SMS_PRENOM_TAG}, il est temps de reprendre RDV ! Des créneaux se libèrent cette semaine.`,
    }),
    tpl("services", "merci", {
      title: "Remerciement",
      description: "Remercie après une prestation.",
      body: `Merci ${SMS_PRENOM_TAG} pour votre confiance ! À très bientôt.`,
    }),
  ],
  sante: [
    tpl("sante", "rdv", {
      title: "Rappel de rendez-vous",
      description: "Rappel RDV santé / bien-être J-1.",
      body: `Bonjour ${SMS_PRENOM_TAG}, rappel : votre rendez-vous est demain. Prévenez-nous en cas d'empêchement.`,
    }),
    tpl("sante", "creneau", {
      title: "Créneau disponible",
      description: "Propose un créneau libéré.",
      body: `${SMS_PRENOM_TAG}, un créneau s'est libéré cette semaine. Souhaitez-vous le réserver ?`,
    }),
    tpl("sante", "ordonnance", {
      title: "Préparation prête",
      description: "Retrait ordonnance ou commande.",
      body: `Bonjour ${SMS_PRENOM_TAG}, votre préparation est prête à retirer. Passez quand vous le souhaitez.`,
    }),
    tpl("sante", "promo", {
      title: "Offre bien-être",
      description: "Promo soin / prestation.",
      body: `${SMS_PRENOM_TAG}, -20 % sur votre prochaine prestation jusqu'à vendredi ! Prenez RDV.`,
    }),
    tpl("sante", "suivi", {
      title: "Rappel de suivi",
      description: "Incitation à un contrôle ou rebooking.",
      body: `${SMS_PRENOM_TAG}, il est temps de planifier votre prochain RDV. Réservez dès maintenant.`,
    }),
    tpl("sante", "merci", {
      title: "Remerciement",
      description: "Remercie après une visite.",
      body: `Merci ${SMS_PRENOM_TAG} pour votre confiance ! Prenez soin de vous.`,
    }),
  ],
  hotellerie_tourisme: [
    tpl("hotellerie_tourisme", "pre_arrival", {
      title: "Pré-arrivée",
      description: "Infos avant séjour / visite.",
      body: `À bientôt ${SMS_PRENOM_TAG} ! Check-in à partir de 15h. Infos pratiques : répondez à ce SMS.`,
    }),
    tpl("hotellerie_tourisme", "offre", {
      title: "Offre séjour",
      description: "Promo chambre ou forfait.",
      body: `${SMS_PRENOM_TAG}, offre spéciale : -15 % sur votre prochain séjour ! Réservez vite.`,
    }),
    tpl("hotellerie_tourisme", "activite", {
      title: "Activité / visite",
      description: "Suggestion tourisme locale.",
      body: `Bonjour ${SMS_PRENOM_TAG}, découvrez nos activités du week-end ! Infos et réservation par SMS.`,
    }),
    tpl("hotellerie_tourisme", "rappel", {
      title: "Rappel réservation",
      description: "Rappel J-1.",
      body: `${SMS_PRENOM_TAG}, rappel : nous vous attendons demain. Besoin de modifier ? Répondez à ce SMS.`,
    }),
    tpl("hotellerie_tourisme", "avis", {
      title: "Post-séjour + avis",
      description: "Remerciement et avis.",
      body: `Merci ${SMS_PRENOM_TAG} pour votre séjour ! Un avis nous aide beaucoup.`,
    }),
    tpl("hotellerie_tourisme", "merci", {
      title: "Remerciement",
      description: "Message de bienvenue / remerciement.",
      body: `Merci ${SMS_PRENOM_TAG} ! Au plaisir de vous accueillir à nouveau.`,
    }),
  ],
  btp_immobilier: [
    tpl("btp_immobilier", "devis", {
      title: "Devis prêt",
      description: "Annonce un devis disponible.",
      body: `Bonjour ${SMS_PRENOM_TAG}, votre devis est prêt. On en discute par téléphone ou sur place ?`,
    }),
    tpl("btp_immobilier", "visite", {
      title: "Proposition de visite",
      description: "Invite à visiter un bien ou un chantier.",
      body: `Bonjour ${SMS_PRENOM_TAG}, un créneau visite est disponible cette semaine. Répondez pour le bloquer.`,
    }),
    tpl("btp_immobilier", "rappel", {
      title: "Rappel RDV",
      description: "Rappel visite ou intervention.",
      body: `${SMS_PRENOM_TAG}, rappel : RDV demain à l'heure convenue. À demain !`,
    }),
    tpl("btp_immobilier", "chantier", {
      title: "Suivi chantier",
      description: "Info démarrage ou avancement.",
      body: `Bonjour ${SMS_PRENOM_TAG}, les travaux avancent comme prévu. On vous tient informé.`,
    }),
    tpl("btp_immobilier", "nouveau_bien", {
      title: "Nouveau bien / offre",
      description: "Alerte nouveau bien ou offre.",
      body: `${SMS_PRENOM_TAG}, nouveauté qui peut vous intéresser ! Contactez-nous pour les détails.`,
    }),
    tpl("btp_immobilier", "merci", {
      title: "Remerciement",
      description: "Après signature ou travaux.",
      body: `Merci ${SMS_PRENOM_TAG} pour votre confiance ! Belle continuation dans votre projet.`,
    }),
  ],
  education_public: [
    tpl("education_public", "rdv", {
      title: "Rappel de rendez-vous",
      description: "Confirme un créneau à venir.",
      body: `Bonjour ${SMS_PRENOM_TAG}, rappel : votre rendez-vous est prévu demain. Merci de prévenir en cas d'empêchement.`,
    }),
    tpl("education_public", "info", {
      title: "Information",
      description: "Diffuse une info pratique.",
      body: `Bonjour ${SMS_PRENOM_TAG}, information importante : consultez nos horaires mis à jour ou contactez-nous.`,
    }),
    tpl("education_public", "evenement", {
      title: "Événement / réunion",
      description: "Invite à une réunion ou un événement.",
      body: `${SMS_PRENOM_TAG}, vous êtes invité(e) à notre réunion / événement le {date}. Infos par SMS.`,
    }),
    tpl("education_public", "rappel_dossier", {
      title: "Suivi dossier",
      description: "Relance pour un dossier.",
      body: `Bonjour ${SMS_PRENOM_TAG}, nous vous rappelons pour le suivi de votre dossier. Répondez à ce SMS.`,
    }),
    tpl("education_public", "creneau", {
      title: "Créneau disponible",
      description: "Propose un créneau libéré.",
      body: `${SMS_PRENOM_TAG}, un créneau s'est libéré cette semaine. Souhaitez-vous le réserver ?`,
    }),
    tpl("education_public", "merci", {
      title: "Remerciement",
      description: "Remercie après une visite.",
      body: `Merci ${SMS_PRENOM_TAG} pour votre confiance ! À bientôt.`,
    }),
  ],
  loisirs_evenementiel: [
    tpl("loisirs_evenementiel", "creneau", {
      title: "Créneau / billet",
      description: "Propose un créneau ou une activité.",
      body: `${SMS_PRENOM_TAG}, places disponibles cette semaine ! Réservez votre créneau dès maintenant.`,
    }),
    tpl("loisirs_evenementiel", "confirmation", {
      title: "Confirmation",
      description: "Valide réservation ou événement.",
      body: `Bonjour ${SMS_PRENOM_TAG}, c'est confirmé pour le {date} à {heure}. À très bientôt !`,
    }),
    tpl("loisirs_evenementiel", "rappel", {
      title: "Rappel J-1",
      description: "Rappel avant activité / événement.",
      body: `${SMS_PRENOM_TAG}, rappel : demain à {heure}. Prévenez-nous si empêchement.`,
    }),
    tpl("loisirs_evenementiel", "promo", {
      title: "Offre / pack",
      description: "Promo groupe ou hors saison.",
      body: `${SMS_PRENOM_TAG}, offre spéciale : -10 % cette semaine ! Réservez vite.`,
    }),
    tpl("loisirs_evenementiel", "devis", {
      title: "Devis événement",
      description: "Suite demande devis.",
      body: `Bonjour ${SMS_PRENOM_TAG}, suite à votre demande : un créneau devis est disponible. Répondez pour le bloquer.`,
    }),
    tpl("loisirs_evenementiel", "merci", {
      title: "Remerciement",
      description: "Post-activité / événement.",
      body: `Merci ${SMS_PRENOM_TAG} ! On espère vous revoir très bientôt.`,
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
      body: `Bonjour ${SMS_PRENOM_TAG}, découvrez nos nouveautés dès aujourd'hui !`,
    }),
    tpl("autre", "flash", {
      title: "Offre flash",
      description: "Promo courte durée.",
      body: `${SMS_PRENOM_TAG}, offre flash 48h : -15 % sur tout ! Ne tardez pas.`,
    }),
    tpl("autre", "relance", {
      title: "Relance clients",
      description: "Fait revenir des clients inactifs.",
      body: `Bonjour ${SMS_PRENOM_TAG}, ça fait longtemps ! Revenez nous voir et profitez d'une surprise.`,
    }),
    tpl("autre", "merci", {
      title: "Remerciement",
      description: "Remercie après une visite ou un achat.",
      body: `Merci ${SMS_PRENOM_TAG} pour votre confiance ! À très bientôt.`,
    }),
  ],
};

/** Vérifie que chaque catégorie a exactement 6 modèles. */
for (const category of BUSINESS_CATEGORIES) {
  const templates = CAMPAIGN_SMS_TEMPLATES_BY_CATEGORY[category.id];
  if (!templates || templates.length !== 6) {
    throw new Error(
      `campaignSmsTemplates: ${category.id} must have 6 templates (got ${templates?.length ?? 0})`,
    );
  }
}

export const CAMPAIGN_SMS_TEMPLATES: CampaignSmsTemplate[] =
  BUSINESS_CATEGORIES.flatMap(
    (c) => CAMPAIGN_SMS_TEMPLATES_BY_CATEGORY[c.id],
  );

export function getCampaignSmsTemplatesForActivity(
  activity: BusinessActivityId | "" | undefined,
): CampaignSmsTemplate[] {
  if (activity && isValidBusinessActivityId(activity)) {
    const canonical = normalizeBusinessActivityId(activity);
    const category = canonical ? businessCategoryOf(canonical) : null;
    if (category) {
      return CAMPAIGN_SMS_TEMPLATES_BY_CATEGORY[category];
    }
  }
  return CAMPAIGN_SMS_TEMPLATES_BY_CATEGORY.autre;
}
