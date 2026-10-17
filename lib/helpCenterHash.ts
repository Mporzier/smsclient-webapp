import {
  HELP_CENTER_CARDS,
  type HelpCenterCardId,
} from "@/lib/helpCenterSections";

export function isHelpCenterCardId(value: string): value is HelpCenterCardId {
  return HELP_CENTER_CARDS.some((card) => card.id === value);
}

export type HelpCenterHashState = {
  sectionId: HelpCenterCardId | null;
  articleId: string | null;
};

/** Parse `#aide`, `#aide/contacts`, `#aide/contacts/import`. */
export function parseHelpCenterHash(hashPath: string): HelpCenterHashState {
  const parts = hashPath.replace(/^#/, "").trim().split("/").filter(Boolean);
  if (parts[0] !== "aide" || parts.length < 2) {
    return { sectionId: null, articleId: null };
  }
  const sectionRaw = parts[1] ?? "";
  if (!isHelpCenterCardId(sectionRaw)) {
    return { sectionId: null, articleId: null };
  }
  return {
    sectionId: sectionRaw,
    articleId: parts[2]?.trim() || null,
  };
}

export function helpCenterSectionPath(
  sectionId: HelpCenterCardId,
  articleId?: string,
): string {
  if (articleId) return `aide/${sectionId}/${articleId}`;
  return `aide/${sectionId}`;
}
