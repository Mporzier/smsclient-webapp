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
  | "aide";

/** Structure seule — textes via `guide.{key}.*` dans i18n. */
export type SectionGuideMeta = {
  icon: LucideIcon;
  primaryRoute?: AppRoute;
  kbSlug: KnowledgeBaseArticleSlug;
};

export const SECTION_GUIDES: Record<SectionGuideKey, SectionGuideMeta> = {
  dashboard: {
    icon: LayoutTemplate,
    primaryRoute: "campagnes",
    kbSlug: "accueil",
  },
  contacts: {
    icon: CircleUserRound,
    primaryRoute: "contacts",
    kbSlug: "contacts",
  },
  groupes: {
    icon: Users,
    primaryRoute: "groupes",
    kbSlug: "groupes",
  },
  campagnes: {
    icon: Megaphone,
    primaryRoute: "nouvelle-campagne",
    kbSlug: "campagnes",
  },
  statistiques: {
    icon: BarChart3,
    kbSlug: "statistiques",
  },
  automatisations: {
    icon: CalendarSync,
    kbSlug: "automatisations",
  },
  liens: {
    icon: Link,
    primaryRoute: "liens",
    kbSlug: "liens",
  },
  "modeles-sms": {
    icon: MessageSquareText,
    primaryRoute: "modeles-sms",
    kbSlug: "modeles-sms",
  },
  parametres: {
    icon: Settings,
    kbSlug: "accueil",
  },
  "qr-boutique": {
    icon: QrCode,
    primaryRoute: "statistiques",
    kbSlug: "contacts",
  },
  "reglementations-sms": {
    icon: Scale,
    primaryRoute: "aide",
    kbSlug: "accueil",
  },
  "nouvelle-campagne": {
    icon: Megaphone,
    primaryRoute: "campagnes",
    kbSlug: "campagnes",
  },
  "acheter-credits": {
    icon: Coins,
    kbSlug: "accueil",
  },
  aide: {
    icon: CircleHelp,
    kbSlug: "accueil",
  },
};

/** Map route app → clé de guide (contenu bannière flottante). */
export function guideKeyForRoute(route: AppRoute): SectionGuideKey {
  return route;
}

export function guideMessageKey(
  section: SectionGuideKey,
  part: "eyebrow" | "title" | "desc" | "b1" | "b2" | "b3" | "primary",
): `guide.${SectionGuideKey}.${typeof part}` {
  return `guide.${section}.${part}`;
}
