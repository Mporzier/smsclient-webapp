"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import {
  getHelpArticleBodyContent,
  helpArticleBodyFallbackBlockKey,
  helpArticleBodyFallbackIntroKey,
} from "@/lib/helpCenterArticleBody";
import { getHelpArticleBodyCopy } from "@/lib/helpCenterArticleBodyCopy";
import type { HelpCenterArticle } from "@/lib/helpCenterArticles";
import {
  helpCenterCardLabelKey,
  type HelpCenterCardId,
} from "@/lib/helpCenterSections";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import { ImageIcon } from "lucide-react";

type HelpArticlePanelProps = {
  sectionId: HelpCenterCardId;
  article: HelpCenterArticle;
  className?: string;
};

function resolveMessage(
  t: (key: MessageKey, vars?: Record<string, string | number>) => string,
  key: MessageKey,
  fallbackKey: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const primary = t(key, vars);
  if (primary !== key) return primary;
  return t(fallbackKey, vars);
}

function blockBodyFromCopy(
  blockId: string,
  copy: NonNullable<ReturnType<typeof getHelpArticleBodyCopy>>,
  locale: "fr" | "en",
): string {
  if (blockId === "before") return copy.before[locale];
  if (blockId === "inApp") return copy.inApp[locale];
  if (blockId === "result") return copy.result[locale];
  return "";
}

export function HelpArticlePanel({
  sectionId,
  article,
  className,
}: HelpArticlePanelProps) {
  const { locale, t } = useI18n();
  const content = getHelpArticleBodyContent(sectionId, article.id);
  const copy = getHelpArticleBodyCopy(sectionId, article.id);
  const articleTitle = t(article.titleKey);
  const sectionLabel = t(helpCenterCardLabelKey(sectionId));

  const intro =
    copy?.intro[locale] ??
    resolveMessage(t, content.introKey, helpArticleBodyFallbackIntroKey(), {
      title: articleTitle,
    });

  return (
    <article
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-7">
        <Badge variant="secondary" className="mb-3 font-medium">
          {sectionLabel}
        </Badge>
        <h1 className="m-0 text-2xl font-semibold tracking-tight text-foreground md:text-[1.65rem]">
          {articleTitle}
        </h1>
        <p className="mt-3 max-w-[62ch] text-base leading-relaxed text-muted-foreground">
          {intro}
        </p>

        <div className="my-6 h-px bg-border" role="separator" />

        <div className="flex flex-col gap-8">
          {content.blocks.map((block, index) => {
            const blockTitle = t(block.titleKey);
            const blockBody =
              (copy && blockBodyFromCopy(block.id, copy, locale)) ||
              resolveMessage(
                t,
                block.bodyKey,
                helpArticleBodyFallbackBlockKey(block.id),
                { title: articleTitle },
              );
            return (
              <section key={block.id} className="flex flex-col gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="m-0 text-lg font-semibold text-foreground">
                    {blockTitle}
                  </h2>
                </div>
                <p className="m-0 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
                  {blockBody}
                </p>
                <figure className="m-0 overflow-hidden rounded-lg border border-dashed border-border bg-muted/35">
                  <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 px-6 text-center">
                    <span className="grid size-11 place-items-center rounded-full border border-border bg-background text-muted-foreground">
                      <ImageIcon className="size-5" aria-hidden />
                    </span>
                    <figcaption className="text-sm font-medium text-foreground">
                      {t("help.articleBody.illustration.label")}
                    </figcaption>
                    <p className="m-0 max-w-sm text-xs leading-relaxed text-muted-foreground">
                      {t("help.articleBody.illustration.hint")}
                    </p>
                  </div>
                </figure>
              </section>
            );
          })}
        </div>
      </div>
    </article>
  );
}
