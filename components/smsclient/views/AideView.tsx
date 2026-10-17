"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { helpArticlesForSection } from "@/lib/helpCenterArticles";
import {
  helpCenterSectionPath,
  parseHelpCenterHash,
} from "@/lib/helpCenterHash";
import {
  HELP_CENTER_CARDS,
  HELP_CENTER_POPULAR_ITEMS,
  helpCenterCardAccent,
  helpCenterCardDescKey,
  helpCenterCardLabelKey,
} from "@/lib/helpCenterSections";
import type { MessageKey } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n";
import { openOpenWidget } from "@/lib/openwidget";
import { AideSectionView } from "@/components/smsclient/views/AideSectionView";
import {
  SECTION_GUIDES,
  guideMessageKey,
  type SectionGuideKey,
} from "@/lib/sectionGuides";
import { ArrowUpRight, CircleHelp, Headphones, Search } from "lucide-react";
import { useMemo, useState } from "react";

type AideViewProps = {
  onGo?: (hash: string) => void;
  hashPath?: string;
};

type HelpCenterCard = (typeof HELP_CENTER_CARDS)[number];

const HELP_FOOTER_ICON_ACCENT = helpCenterCardAccent(
  HELP_CENTER_CARDS.findIndex((card) => card.id === "support"),
);

function openSupportEmail() {
  window.location.href =
    "mailto:support@smsclient.fr?subject=Aide%20SMSClient";
}

function openSupportContact() {
  if (openOpenWidget("form-contact")) return;
  openSupportEmail();
}

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function cardGuideKey(card: HelpCenterCard): SectionGuideKey | null {
  return "guideKey" in card ? card.guideKey : null;
}

function HelpTopicCard({
  card,
  index,
  onGo,
  t,
}: {
  card: HelpCenterCard;
  index: number;
  onGo?: (path: string) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}) {
  const accent = helpCenterCardAccent(index);
  const label = t(helpCenterCardLabelKey(card.id));
  const description = t(helpCenterCardDescKey(card.id));
  const guideKey = cardGuideKey(card);
  const Icon =
    card.id === "support"
      ? CircleHelp
      : guideKey
        ? SECTION_GUIDES[guideKey].icon
        : CircleHelp;

  const handleOpen = () => {
    onGo?.(helpCenterSectionPath(card.id));
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      }}
      className="group flex h-full min-h-0 cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:bg-muted/35"
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center self-center rounded-full"
        style={{ backgroundColor: accent.soft, color: accent.color }}
      >
        <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
      </span>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-1">
        <h3 className="m-0 text-sm font-semibold leading-tight text-foreground">
          {label}
        </h3>
        <p className="m-0 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {t("help.card.articlesCount", {
              count: helpArticlesForSection(card.id).length,
            })}
          </span>
          <ArrowUpRight
            className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-ring"
            strokeWidth={2.5}
            aria-hidden
          />
        </div>
      </div>
    </article>
  );
}

export function AideView({ onGo, hashPath = "aide" }: AideViewProps) {
  const helpState = parseHelpCenterHash(hashPath);
  if (helpState.sectionId && onGo) {
    return (
      <AideSectionView
        key={helpState.sectionId}
        sectionId={helpState.sectionId}
        articleId={helpState.articleId}
        onGo={onGo}
      />
    );
  }
  return <AideHubView onGo={onGo} />;
}

