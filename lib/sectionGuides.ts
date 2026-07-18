import type { KnowledgeBaseArticleSlug } from "@/lib/knowledgeBase";
import type { AppRoute } from "@/lib/proto/routes";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarSync,
  CircleHelp,
  CircleUserRound,
  Coins,
  LayoutTemplate,
  Link,
  Megaphone,
  MessageSquareText,
  QrCode,
  Scale,
  Settings,
  Users,
} from "lucide-react";

export type SectionGuideKey =
  | "dashboard"
  | "contacts"
  | "groupes"
  | "campagnes"
  | "statistiques"
  | "automatisations"
  | "liens"
  | "modeles-sms"
  | "parametres"
  | "qr-boutique"
  | "reglementations-sms"
  | "nouvelle-campagne"
  | "acheter-credits"
  | "aide"
  | "soumettre-avis";

export type SectionGuideContent = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  primaryLabel?: string;
  primaryRoute?: AppRoute;
  kbSlug: KnowledgeBaseArticleSlug;
};

export const SECTION_GUIDES: Record<SectionGuideKey, SectionGuideContent> = {
  dashboard: {
    icon: LayoutTemplate,
    eyebrow: "Accueil",
    title: "Votre tableau de bord SMS",
    description:
      "Retrouvez ici vos indicateurs clés et les prochaines actions pour faire grandir votre activité SMS.",
    bullets: [
      "Suivez crédits, contacts, groupes et envois en un coup d’œil.",
      "Les activités récentes reprennent vos dernières campagnes et imports.",
      "Chaque section du menu dispose de son propre guide et de ressources d’aide.",
    ],
    primaryLabel: "Envoyer un SMS",
    primaryRoute: "campagnes",
    kbSlug: "accueil",
  },
  contacts: {
    icon: CircleUserRound,
    eyebrow: "Contacts",
    title: "Comprendre la liste des contacts",
    description:
      "Cette liste centralise tous vos destinataires SMS : recherche, import, groupes et historique d’envoi.",
    bullets: [
      "Chaque ligne = un contact avec téléphone, groupes et dernier SMS reçu.",
      "Seuls les contacts abonnés (sans STOP) sont éligibles aux campagnes.",
      "Importez en masse ou ajoutez manuellement, puis classez par groupes.",
    ],
    primaryLabel: "Ajouter un contact",
    primaryRoute: "contacts",
    kbSlug: "contacts",
  },
  groupes: {
    icon: Users,
    eyebrow: "Groupes",
    title: "Organiser vos contacts en groupes",
    description:
      "Les groupes segmentent votre base pour cibler précisément vos campagnes et automatisations.",
    bullets: [
      "Un groupe regroupe des contacts partageant un même profil ou besoin.",
      "La colonne « Dernière campagne » indique le dernier envoi ciblant ce groupe.",
      "Sélectionnez plusieurs groupes pour créer une campagne ciblée.",
    ],
    primaryLabel: "Créer un groupe",
    primaryRoute: "groupes",
    kbSlug: "groupes",
  },
  campagnes: {
    icon: Megaphone,
    eyebrow: "Campagnes",
    title: "Suivre vos campagnes SMS",
    description:
      "Cette liste retrace chaque envoi : brouillons, programmations, messages envoyés ou en échec.",
    bullets: [
      "Statut : brouillon, programmée, envoyée, échec ou annulée.",
      "Destinataires et crédits estimés sont visibles avant et après l’envoi.",
      "Cliquez sur une ligne pour consulter le détail d’une campagne.",
    ],
    primaryLabel: "Nouvelle campagne",
    primaryRoute: "nouvelle-campagne",
    kbSlug: "campagnes",
  },
  statistiques: {
    icon: BarChart3,
    eyebrow: "Statistiques",
    title: "Lire vos performances SMS",
    description:
      "Analysez l’impact de vos envois sur la période choisie : volume, délivrabilité, inscriptions QR et désinscriptions.",
    bullets: [
      "Les KPIs résument SMS envoyés, taux délivré, inscriptions QR, STOP et crédits consommés.",
      "Le graphique détaille envois, échecs et programmations par jour.",
      "Filtrez la période pour comparer vos campagnes dans le temps.",
    ],
    kbSlug: "statistiques",
  },
  automatisations: {
    icon: CalendarSync,
    eyebrow: "Automatisations",
    title: "Automatiser vos envois récurrents",
    description:
      "Programmez des SMS pour les anniversaires et événements : ils partent seuls aux contacts éligibles.",
    bullets: [
      "Activez ou désactivez chaque scénario (anniversaire, fêtes, etc.).",
      "Seuls les contacts abonnés sans STOP sont ciblés.",
      "Personnalisez le message et l’expéditeur avant activation.",
    ],
    kbSlug: "automatisations",
  },
  liens: {
    icon: Link,
    eyebrow: "Liens",
    title: "Liens courts traçables pour vos SMS",
    description:
      "Créez des URLs courtes pour vos campagnes et mesurez les clics depuis cette liste.",
    bullets: [
      "Chaque lien associe une URL d’origine à une adresse courte smsclient.fr.",
      "La colonne « Clics » compte les ouvertures après envoi du SMS.",
      "Copiez le lien court pour l’insérer dans vos messages marketing.",
    ],
    primaryLabel: "Créer un lien",
    primaryRoute: "liens",
    kbSlug: "liens",
  },
  "modeles-sms": {
    icon: MessageSquareText,
    eyebrow: "Modèles SMS",
    title: "Modèles de SMS les plus populaires",
    description:
      "Gagnez du temps avec des textes prêts à l’emploi : promos, rappels, remerciements et relances.",
    bullets: [
      "Enregistrez vos modèles personnalisés pour les réutiliser en campagne.",
      "Titre, description et corps du message sont modifiables à tout moment.",
      "Inspirez-vous des exemples les plus utilisés par nos clients.",
    ],
    primaryLabel: "Découvrir les modèles",
    primaryRoute: "modeles-sms",
    kbSlug: "modeles-sms",
  },
  parametres: {
    icon: Settings,
    eyebrow: "Paramètres",
    title: "Configurer votre compte",
    description:
      "Gérez le profil, les champs personnalisés, la corbeille et les options du compte.",
    bullets: [
      "Mettez à jour les infos profil et préférences d’envoi.",
      "Définissez des champs perso pour enrichir vos contacts.",
      "Restaurez ou purgez les éléments en corbeille.",
    ],
    kbSlug: "accueil",
  },
  "qr-boutique": {
    icon: QrCode,
    eyebrow: "QR code boutique",
    title: "Collecter des contacts via QR",
    description:
      "Créez une roue ou une page QR pour faire s’inscrire vos clients en magasin.",
    bullets: [
      "Personnalisez l’apparence et le message de bienvenue.",
      "Les inscriptions alimentent votre liste contacts.",
      "Suivez les performances côté statistiques.",
    ],
    primaryLabel: "Voir les stats QR",
    primaryRoute: "statistiques",
    kbSlug: "contacts",
  },
  "reglementations-sms": {
    icon: Scale,
    eyebrow: "Réglementations",
    title: "Respecter les règles SMS",
    description:
      "Rappel des obligations légales : STOP, consentement et bonnes pratiques d’envoi.",
    bullets: [
      "Chaque SMS marketing doit permettre de se désabonner (STOP).",
      "N’envoyez qu’aux contacts abonnés et consentants.",
      "Consultez le centre d’aide pour le détail réglementaire.",
    ],
    primaryLabel: "Centre d'aide",
    primaryRoute: "aide",
    kbSlug: "accueil",
  },
  "nouvelle-campagne": {
    icon: Megaphone,
    eyebrow: "Nouvelle campagne",
    title: "Créer et envoyer une campagne",
    description:
      "Assistant en 3 étapes : destinataires, message, puis confirmation et envoi.",
    bullets: [
      "Choisissez contacts ou groupes abonnés.",
      "Rédigez le SMS et vérifiez le coût en crédits.",
      "Envoyez tout de suite ou programmez l’envoi.",
    ],
    primaryLabel: "Voir les campagnes",
    primaryRoute: "campagnes",
    kbSlug: "campagnes",
  },
  "acheter-credits": {
    icon: Coins,
    eyebrow: "Crédits",
    title: "Recharger votre solde SMS",
    description:
      "Achetez des crédits pour continuer à envoyer des campagnes et automatisations.",
    bullets: [
      "1 crédit ≈ 1 SMS standard (selon encodage).",
      "Le solde apparaît dans la barre du haut.",
      "Contactez le support pour une facturation entreprise.",
    ],
    kbSlug: "accueil",
  },
  aide: {
    icon: CircleHelp,
    eyebrow: "Centre d'aide",
    title: "Trouver de l’aide rapidement",
    description:
      "Guides, FAQ et contact support pour résoudre vos questions sur smsclient.",
    bullets: [
      "Parcourez les articles de la base de connaissance.",
      "Ouvrez le widget FAQ si disponible.",
      "Écrivez à support@smsclient.fr en cas de blocage.",
    ],
    kbSlug: "accueil",
  },
  "soumettre-avis": {
    icon: MessageSquareText,
    eyebrow: "Avis",
    title: "Donner votre retour",
    description:
      "Suggérez une amélioration ou signalez un point de friction — on lit chaque message.",
    bullets: [
      "Décrivez le contexte et le résultat attendu.",
      "Joignez une capture si utile.",
      "Le support peut aussi répondre via le formulaire contact.",
    ],
    kbSlug: "accueil",
  },
};

/** Map route app → clé de guide (contenu bannière flottante). */
export function guideKeyForRoute(route: AppRoute): SectionGuideKey {
  return route;
}
