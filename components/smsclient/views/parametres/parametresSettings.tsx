"use client";

import { toast } from "@/components/ui/sonner";
import type { UserProfileForm } from "@/lib/types/profile";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  FileText,
  Hash,
  ListPlus,
  Mail,
  MapPin,
  Send,
  MessageSquare,
  Palette,
  Sparkles,
  Trash2,
  UserRound,
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
  | "campagnes"
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
  icon: LucideIcon;
};

export const settingSections: SettingSectionDef[] = [
  { id: "compte", icon: UserRound },
  { id: "apparence", icon: Palette },
  { id: "entreprise", icon: Building2 },
  { id: "facturation", icon: CreditCard },
  { id: "campagnes", icon: Send },
  { id: "sms-alertes", icon: Bell },
  { id: "champs-perso", icon: ListPlus },
  { id: "corbeille", icon: Trash2 },
];

export const SECTION_PROFILE_FIELDS: Partial<
  Record<SettingSectionId, readonly (keyof UserProfileForm)[]>
> = {
  entreprise: [
    "companyName",
    "businessActivity",
    "siret",
    "tva",
    "address",
    "zip",
    "city",
    "country",
  ],
  facturation: ["billingContact"],
  campagnes: ["sender"],
  "sms-alertes": ["notifyInvoices", "notifySummary"],
};

export function sectionProfileFields(
  sectionId: SettingSectionId,
): readonly (keyof UserProfileForm)[] {
  return SECTION_PROFILE_FIELDS[sectionId] ?? [];
}

export function isSectionDirty(
  sectionId: SettingSectionId,
  draft: UserProfileForm,
  saved: UserProfileForm,
): boolean {
  const fields = sectionProfileFields(sectionId);
  return fields.some((key) => draft[key] !== saved[key]);
}

export function sectionDirtyFieldCount(
  sectionId: SettingSectionId,
  draft: UserProfileForm,
  saved: UserProfileForm,
): number {
  const fields = sectionProfileFields(sectionId);
  return fields.filter((key) => draft[key] !== saved[key]).length;
}

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

/** @deprecated Préférer `parametresRowLabelCls` + `ParametresInputRow`. */
export const parametresFieldLbl =
  "text-xs font-semibold text-muted-foreground";
export const parametresDirtyInp = "border-ring ring-2 ring-ring/20";

/** Grille label | champ — alignée onglet Compte. */
export const parametresRowCls =
  "grid min-h-[3.25rem] grid-cols-[7rem_minmax(0,1fr)] items-center gap-3 border-b border-border py-2 last:border-b-0 max-[480px]:grid-cols-[5.5rem_minmax(0,1fr)]";
export const parametresRowLabelCls =
  "text-sm font-medium text-muted-foreground";
export const parametresRowValueCls =
  "flex min-w-0 w-full items-center gap-1.5";
export const parametresRowInputCls =
  "h-9 min-w-0 flex-1 text-sm focus-visible:outline-none focus-visible:ring-0 aria-invalid:ring-0";
export const parametresRowHintCls =
  "text-xs font-normal leading-snug text-muted-foreground";
export const parametresFieldStackCls = "w-full max-w-md";

export function parametresToastError(message: string) {
  toast.error(message);
}

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
    section: "facturation",
    icon: FileText,
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
    section: "campagnes",
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
