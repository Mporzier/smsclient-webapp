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
  | "apparence"
  | "entreprise"
  | "facturation"
  | "sms-alertes"
  | "champs-perso"
  | "corbeille";

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
  { id: "apparence" },
  { id: "entreprise" },
  { id: "facturation" },
  { id: "sms-alertes" },
  { id: "champs-perso" },
  { id: "corbeille" },
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

export const parametresFieldLbl =
  "text-xs font-semibold text-muted-foreground";
export const parametresDirtyInp = "border-ring ring-2 ring-ring/20";

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
    section: "champs-perso",
    icon: ListPlus,
  },
  {
    id: "corbeille",
    section: "corbeille",
    icon: Trash2,
  },
];
