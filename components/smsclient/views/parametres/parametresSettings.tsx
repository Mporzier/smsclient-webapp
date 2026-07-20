"use client";

import type { CreditPurchaseRowData } from "@/lib/types/credits";
import type { UserProfileForm } from "@/lib/types/profile";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  Hash,
  MapPin,
  MessageSquare,
  Mail,
  Sparkles,
  Trash2,
  UserCircle,
  ListPlus,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

export type SettingId =
  | "entreprise"
  | "identifiants-legaux"
  | "adresse-facturation"
  | "contact-facturation"
  | "abonnement"
  | "paiement"
  | "factures"
  | "expediteur-sms"
  | "notifications-email"
  | "resume-mensuel"
  | "champs-perso"
  | "corbeille";

export type SettingSectionId =
  | "compte"
  | "entreprise"
  | "facturation"
  | "sms-alertes"
  | "donnees";

export type SettingCardDef = {
  id: SettingId;
  section: SettingSectionId;
  title: string;
  description: string;
  icon: LucideIcon;
  savable?: boolean;
  /** Proto placeholder — UI « Bientôt », pas de faux état réel */
  upcoming?: boolean;
};

export type SettingSectionDef = {
  id: SettingSectionId;
  title: string;
};

export const settingSections: SettingSectionDef[] = [
  { id: "compte", title: "Compte" },
  { id: "entreprise", title: "Entreprise" },
  { id: "facturation", title: "Facturation" },
  { id: "sms-alertes", title: "SMS & alertes" },
  { id: "donnees", title: "Données" },
];

export const emptyProfileForm: UserProfileForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  language: "fr",
  companyName: "",
  businessActivity: "",
  siret: "",
  tva: "",
  address: "",
  zip: "",
  city: "",
  country: "France",
  billingContact: "",
  sender: "",
  notifyInvoices: true,
  notifySummary: true,
};

export const parametresFieldInp =
  "h-11 w-full rounded-[14px] border border-border bg-card px-3.5 text-[15px] font-bold text-foreground outline-none focus:border-ring focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]";
export const parametresFieldLbl = "mb-1.5 block text-xs font-black text-muted-foreground";

export const invoiceColumns: ColumnDef<CreditPurchaseRowData, unknown>[] = [
  { accessorKey: "createdLabel", header: "Date" },
  {
    accessorKey: "packLabel",
    header: "Pack",
    cell: ({ getValue }) => (
      <span>{getValue<string>()}</span>
    ),
  },
  { accessorKey: "amountLabel", header: "Prix", size: 90 },
  {
    accessorKey: "status",
    header: "Statut",
    size: 100,
    cell: ({ getValue }) => {
      const status = getValue<string>();
      return status === "paid" ? (
        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-500/12 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
          Payée
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          Remboursée
        </span>
      );
    },
  },
  { accessorKey: "creditsLabel", header: "Crédits", size: 80 },
];

export const allSettingCards: SettingCardDef[] = [
  {
    id: "entreprise",
    section: "entreprise",
    title: "Entreprise",
    description: "Nom et secteur d'activité.",
    icon: Building2,
    savable: true,
  },
  {
    id: "identifiants-legaux",
    section: "entreprise",
    title: "SIRET & TVA",
    description: "Identifiants légaux de l'entreprise.",
    icon: Hash,
    savable: true,
  },
  {
    id: "adresse-facturation",
    section: "entreprise",
    title: "Adresse",
    description: "Adresse postale de facturation.",
    icon: MapPin,
    savable: true,
  },
  {
    id: "contact-facturation",
    section: "entreprise",
    title: "Contact facturation",
    description: "Personne à contacter pour la facturation.",
    icon: UserCircle,
    savable: true,
  },
  {
    id: "abonnement",
    section: "facturation",
    title: "Abonnement",
    description: "Formule et mode de facturation.",
    icon: Sparkles,
    upcoming: true,
  },
  {
    id: "paiement",
    section: "facturation",
    title: "Paiement",
    description: "Carte bancaire enregistrée.",
    icon: CreditCard,
    upcoming: true,
  },
  {
    id: "factures",
    section: "facturation",
    title: "Factures",
    description: "Historique des achats de crédits.",
    icon: FileText,
  },
  {
    id: "expediteur-sms",
    section: "sms-alertes",
    title: "Expéditeur SMS",
    description: "Nom affiché aux destinataires.",
    icon: MessageSquare,
    savable: true,
  },
  {
    id: "notifications-email",
    section: "sms-alertes",
    title: "Alertes et conseils",
    description: "Infos importantes et conseils par email.",
    icon: Mail,
    savable: true,
  },
  {
    id: "resume-mensuel",
    section: "sms-alertes",
    title: "Résumé mensuel",
    description: "Synthèse de vos campagnes par email.",
    icon: BarChart3,
    savable: true,
  },
  {
    id: "champs-perso",
    section: "donnees",
    title: "Champs personnalisés",
    description: "Champs date, texte ou nombre sur les contacts.",
    icon: ListPlus,
  },
  {
    id: "corbeille",
    section: "donnees",
    title: "Corbeille",
    description: "Contacts et groupes supprimés.",
    icon: Trash2,
  },
];
