"use client";

import { useShellHeaderTitle } from "@/components/smsclient/shell/ShellHeaderTitleContext";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/cn";
import {
  helpArticleGroupsForSection,
  resolveHelpArticle,
  type HelpCenterArticleGroup,
} from "@/lib/helpCenterArticles";
import {
  HELP_CENTER_CARDS,
  helpCenterCardAccent,
  helpCenterCardDescKey,
  helpCenterCardLabelKey,
  helpCenterSidebarSubtitleKey,
  helpCenterSidebarSupportTitleKey,
  helpCenterVideoSubtitleKey,
  type HelpCenterCardId,
} from "@/lib/helpCenterSections";
import { HelpArticlePanel } from "@/components/smsclient/views/HelpArticlePanel";
import { helpCenterSectionPath } from "@/lib/helpCenterHash";
import { useI18n } from "@/lib/i18n";
import {
  SECTION_GUIDES,
  guideMessageKey,
  type SectionGuideKey,
} from "@/lib/sectionGuides";
import {
  ArrowUpRight,
  BookOpen,
  CircleCheck,
  CircleHelp,
  ClipboardList,
  FolderOpen,
  Headphones,
  Layers,
  Lightbulb,
  MessageSquare,
  Play,
  Search,
  Send,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

const HELP_GROUP_ICONS: Record<string, LucideIcon> = {
  basics: BookOpen,
  organize: Layers,
  import: Upload,
  target: Send,
  maintain: FolderOpen,
  prepare: ClipboardList,
  message: MessageSquare,
  send: Send,
  advanced: BookOpen,
  run: Send,
  campaigns: Send,
  create: ClipboardList,
  use: BookOpen,
  collect: Upload,
  engage: MessageSquare,
  optimize: Layers,
  essentials: BookOpen,
  practice: ClipboardList,
  credits: BookOpen,
  billing: FolderOpen,
  account: FolderOpen,
  app: Layers,
  "self-service": BookOpen,
  contact: MessageSquare,
};

function helpGroupIcon(groupId: string): LucideIcon {
  return HELP_GROUP_ICONS[groupId] ?? FolderOpen;
}

type AideSectionViewProps = {
  sectionId: HelpCenterCardId;
  articleId: string | null;
  onGo: (path: string) => void;
};

function cardGuideKey(
  card: (typeof HELP_CENTER_CARDS)[number],
): SectionGuideKey | null {
  return "guideKey" in card ? card.guideKey : null;
}

function openSupportEmail() {
  window.location.href =
    "mailto:support@smsclient.fr?subject=Aide%20SMSClient";
}

export function AideSectionView({
  sectionId,
  articleId,
  onGo,
}: AideSectionViewProps) {
  const { t } = useI18n();
  const { setTitleOverride, setHeaderBack } = useShellHeaderTitle();
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    () =>
      articleId && resolveHelpArticle(sectionId, articleId) ? articleId : null,
  );

  const sectionCard = HELP_CENTER_CARDS.find((c) => c.id === sectionId)!;
  const sectionIndex = HELP_CENTER_CARDS.findIndex((c) => c.id === sectionId);
  const guideKey = cardGuideKey(sectionCard);
  const selectedArticle = selectedArticleId
    ? resolveHelpArticle(sectionId, selectedArticleId)
    : null;
  const sectionTopic = t(helpCenterCardLabelKey(sectionId));
  const sectionAccent = helpCenterCardAccent(sectionIndex);
  const SectionIcon =
    sectionId === "support"
      ? CircleHelp
      : guideKey
        ? SECTION_GUIDES[guideKey].icon
        : CircleHelp;

  const learnItems = useMemo(() => {
    if (!guideKey) {
      return [
        t("help.section.learn.support1"),
        t("help.section.learn.support2"),
        t("help.section.learn.support3"),
      ];
    }
    return [
      t(guideMessageKey(guideKey, "b1")),
      t(guideMessageKey(guideKey, "b2")),
      t(guideMessageKey(guideKey, "b3")),
    ];
  }, [guideKey, t]);

  const articleGroups = useMemo(
    () => helpArticleGroupsForSection(sectionId),
    [sectionId],
  );

  const filteredGroups = useMemo((): HelpCenterArticleGroup[] => {
    const needle = normalizeSearch(sidebarSearch);
    if (!needle) return articleGroups;
    return articleGroups
      .map((group) => {
        const groupTitle = normalizeSearch(t(group.titleKey));
        const articles = group.articles.filter((article) => {
          const title = normalizeSearch(t(article.titleKey));
          return title.includes(needle) || groupTitle.includes(needle);
        });
        if (articles.length === 0) return null;
        return { ...group, articles };
      })
      .filter((group): group is HelpCenterArticleGroup => group !== null);
  }, [articleGroups, sidebarSearch, t]);

  useEffect(() => {
    setTitleOverride(t(helpCenterCardLabelKey(sectionId)));
    setHeaderBack({
      label: t("help.section.back"),
      ariaLabel: t("help.section.backAria"),
      onBack: () => onGo("aide"),
    });
    return () => {
      setTitleOverride(null);
      setHeaderBack(null);
    };
  }, [onGo, sectionId, setHeaderBack, setTitleOverride, t]);

  const showArticle = selectedArticleId !== null && selectedArticle !== null;

  return (
    <div className="flex h-full min-h-0 flex-1 gap-4 overflow-hidden">
      <nav
        aria-label={t("help.section.navAria")}
        className={cn(
          "flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-border pr-1",
          showArticle ? "w-[38%] max-w-[420px]" : "w-[60%]",
        )}
      >
        <header className="flex shrink-0 items-start gap-4 pb-3">
          <span
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full"
            style={{
              backgroundColor: sectionAccent.soft,
              color: sectionAccent.color,
            }}
          >
            <SectionIcon className="h-7 w-7" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0 pt-0.5">
            <h1 className="m-0 text-2xl font-semibold leading-tight tracking-tight text-foreground">
              {sectionTopic}
            </h1>
            <p className="m-0 mt-2 text-sm leading-relaxed text-muted-foreground">
              {t(helpCenterSidebarSubtitleKey(sectionId))}
            </p>
          </div>
        </header>

        <div className="shrink-0 border-b border-border pb-4">
          <InputGroup className="h-9 bg-card" role="search">
            <InputGroupAddon align="inline-start">
              <Search className="size-4" aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              className="text-sm"
              placeholder={t("help.section.sidebarSearchPlaceholder")}
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              aria-label={t("help.section.sidebarSearchAria")}
            />
          </InputGroup>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-3 pr-4">
          {filteredGroups.length === 0 ? (
            <p className="m-0 px-1 text-sm text-muted-foreground">
              {t("help.noResults")}
            </p>
          ) : (
            filteredGroups.map((group, groupIndex) => {
              const GroupIcon = helpGroupIcon(group.id);
              const groupAccent = helpCenterCardAccent(
                sectionIndex + groupIndex,
              );
              return (
                <section
                  key={group.id}
                  className="mb-4 rounded-xl border border-border bg-card p-3 shadow-sm last:mb-0"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                      style={{
                        backgroundColor: groupAccent.soft,
                        color: groupAccent.color,
                      }}
                    >
                      <GroupIcon className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </span>
                    <h2 className="m-0 text-sm font-semibold leading-snug text-foreground">
                      {t(group.titleKey)}
                    </h2>
                  </div>
                  <ul className="m-0 flex list-none flex-col gap-0 p-0">
                    {group.articles.map((article, articleIndex) => {
                      const isActive = selectedArticleId === article.id;
                      const isFirst = articleIndex === 0;
                      const isLast =
                        articleIndex === group.articles.length - 1;
                      return (
                        <li key={article.id} className={cn(!isFirst && "-mt-px")}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedArticleId(article.id);
                              onGo(
                                helpCenterSectionPath(sectionId, article.id),
                              );
                            }}
                            className={cn(
                              "relative flex w-full cursor-pointer items-center justify-between gap-3 border border-border bg-transparent px-3 py-2 text-left text-sm transition-colors outline-none hover:z-[1] hover:border-ring/60 hover:bg-muted/55 focus-visible:ring-0",
                              isFirst && isLast && "rounded-lg",
                              isFirst && !isLast && "rounded-t-lg",
                              isLast && !isFirst && "rounded-b-lg",
                              !isFirst && !isLast && "rounded-none",
                              isActive
                                ? "z-[1] border-ring bg-muted/45 font-medium text-foreground"
                                : "font-normal text-foreground",
                            )}
                          >
                            <span className="min-w-0 leading-snug">
                              {t(article.titleKey)}
                            </span>
                            <ArrowUpRight
                              className={cn(
                                "size-4 shrink-0",
                                isActive ? "text-ring" : "text-muted-foreground",
                              )}
                              strokeWidth={2.5}
                              aria-hidden
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })
          )}
        </div>

        <aside className="mt-auto flex shrink-0 flex-col gap-3 rounded-lg border border-border bg-muted/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
              style={{
                backgroundColor: sectionAccent.soft,
                color: sectionAccent.color,
              }}
            >
              <Headphones
                className="h-[18px] w-[18px]"
                strokeWidth={2}
                aria-hidden
              />
            </span>
            <div className="min-w-0">
              <p className="m-0 text-sm font-medium leading-none text-foreground">
                {t(helpCenterSidebarSupportTitleKey(sectionId))}
              </p>
              <p className="m-0 mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                {t("help.section.sidebarSupportDesc")}
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="shrink-0 sm:ml-2"
            onClick={openSupportEmail}
          >
            {t("help.support.cta")}
          </Button>
        </aside>
      </nav>

      {showArticle && selectedArticle ? (
        <HelpArticlePanel sectionId={sectionId} article={selectedArticle} />
      ) : (
      <div className="flex h-full min-h-0 w-[40%] shrink-0 flex-col gap-3 overflow-hidden">
        <article className="shrink-0 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-accent via-accent/85 to-accent/45 p-4 shadow-sm">
          <div className="mb-3 flex items-start gap-3">
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
              style={{
                backgroundColor: sectionAccent.soft,
                color: sectionAccent.color,
              }}
            >
              <SectionIcon className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="m-0 text-sm font-semibold leading-snug text-foreground">
                {t("help.section.videoTitle", { topic: sectionTopic })}
              </h2>
              <p className="m-0 mt-1 text-sm leading-relaxed text-muted-foreground">
                {t(helpCenterVideoSubtitleKey(sectionId))}
              </p>
            </div>
          </div>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border/70 bg-muted">
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-muted/90 to-background/40">
              <span className="grid size-12 place-items-center rounded-full bg-background/95 text-foreground shadow-sm">
                <Play className="ml-0.5 size-5" aria-hidden />
              </span>
            </div>
            <span className="sr-only">
              {selectedArticle
                ? t(selectedArticle.titleKey)
                : t("help.section.videoFallback")}
            </span>
          </div>
        </article>

        <article className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="m-0 shrink-0 text-base font-semibold text-foreground">
            {t("help.section.learnTitle")}
          </h2>
          <p className="m-0 mt-1 shrink-0 text-sm text-muted-foreground">
            {t("help.section.learnSubtitle")}
          </p>
          <ul className="mt-3 flex min-h-0 flex-1 list-none flex-col gap-2.5 overflow-hidden p-0">
            {learnItems.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-foreground">
                <CircleCheck
                  className="mt-0.5 size-4 shrink-0 text-[#6fbd27]"
                  strokeWidth={2}
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <aside className="mt-auto shrink-0 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
          <div className="flex items-start gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <Lightbulb className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="m-0 text-sm font-semibold text-foreground">
                {t("help.section.tipTitle")}
              </h3>
              <p className="m-0 mt-1 text-sm text-muted-foreground">
                {t(helpCenterCardDescKey(sectionId))}
              </p>
            </div>
          </div>
        </aside>
      </div>
      )}
    </div>
  );
}
