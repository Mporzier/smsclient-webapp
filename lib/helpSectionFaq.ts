import type { SectionGuideKey } from "@/lib/sectionGuides";
import type { LucideIcon } from "lucide-react";
import {
  Ban,
  Calendar,
  CircleHelp,
  Eye,
  FormInput,
  Link,
  ListChecks,
  MousePointerClick,
  Pencil,
  Plus,
  Send,
  Trash2,
  Upload,
  UserPlus,
  Users,
  Wand2,
} from "lucide-react";

/** Identifiants FAQ contacts — clés i18n `helpFaq.contacts.{id}.*`. */
export type ContactsHelpFaqId =
  | "add"
  | "import"
  | "edit"
  | "groups"
  | "customFields"
  | "stop";

export type GroupesHelpFaqId =
  | "create"
  | "edit"
  | "members"
  | "sendFromGroups"
  | "delete";

export type CampagnesHelpFaqId =
  | "create"
  | "wizardSteps"
  | "statuses"
  | "details"
  | "schedule";

export type LiensHelpFaqId =
  | "whatIs"
  | "create"
  | "track"
  | "campaignUse"
  | "delete";

export type HelpFaqItemId =
  | ContactsHelpFaqId
  | GroupesHelpFaqId
  | CampagnesHelpFaqId
  | LiensHelpFaqId
  | "overview";

export type HelpFaqItemMeta = {
  id: HelpFaqItemId;
  icon: LucideIcon;
  iconWrapClassName: string;
};

/** Fond + couleur icônes / pastilles numéros (modale help). */
export const HELP_FAQ_ICON_SURFACE_CLS =
  "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200";

/** Icônes FAQ liste et header détail. */
export const HELP_FAQ_CARD_ICON_WRAP_CLS = HELP_FAQ_ICON_SURFACE_CLS;

const faqItem = (
  id: HelpFaqItemId,
  icon: LucideIcon,
): HelpFaqItemMeta => ({
  id,
  icon,
  iconWrapClassName: HELP_FAQ_CARD_ICON_WRAP_CLS,
});

const CONTACTS_FAQ: HelpFaqItemMeta[] = [
  faqItem("add", UserPlus),
  faqItem("import", Upload),
  faqItem("edit", Pencil),
  faqItem("groups", Users),
  faqItem("customFields", FormInput),
  faqItem("stop", Ban),
];

const GROUPES_FAQ: HelpFaqItemMeta[] = [
  faqItem("create", Plus),
  faqItem("edit", Pencil),
  faqItem("members", Users),
  faqItem("sendFromGroups", Send),
  faqItem("delete", Trash2),
];

const CAMPAGNES_FAQ: HelpFaqItemMeta[] = [
  faqItem("create", Send),
  faqItem("wizardSteps", Wand2),
  faqItem("statuses", ListChecks),
  faqItem("details", Eye),
  faqItem("schedule", Calendar),
];

const LIENS_FAQ: HelpFaqItemMeta[] = [
  faqItem("whatIs", CircleHelp),
  faqItem("create", Plus),
  faqItem("track", MousePointerClick),
  faqItem("campaignUse", Link),
  faqItem("delete", Trash2),
];

/** FAQ détaillée par section ; les autres sections utilisent la carte « overview ». */
export const SECTION_HELP_FAQ: Partial<
  Record<SectionGuideKey, HelpFaqItemMeta[]>
> = {
  contacts: CONTACTS_FAQ,
  groupes: GROUPES_FAQ,
  campagnes: CAMPAGNES_FAQ,
  liens: LIENS_FAQ,
};

export function helpFaqMessagePrefix(
  section: SectionGuideKey,
  itemId: HelpFaqItemId,
): string {
  return `helpFaq.${section}.${itemId}`;
}

export function listHelpFaqItems(
  section: SectionGuideKey,
  sectionIcon: LucideIcon,
): HelpFaqItemMeta[] {
  const items = SECTION_HELP_FAQ[section];
  if (items?.length) return items;
  return [
    {
      id: "overview",
      icon: sectionIcon,
      iconWrapClassName: HELP_FAQ_CARD_ICON_WRAP_CLS,
    },
  ];
}
