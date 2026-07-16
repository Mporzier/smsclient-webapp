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
  Mail,
  MapPin,
  MessageSquare,
  Shield,
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
  | "securite"
  | "factures"
  | "expediteur-sms"
  | "notifications-email"
  | "resume-mensuel"
  | "champs-perso"
  | "corbeille";

export type SettingCardDef = {
  id: SettingId;
  title: string;
  description: string;
  icon: LucideIcon;
  savable?: boolean;
};

export const emptyProfileForm: UserProfileForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
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
    title: "Entreprise",
    description: "Nom et secteur d'activité.",
    icon: Building2,
    savable: true,
  },
  {
    id: "identifiants-legaux",
    title: "SIRET & TVA",
    description: "Identifiants légaux de l'entreprise.",
    icon: Hash,
    savable: true,
  },
  {
    id: "adresse-facturation",
    title: "Adresse",
    description: "Adresse postale de facturation.",
    icon: MapPin,
    savable: true,
  },
  {
    id: "contact-facturation",
    title: "Contact facturation",
    description: "Personne à contacter pour la facturation.",
    icon: UserCircle,
    savable: true,
  },
  {
    id: "abonnement",
    title: "Abonnement",
    description: "Formule et mode de facturation.",
    icon: Sparkles,
  },
  {
    id: "paiement",
    title: "Paiement",
    description: "Carte bancaire enregistrée.",
    icon: CreditCard,
  },
  {
    id: "securite",
    title: "Sécurité",
    description: "Authentification à deux facteurs.",
    icon: Shield,
  },
  {
    id: "factures",
    title: "Factures",
    description: "Historique des achats de crédits.",
    icon: FileText,
  },
  {
    id: "expediteur-sms",
    title: "Expéditeur SMS",
    description: "Nom affiché aux destinataires.",
    icon: MessageSquare,
    savable: true,
  },
  {
    id: "notifications-email",
    title: "Alertes email",
    description: "Factures et notifications importantes.",
    icon: Mail,
    savable: true,
  },
  {
    id: "resume-mensuel",
    title: "Résumé mensuel",
    description: "Synthèse de vos campagnes par email.",
    icon: BarChart3,
    savable: true,
  },
  {
    id: "champs-perso",
    title: "Champs personnalisés",
    description: "Champs date, texte ou nombre sur les contacts.",
    icon: ListPlus,
  },
  {
    id: "corbeille",
    title: "Corbeille",
    description: "Contacts et groupes supprimés.",
    icon: Trash2,
  },
];
