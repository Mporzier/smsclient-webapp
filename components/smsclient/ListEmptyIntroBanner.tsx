"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { isDefaultClientGroupsOnly } from "@/lib/proto/defaultClientGroups";
import { SECTION_GUIDES, type SectionGuideKey } from "@/lib/sectionGuides";
import type { GroupRowData } from "@/lib/types/group";
import {
  CalendarSync,
  CircleUserRound,
  Info,
  Link,
  MessageSquareText,
  Scale,
  Send,
  Users,
  X,
} from "lucide-react";

export type ListEmptyIntroSection = Extract<
  SectionGuideKey,
  | "contacts"
  | "groupes"
  | "campagnes"
  | "liens"
  | "modeles-sms"
  | "automatisations"
  | "reglementations-sms"
>;

const COPY_KEYS: Record<
  ListEmptyIntroSection,
  { title: MessageKey; body: MessageKey }
> = {
  contacts: {
    title: "listIntro.contacts.title",
    body: "listIntro.contacts.body",
  },
  groupes: {
    title: "listIntro.groupes.title",
    body: "listIntro.groupes.body",
  },
  campagnes: {
    title: "listIntro.campagnes.title",
    body: "listIntro.campagnes.body",
  },
  liens: {
    title: "listIntro.liens.title",
    body: "listIntro.liens.body",
  },
  "modeles-sms": {
    title: "listIntro.modeles-sms.title",
    body: "listIntro.modeles-sms.body",
  },
  automatisations: {
    title: "listIntro.automatisations.title",
    body: "listIntro.automatisations.body",
  },
  "reglementations-sms": {
    title: "listIntro.reglementations-sms.title",
    body: "listIntro.reglementations-sms.body",
  },
};

const FALLBACK_ICONS = {
  contacts: CircleUserRound,
  groupes: Users,
  campagnes: Send,
  liens: Link,
  "modeles-sms": MessageSquareText,
  automatisations: CalendarSync,
  "reglementations-sms": Scale,
} as const;

export type ListEmptyIntroBannerProps = {
  section: ListEmptyIntroSection;
  onLearnMore: () => void;
  onDismiss: () => void;
  /** Bandeau plus bas — ex. Conformité SMS */
  compact?: boolean;
  className?: string;
};

export function ListEmptyIntroBanner({
  section,
  onLearnMore,
  onDismiss,
  compact = false,
  className,
}: ListEmptyIntroBannerProps) {
  const { t } = useI18n();
  const Icon = SECTION_GUIDES[section]?.icon ?? FALLBACK_ICONS[section];
  const copy = COPY_KEYS[section];

  return (
    <div
      className={cn(
        "help-accent-surface relative flex flex-col rounded-lg border sm:flex-row sm:items-center",
        compact
          ? "gap-2.5 px-3.5 py-3 sm:gap-3 sm:pr-12"
          : "gap-4 px-5 py-5 sm:gap-5 sm:pr-14",
        className,
      )}
      role="region"
      aria-labelledby={`list-intro-${section}-title`}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute right-1 top-1 size-7 shrink-0 text-help-accent-fg hover:bg-help-accent-bg-hover hover:text-help-accent-fg-hover"
        aria-label={t("listIntro.dismissAria")}
        onClick={onDismiss}
      >
        <X className="size-3.5" aria-hidden />
      </Button>

      <div
        className={cn(
          "help-accent-icon grid shrink-0 place-items-center rounded-lg border",
          compact ? "size-11" : "size-[4.25rem]",
        )}
        aria-hidden
      >
        <Icon
          className={compact ? "size-5" : "size-8"}
          strokeWidth={2}
        />
      </div>

      <div className="min-w-0 flex-1 pr-8 sm:pr-0">
        <h2
          id={`list-intro-${section}-title`}
          className={cn(
            "m-0 text-foreground",
            compact
              ? "text-sm font-semibold leading-snug"
              : "text-base font-extrabold",
          )}
        >
          {t(copy.title)}
        </h2>
        <p
          className={cn(
            "m-0 text-muted-foreground",
            compact
              ? "mt-1 text-xs leading-snug"
              : "mt-1.5 text-[15px] leading-relaxed",
          )}
        >
          {t(copy.body)}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "default"}
        className="w-full shrink-0 sm:w-auto"
        onClick={onLearnMore}
      >
        <Info data-icon="inline-start" className="size-4" aria-hidden />
        {t("listIntro.learnMore")}
      </Button>
    </div>
  );
}

function listIntroBaseVisible(options: {
  loading: boolean;
  searchQuery: string;
  hasActiveFilters?: boolean;
  dismissed: boolean;
}): boolean {
  if (options.dismissed || options.loading) return false;
  if (options.searchQuery.trim() !== "") return false;
  if (options.hasActiveFilters) return false;
  return true;
}

/** Même critère que `DataTable` `isEmpty`. */
export function shouldShowListEmptyIntro(options: {
  loading: boolean;
  dataLength: number;
  searchQuery: string;
  hasActiveFilters?: boolean;
  dismissed: boolean;
}): boolean {
  if (!listIntroBaseVisible(options)) return false;
  return options.dataLength === 0;
}

/** Groupes : liste vide ou uniquement le trio par défaut (Prospects, Clients, Clients VIP). */
export function shouldShowGroupesListIntro(options: {
  loading: boolean;
  rows: GroupRowData[];
  totalCount?: number | null;
  hasMore?: boolean;
  searchQuery: string;
  hasActiveFilters?: boolean;
  dismissed: boolean;
}): boolean {
  if (!listIntroBaseVisible(options)) return false;
  if (options.rows.length === 0) return true;
  return isDefaultClientGroupsOnly(options.rows, {
    totalCount: options.totalCount,
    hasMore: options.hasMore,
  });
}
