export type SmsRegulationCountry = "fr" | "be" | "ch";

export type RegulationSectionKey =
  | "whoToContact"
  | "consent"
  | "marketingSms"
  | "transactionalSms"
  | "allowedHours"
  | "legalMentions"
  | "stopManagement"
  | "officialLinks";

export type RegulationSectionContent = {
  body: string;
  links?: { label: string; url: string }[];
};

export type CountryRegulations = {
  id: SmsRegulationCountry;
  label: string;
  authority: string;
  riskLevel: string;
  sections: Record<RegulationSectionKey, RegulationSectionContent>;
};

export const REGULATION_SECTION_ORDER: RegulationSectionKey[] = [
  "whoToContact",
  "consent",
  "marketingSms",
  "transactionalSms",
  "allowedHours",
  "legalMentions",
  "stopManagement",
  "officialLinks",
];

export const REGULATION_SECTION_LABELS: Record<RegulationSectionKey, string> = {
  whoToContact: "Qui puis-je contacter ?",
  consent: "Consentement requis ?",
  marketingSms: "SMS marketing autorisés ?",
  transactionalSms: "SMS transactionnels autorisés ?",
  allowedHours: "Horaires autorisés",
  legalMentions: "Mentions légales obligatoires",
  stopManagement: "Gestion du STOP",
  officialLinks: "Liens vers les textes officiels",
};

export const SMS_REGULATIONS: CountryRegulations[] = [
  {
    id: "fr",
    label: "France",
    authority: "CNIL · ARCEP",
    riskLevel: "faible",
    sections: {
      whoToContact: {
        body: "Clients et prospects ayant donné un consentement explicite pour recevoir des SMS. Pas d'achat de fichiers, pas de numéros extraits sans accord. Les personnes inscrites sur Bloctel ne doivent pas être sollicitées par téléphone (règle voisine à respecter).",
      },
      consent: {
        body: "Oui, obligatoire pour tout SMS commercial ou promotionnel. Le consentement doit être libre, spécifique, éclairé et univoque. Conservez la preuve (date, canal, formulation).",
      },
      marketingSms: {
        body: "Autorisés uniquement avec opt-in préalable. Mention STOP obligatoire. Pas d'envoi le dimanche ni en dehors des plages horaires courantes (8h–20h en semaine, 10h–20h le samedi).",
      },
      transactionalSms: {
        body: "Autorisés sans opt-in marketing si le message est strictement lié au service (confirmation de commande, rappel de RDV, alerte livraison). Pas de contenu promotionnel déguisé.",
      },
      allowedHours: {
        body: "Recommandation : 8h–20h du lundi au vendredi, 10h–20h le samedi. Évitez le dimanche et les jours fériés pour les messages promotionnels.",
      },
      legalMentions: {
        body: "Identifiez l'expéditeur (nom commercial ou marque). Sur les SMS promotionnels : mention de désinscription (« Répondez STOP… »). Respect du RGPD pour les données personnelles.",
      },
      stopManagement: {
        body: "Toute personne peut se désinscrire en répondant STOP (ou équivalent). Traitement gratuit et sans délai. Ne plus contacter après désinscription. Conservez la date de retrait.",
      },
      officialLinks: {
        body: "Textes et recommandations des autorités françaises :",
        links: [
          {
            label: "CNIL — Prospection commerciale",
            url: "https://www.cnil.fr/fr/prospection-commerciale",
          },
          {
            label: "ARCEP — Communications électroniques",
            url: "https://www.arcep.fr",
          },
          {
            label: "Legifrance — Code de la consommation",
            url: "https://www.legifrance.gouv.fr",
          },
        ],
      },
    },
  },
  {
    id: "be",
    label: "Belgique",
    authority: "APD · SPF Économie",
    riskLevel: "faible",
    sections: {
      whoToContact: {
        body: "Consommateurs ayant consenti explicitement. Vérifiez la liste « Ne pas démanger » (B2C) avant toute prospection. Les contacts professionnels (B2B) suivent des règles distinctes selon le contexte.",
      },
      consent: {
        body: "Oui, accord préalable explicite requis (loi du 13 mars 2018). Le silence ou une case pré-cochée ne vaut pas consentement. Documentez l'opt-in.",
      },
      marketingSms: {
        body: "Autorisés avec consentement préalable. Mention de désinscription obligatoire. Respect des listes d'opposition et des heures raisonnables.",
      },
      transactionalSms: {
        body: "Autorisés pour la gestion de la relation client (confirmation, notification de service) sans base marketing, dans la limite du strict nécessaire.",
      },
      allowedHours: {
        body: "Pas de plage légale unique, mais envoi en heures courtoises recommandé (jour, hors nuit et dimanche pour la prospection).",
      },
      legalMentions: {
        body: "Identité de l'expéditeur visible. Information claire sur le droit de retrait. Conformité RGPD (APD) pour le traitement des données.",
      },
      stopManagement: {
        body: "Désinscription gratuite via STOP ou canal équivalent. Traitement rapide. Ne pas réactiver sans nouveau consentement explicite.",
      },
      officialLinks: {
        body: "Références officielles belges :",
        links: [
          {
            label: "APD — Autorité de protection des données",
            url: "https://www.autoriteprotectiondonnees.be",
          },
          {
            label: "SPF Économie — Ne pas démanger",
            url: "https://economie.fgov.be/fr/themes/entreprises/protection-du-consommateur",
          },
        ],
      },
    },
  },
  {
    id: "ch",
    label: "Suisse",
    authority: "PFPDT · LCD",
    riskLevel: "faible",
    sections: {
      whoToContact: {
        body: "Personnes ayant accepté de recevoir des SMS marketing. Pas d'utilisation de listes tierces sans base légale. Respect des personnes ayant retiré leur accord.",
      },
      consent: {
        body: "Oui, consentement préalable requis pour la prospection (LPD et LCD). L'accord doit être donné en connaissance de cause et être révocable.",
      },
      marketingSms: {
        body: "Autorisés avec opt-in. L'expéditeur doit être identifiable. Faciliter le retrait à tout moment. Pas de pratiques trompeuses.",
      },
      transactionalSms: {
        body: "Autorisés pour messages liés à l'exécution d'un contrat ou d'un service (confirmation, rappel, suivi) sans constituer de publicité.",
      },
      allowedHours: {
        body: "Pas d'horaire légal strict, mais usage professionnel recommandé : envoi en journée, éviter la nuit et les heures tardives.",
      },
      legalMentions: {
        body: "Nom de l'entreprise ou marque visible. Finalité du message claire. Conformité à la LPD révisée (2023) pour les données personnelles.",
      },
      stopManagement: {
        body: "Retrait simple (STOP, lien ou contact). Traitement sans frais. Interdiction de réinscrire sans nouveau consentement.",
      },
      officialLinks: {
        body: "Sources officielles suisses :",
        links: [
          {
            label: "PFPDT — Préposé fédéral",
            url: "https://www.edoeb.admin.ch",
          },
          {
            label: "Admin.ch — Loi contre la concurrence déloyale",
            url: "https://www.admin.ch",
          },
        ],
      },
    },
  },
];