function AideHubView({ onGo }: { onGo?: (hash: string) => void }) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");

  const cardSearchIndex = useMemo(() => {
    return HELP_CENTER_CARDS.map((card) => {
      const label = t(helpCenterCardLabelKey(card.id));
      const guideKey = cardGuideKey(card);
      const parts = [label];
      parts.push(t(helpCenterCardDescKey(card.id)));
      if (guideKey) {
        parts.push(
          t(guideMessageKey(guideKey, "title")),
          t(guideMessageKey(guideKey, "desc")),
          t(guideMessageKey(guideKey, "b1")),
          t(guideMessageKey(guideKey, "b2")),
          t(guideMessageKey(guideKey, "b3")),
        );
      }
      return { card, haystack: normalizeSearch(parts.join(" ")) };
    });
  }, [t]);

  const filteredCards = useMemo(() => {
    const needle = normalizeSearch(searchQuery);
    if (!needle) return [...HELP_CENTER_CARDS];
    return cardSearchIndex
      .filter((row) => row.haystack.includes(needle))
      .map((row) => row.card);
  }, [searchQuery, cardSearchIndex]);

  const showFullGrid = filteredCards.length === HELP_CENTER_CARDS.length;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2">
      <section className="shrink-0 rounded-[20px] bg-gradient-to-br from-accent via-accent/90 to-accent/50 px-5 py-5 md:px-6 md:py-6">
        <h2 className="m-0 text-xl font-extrabold leading-tight tracking-[-0.02em] text-foreground md:text-2xl">
          {t("help.pageTitle")}{" "}
          <span aria-hidden className="inline-block">
            👋
          </span>
        </h2>
        <p className="m-0 mt-1 text-sm font-semibold text-foreground/85 md:text-[15px]">
          {t("help.pageSubtitle")}
        </p>
        <div className="mt-4 max-w-xl">
          <InputGroup className="h-9 border-border/60 bg-card shadow-sm" role="search">
            <InputGroupAddon align="inline-start">
              <Search className="size-4" aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              className="text-sm"
              placeholder={t("help.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={t("help.searchAria")}
            />
          </InputGroup>
        </div>
        <div className="mt-4 flex flex-col gap-2.5">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.05em] text-foreground/70">
            {t("help.popularLabel")}
          </span>
          <div className="flex min-w-0 flex-wrap gap-2">
            {HELP_CENTER_POPULAR_ITEMS.map(({ queryKey, icon: Icon }) => {
              const label = t(queryKey);
              const active =
                normalizeSearch(searchQuery) === normalizeSearch(label);
              return (
                <Button
                  key={queryKey}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery(label)}
                  className={cn(
                    "rounded-md border-border/70 bg-card/90 font-bold shadow-none",
                    active && "border-ring bg-card text-ring",
                  )}
                >
                  <Icon data-icon="inline-start" aria-hidden />
                  {label}
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {filteredCards.length === 0 ? (
        <p className="m-0 flex flex-1 items-center justify-center rounded-[14px] border border-dashed border-border bg-muted/30 px-4 text-center text-sm font-semibold text-muted-foreground">
          {t("help.noResults")}
        </p>
      ) : showFullGrid ? (
        <div className="grid min-h-0 flex-1 grid-cols-4 grid-rows-3 gap-2">
          {filteredCards.map((card, index) => (
            <HelpTopicCard
              key={card.id}
              card={card}
              index={index}
              onGo={onGo}
              t={t}
            />
          ))}
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-4 gap-2 overflow-auto">
          {filteredCards.map((card, index) => (
            <HelpTopicCard
              key={card.id}
              card={card}
              index={index}
              onGo={onGo}
              t={t}
            />
          ))}
        </div>
      )}

      <footer className="flex shrink-0 flex-col gap-4 rounded-lg border border-border bg-muted/30 px-4 py-4 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between min-[900px]:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
            style={{
              backgroundColor: HELP_FOOTER_ICON_ACCENT.soft,
              color: HELP_FOOTER_ICON_ACCENT.color,
            }}
          >
            <Headphones className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-none text-foreground">
              {t("help.footer.title")}
            </p>
            <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
              {t("help.footer.desc")}
            </p>
          </div>
        </div>
        <Button
          type="button"
          className="shrink-0"
          onClick={openSupportContact}
        >
          {t("help.support.cta")}
        </Button>
      </footer>
    </div>
  );
}
