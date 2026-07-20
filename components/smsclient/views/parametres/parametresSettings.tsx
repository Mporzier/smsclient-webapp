"use client";

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
  icon: LucideIcon;
  savable?: boolean;
  /** Proto placeholder — UI « Bientôt », pas de faux état réel */
  upcoming?: boolean;
};

export type SettingSectionDef = {
  id: SettingSectionId;
};

export const settingSections: SettingSectionDef[] = [
  { id: "compte" },
  { id: "entreprise" },
  { id: "facturation" },
  { id: "sms-alertes" },
  { id: "donnees" },
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

export const allSettingCards: SettingCardDef[] = [
  {
    id: "entreprise",
    section: "entreprise",
    icon: Building2,
    savable: true,
  },
  {
    id: "identifiants-legaux",
    section: "entreprise",
    icon: Hash,
    savable: true,
  },
  {
    id: "adresse-facturation",
    section: "entreprise",
    icon: MapPin,
    savable: true,
  },
  {
    id: "contact-facturation",
    section: "entreprise",
    icon: UserCircle,
    savable: true,
  },
  {
    id: "abonnement",
    section: "facturation",
    icon: Sparkles,
    upcoming: true,
  },
  {
    id: "paiement",
    section: "facturation",
    icon: CreditCard,
    upcoming: true,
  },
  {
    id: "factures",
    section: "facturation",
    icon: FileText,
  },
  {
    id: "expediteur-sms",
    section: "sms-alertes",
    icon: MessageSquare,
    savable: true,
  },
  {
    id: "notifications-email",
    section: "sms-alertes",
    icon: Mail,
    savable: true,
  },
  {
    id: "resume-mensuel",
    section: "sms-alertes",
    icon: BarChart3,
    savable: true,
  },
  {
    id: "champs-perso",
    section: "donnees",
    icon: ListPlus,
  },
  {
    id: "corbeille",
    section: "donnees",
    icon: Trash2,
  },
];
