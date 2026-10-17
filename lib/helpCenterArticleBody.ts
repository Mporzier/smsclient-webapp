import type { HelpCenterCardId } from "@/lib/helpCenterSections";
import type { MessageKey } from "@/lib/i18n/messages";

export type HelpArticleBodyBlock = {
  id: string;
  titleKey: MessageKey;
  bodyKey: MessageKey;
};

export type HelpArticleBodyContent = {
  introKey: MessageKey;
  blocks: HelpArticleBodyBlock[];
};

function introKey(
  sectionId: HelpCenterCardId,
  articleId: string,
): MessageKey {
  return `help.articleBody.${sectionId}.${articleId}.intro` as MessageKey;
}

function blockBodyKey(
  sectionId: HelpCenterCardId,
  articleId: string,
  blockId: string,
): MessageKey {
  return `help.articleBody.${sectionId}.${articleId}.${blockId}.body` as MessageKey;
}

const STANDARD_BLOCKS: { id: string; titleKey: MessageKey }[] = [
  {
    id: "before",
    titleKey: "help.articleBody.block.before.title",
  },
  {
    id: "inApp",
    titleKey: "help.articleBody.block.inApp.title",
  },
  {
    id: "result",
    titleKey: "help.articleBody.block.result.title",
  },
];

/** Contenu article — clés spécifiques si présentes dans i18n, sinon fallback générique. */
export function getHelpArticleBodyContent(
  sectionId: HelpCenterCardId,
  articleId: string,
): HelpArticleBodyContent {
  return {
    introKey: introKey(sectionId, articleId),
    blocks: STANDARD_BLOCKS.map((block) => ({
      id: block.id,
      titleKey: block.titleKey,
      bodyKey: blockBodyKey(sectionId, articleId, block.id),
    })),
  };
}

export function helpArticleBodyFallbackIntroKey(): MessageKey {
  return "help.articleBody.fallback.intro";
}

export function helpArticleBodyFallbackBlockKey(
  blockId: string,
): MessageKey {
  return `help.articleBody.fallback.${blockId}.body` as MessageKey;
}
