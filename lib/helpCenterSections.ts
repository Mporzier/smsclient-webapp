import type { SectionGuideKey } from "@/lib/sectionGuides";
import {
  BarChart3,
  CalendarSync,
  Scale,
  Send,
  Upload,
  type LucideIcon,
} from "lucide-react";

export type HelpCenterCardId =
  | "contacts"
  | "groupes"
  | "campagnes"
  | "statistiques"
  | "automatisations"
  | "liens"
  | "modeles-sms"
  | "qr-boutique"
  | "reglementations-sms"
  | "acheter-credits"
  | "parametres"
  | "support";

type HelpCenterCardMeta =
  | { id: HelpCenterCardId; guideKey: SectionGuideKey; articleCount: number }
  | { id: "support"; action: "support"; articleCount: number };

/** Cartes centre d'aide — ordre grille 4×3. */
export const HELP_CENTER_CARDS: HelpCenterCardMeta[] = [
  { id: "contacts", guideKey: "contacts", articleCount: 8 },
  { id: "groupes", guideKey: "groupes", articleCount: 5 },
  { id: "campagnes", guideKey: "campagnes", articleCount: 12 },
  { id: "statistiques", guideKey: "statistiques", articleCount: 6 },
  { id: "automatisations", guideKey: "automatisations", articleCount: 4 },
  { id: "liens", guideKey: "liens", articleCount: 3 },
  { id: "modeles-sms", guideKey: "modeles-sms", articleCount: 5 },
  { id: "qr-boutique", guideKey: "qr-boutique", articleCount: 7 },
  { id: "reglementations-sms", guideKey: "reglementations-sms", articleCount: 9 },
  { id: "acheter-credits", guideKey: "acheter-credits", articleCount: 4 },
  { id: "parametres", guideKey: "parametres", articleCount: 6 },
  { id: "support", action: "support", articleCount: 3 },
];

export function helpCenterCardLabelKey(
  id: HelpCenterCardId,
): `help.card.${HelpCenterCardId}` {
  return `help.card.${id}`;
}

export function helpCenterCardDescKey(
  id: HelpCenterCardId,
): `help.card.desc.${HelpCenterCardId}` {
  return `help.card.desc.${id}`;
}

export function helpCenterVideoSubtitleKey(
  id: HelpCenterCardId,
): `help.section.videoSubtitle.${HelpCenterCardId}` {
  return `help.section.videoSubtitle.${id}`;
}

export function helpCenterSidebarSupportTitleKey(
  id: HelpCenterCardId,
): `help.section.sidebarSupportTitle.${HelpCenterCardId}` {
  return `help.section.sidebarSupportTitle.${id}`;
}

export function helpCenterSidebarSubtitleKey(
  id: HelpCenterCardId,
): `help.section.sidebarSubtitle.${HelpCenterCardId}` {
  return `help.section.sidebarSubtitle.${id}`;
}

export const HELP_CENTER_POPULAR_ITEMS: {
  queryKey:
    | "help.popular.q1"
    | "help.popular.q2"
    | "help.popular.q3"
    | "help.popular.q4"
    | "help.popular.q5";
  icon: LucideIcon;
}[] = [
  { queryKey: "help.popular.q1", icon: Upload },
  { queryKey: "help.popular.q2", icon: Send },
  { queryKey: "help.popular.q3", icon: CalendarSync },
  { queryKey: "help.popular.q4", icon: BarChart3 },
  { queryKey: "help.popular.q5", icon: Scale },
];

const HELP_CARD_ACCENTS: { soft: string; color: string }[] = [
  { soft: "var(--accent)", color: "var(--ring)" },
  { soft: "#eaf8d8", color: "#6fbd27" },
  { soft: "#f0e4ff", color: "#7a35ee" },
  { soft: "#fff1cf", color: "#c97900" },
  { soft: "#e8f4ff", color: "#2358e8" },
  { soft: "#fce8ef", color: "#d6456a" },
];

export function helpCenterCardAccent(index: number): {
  soft: string;
  color: string;
} {
  return HELP_CARD_ACCENTS[index % HELP_CARD_ACCENTS.length]!;
}
