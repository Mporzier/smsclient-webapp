import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  ClipboardList,
  CreditCard,
  Download,
  Gift,
  Globe,
  Link,
  Mail,
  MapPin,
  Megaphone,
  Percent,
  Phone,
  Share2,
  ShoppingBag,
  Star,
  Store,
  Ticket,
  Video,
} from "lucide-react";

/** Icônes proposées à la création — cas d’usage lien SMS. */
export const SMS_LINK_ICON_IDS = [
  "link",
  "globe",
  "calendar",
  "shopping-bag",
  "store",
  "map-pin",
  "phone",
  "mail",
  "clipboard-list",
  "percent",
  "gift",
  "ticket",
  "star",
  "megaphone",
  "share-2",
  "video",
  "download",
  "credit-card",
] as const;

export type SmsLinkIconId = (typeof SMS_LINK_ICON_IDS)[number];

/** Ordre grille modale — voisins éloignés en teinte (4×4 / 8×2). */
export const SMS_LINK_ICON_PICKER_ORDER: readonly SmsLinkIconId[] = [
  "link",
  "gift",
  "calendar",
  "video",
  "map-pin",
  "megaphone",
  "mail",
  "store",
  "star",
  "globe",
  "phone",
  "ticket",
  "percent",
  "share-2",
  "shopping-bag",
  "download",
  "clipboard-list",
  "credit-card",
];

export const DEFAULT_SMS_LINK_ICON_ID: SmsLinkIconId = "link";

export type SmsLinkIconStyle = {
  tileBg: string;
  tileIcon: string;
};

type SmsLinkIconMeta = SmsLinkIconStyle & {
  Icon: LucideIcon;
  /** Titre court (picker, tooltip). */
  labelFr: string;
};

/** Une teinte de fond distincte par id (light + dark). */
const ICON_META: Record<string, SmsLinkIconMeta> = {
  link: {
    Icon: Link,
    tileBg: "bg-zinc-500/12 dark:bg-zinc-500/22",
    tileIcon: "text-zinc-800 dark:text-zinc-100",
    labelFr: "Lien général",
  },
  /** Legacy rows / ancienne migration */
  "link-2": {
    Icon: Link,
    tileBg: "bg-zinc-500/12 dark:bg-zinc-500/22",
    tileIcon: "text-zinc-800 dark:text-zinc-100",
    labelFr: "Lien général",
  },
  globe: {
    Icon: Globe,
    tileBg: "bg-sky-500/14 dark:bg-sky-500/24",
    tileIcon: "text-sky-900 dark:text-sky-100",
    labelFr: "Site web",
  },
  calendar: {
    Icon: Calendar,
    tileBg: "bg-blue-500/14 dark:bg-blue-500/24",
    tileIcon: "text-blue-900 dark:text-blue-100",
    labelFr: "Prise de rendez-vous",
  },
  "shopping-bag": {
    Icon: ShoppingBag,
    tileBg: "bg-violet-500/14 dark:bg-violet-500/24",
    tileIcon: "text-violet-900 dark:text-violet-100",
    labelFr: "Boutique en ligne",
  },
  store: {
    Icon: Store,
    tileBg: "bg-amber-500/14 dark:bg-amber-500/24",
    tileIcon: "text-amber-950 dark:text-amber-50",
    labelFr: "Fiche établissement",
  },
  "map-pin": {
    Icon: MapPin,
    tileBg: "bg-lime-500/14 dark:bg-lime-500/24",
    tileIcon: "text-lime-900 dark:text-lime-50",
    labelFr: "Plan ou adresse",
  },
  phone: {
    Icon: Phone,
    tileBg: "bg-green-500/14 dark:bg-green-500/24",
    tileIcon: "text-green-900 dark:text-green-50",
    labelFr: "Appeler",
  },
  mail: {
    Icon: Mail,
    tileBg: "bg-rose-500/14 dark:bg-rose-500/24",
    tileIcon: "text-rose-900 dark:text-rose-50",
    labelFr: "Email ou inscription",
  },
  "clipboard-list": {
    Icon: ClipboardList,
    tileBg: "bg-teal-500/14 dark:bg-teal-500/24",
    tileIcon: "text-teal-900 dark:text-teal-50",
    labelFr: "Formulaire",
  },
  percent: {
    Icon: Percent,
    tileBg: "bg-orange-500/14 dark:bg-orange-500/24",
    tileIcon: "text-orange-950 dark:text-orange-50",
    labelFr: "Promotion",
  },
  gift: {
    Icon: Gift,
    tileBg: "bg-pink-500/14 dark:bg-pink-500/24",
    tileIcon: "text-pink-900 dark:text-pink-50",
    labelFr: "Offre cadeau",
  },
  ticket: {
    Icon: Ticket,
    tileBg: "bg-purple-500/14 dark:bg-purple-500/24",
    tileIcon: "text-purple-900 dark:text-purple-50",
    labelFr: "Événement ou billet",
  },
  star: {
    Icon: Star,
    tileBg: "bg-yellow-500/16 dark:bg-yellow-500/24",
    tileIcon: "text-yellow-950 dark:text-yellow-50",
    labelFr: "Avis clients",
  },
  megaphone: {
    Icon: Megaphone,
    tileBg: "bg-indigo-500/14 dark:bg-indigo-500/24",
    tileIcon: "text-indigo-900 dark:text-indigo-50",
    labelFr: "Annonce",
  },
  "share-2": {
    Icon: Share2,
    tileBg: "bg-cyan-500/14 dark:bg-cyan-500/24",
    tileIcon: "text-cyan-950 dark:text-cyan-50",
    labelFr: "Réseaux sociaux",
  },
  video: {
    Icon: Video,
    tileBg: "bg-red-500/14 dark:bg-red-500/24",
    tileIcon: "text-red-900 dark:text-red-50",
    labelFr: "Vidéo",
  },
  download: {
    Icon: Download,
    tileBg: "bg-stone-500/14 dark:bg-stone-500/24",
    tileIcon: "text-stone-900 dark:text-stone-50",
    labelFr: "Document ou PDF",
  },
  "credit-card": {
    Icon: CreditCard,
    tileBg: "bg-emerald-500/14 dark:bg-emerald-500/24",
    tileIcon: "text-emerald-950 dark:text-emerald-50",
    labelFr: "Paiement en ligne",
  },
};

const FALLBACK_META = ICON_META[DEFAULT_SMS_LINK_ICON_ID];

export function isSmsLinkIconId(value: string): value is SmsLinkIconId {
  return (SMS_LINK_ICON_IDS as readonly string[]).includes(value);
}

export function normalizeSmsLinkIconId(
  value: string | null | undefined,
): SmsLinkIconId {
  const v = (value ?? "").trim();
  if (v === "link-2") return "link";
  if (isSmsLinkIconId(v)) return v;
  return DEFAULT_SMS_LINK_ICON_ID;
}

export function smsLinkIconComponent(id: SmsLinkIconId): LucideIcon {
  return (ICON_META[id] ?? FALLBACK_META).Icon;
}

export function smsLinkIconMeta(id: SmsLinkIconId): SmsLinkIconMeta {
  return ICON_META[id] ?? FALLBACK_META;
}

/** Style tuile pour tout id stocké (y compris anciennes valeurs → défaut). */
export function smsLinkIconStyle(id: string): SmsLinkIconStyle {
  const meta = ICON_META[normalizeSmsLinkIconId(id)];
  return { tileBg: meta.tileBg, tileIcon: meta.tileIcon };
}

export function smsLinkIconLabelFr(id: SmsLinkIconId): string {
  return smsLinkIconMeta(id).labelFr;
}
