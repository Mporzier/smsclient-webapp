"use client";

import { CountryFlag } from "@/components/smsclient/CountryFlag";
import { ListEmptyIntroBanner } from "@/components/smsclient/ListEmptyIntroBanner";
import { SearchBar } from "@/components/smsclient/Shell";
import { useShellHelpActions } from "@/components/smsclient/shell/ShellHeaderTitleContext";
import { fieldBox } from "@/components/smsclient/flowFieldStyles";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  REGULATION_SECTION_ORDER,
  SMS_REGULATIONS,
  type CountryRegulations,
  type RegulationSectionContent,
  type RegulationSectionKey,
  type SmsRegulationCountry,
} from "@/lib/proto/smsRegulations";
import {
  AlertTriangle,
  Users,
  UserCheck,
  Megaphone,
  MessageSquare,
  Clock,
  FileText,
  Ban,
  ExternalLink,
  BadgeCheck,
  Info,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

const SECTION_ICONS: Record<RegulationSectionKey, LucideIcon> = {
  whoToContact: Users,
  consent: UserCheck,
  marketingSms: Megaphone,
  transactionalSms: MessageSquare,
  allowedHours: Clock,
  legalMentions: FileText,
  stopManagement: Ban,
  officialLinks: ExternalLink,
};

const PREVIEW_LEFT_KEYS = REGULATION_SECTION_ORDER.slice(4);
const PREVIEW_RIGHT_KEYS = REGULATION_SECTION_ORDER.slice(0, 4);

const HIGHLIGHT_SECTION_KEYS: RegulationSectionKey[] = [
  "allowedHours",
  "stopManagement",
  "legalMentions",
];

type HighlightSectionKey = (typeof HIGHLIGHT_SECTION_KEYS)[number];

const HIGHLIGHT_CARD_THEMES: Record<
  HighlightSectionKey,
  {
    card: string;
    iconWrap: string;
    icon: string;
  }
> = {
  allowedHours: {
    card: "bg-sky-50 dark:bg-sky-950/25",
    iconWrap: "bg-sky-100 dark:bg-sky-900/50",
    icon: "text-sky-700 dark:text-sky-400",
  },
  stopManagement: {
    card: "bg-rose-50 dark:bg-rose-950/25",
    iconWrap: "bg-rose-100 dark:bg-rose-900/50",
    icon: "text-rose-700 dark:text-rose-400",
  },
  legalMentions: {
    card: "bg-violet-50 dark:bg-violet-950/25",
    iconWrap: "bg-violet-100 dark:bg-violet-900/50",
    icon: "text-violet-700 dark:text-violet-400",
  },
};

const DROPDOWN_SECTION_KEYS = REGULATION_SECTION_ORDER.filter(
  (key) => !HIGHLIGHT_SECTION_KEYS.includes(key),
);

function sectionLabelKey(key: RegulationSectionKey): MessageKey {
  return `regs.section.${key}` as MessageKey;
}

function highlightTitleKey(key: RegulationSectionKey): MessageKey {
  if (key === "stopManagement") return "regs.highlight.stop";
  if (key === "legalMentions") return "regs.highlight.expediteur";
  return sectionLabelKey(key);
}

function countryLabelKey(id: SmsRegulationCountry): MessageKey {
  return `regs.country.${id}` as MessageKey;
}

function RegulationPreviewBullet({
  sectionKey,
  label,
}: {
  sectionKey: RegulationSectionKey;
  label: string;
}) {
  const Icon = SECTION_ICONS[sectionKey];
  return (
    <li className="flex items-center gap-2">
      <span
        className="grid size-5 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"
        aria-hidden
      >
        <Icon className="size-3" strokeWidth={2.25} />
      </span>
      <span className="min-w-0 text-xs font-medium leading-snug text-muted-foreground">
        {label}
      </span>
    </li>
  );
}

function RegulationSectionLinks({
  links,
}: {
  links: NonNullable<RegulationSectionContent["links"]>;
}) {
  return (
    <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
      {links.map((link) => (
        <li key={link.url}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

function RegulationHighlightCard({
  sectionKey,
  content,
  title,
}: {
  sectionKey: HighlightSectionKey;
  content: RegulationSectionContent;
  title: string;
}) {
  const Icon = SECTION_ICONS[sectionKey];
  const theme = HIGHLIGHT_CARD_THEMES[sectionKey];

  return (
    <Card
      size="sm"
      className={cn(
        "h-full min-w-0 shadow-none ring-0",
        theme.card,
      )}
    >
      <CardHeader className="flex-row items-center gap-2.5 space-y-0">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg",
            theme.iconWrap,
          )}
          aria-hidden
        >
          <Icon className={cn("size-4", theme.icon)} strokeWidth={2.25} />
        </span>
        <CardTitle className="min-w-0 leading-snug">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-line text-pretty text-xs font-medium leading-snug text-muted-foreground">
          {content.body}
        </p>
      </CardContent>
    </Card>
  );
}

function RegulationSectionDropdown({
  sectionKey,
  content,
  title,
  open,
  onToggle,
}: {
  sectionKey: RegulationSectionKey;
  content: RegulationSectionContent;
  title: string;
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = SECTION_ICONS[sectionKey];
  const panelId = `regs-section-${sectionKey}`;

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        id={`${panelId}-trigger`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className={cn(
          "flex w-full cursor-pointer items-start gap-2.5 px-3 py-3 text-left transition-colors duration-200",
          !open && "hover:bg-muted/50",
        )}
      >
        <Icon
          className="mt-0.5 size-4 shrink-0 text-ring"
          strokeWidth={2.25}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {!open ? (
            <p className="mt-0.5 line-clamp-1 text-xs font-medium leading-snug text-muted-foreground">
              {content.body}
            </p>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-in-out",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div
            id={panelId}
            role="region"
            aria-labelledby={`${panelId}-trigger`}
            className={cn(
              "border-t border-border px-3 pb-3 pt-3 transition-opacity duration-300 ease-in-out",
              open ? "opacity-100" : "opacity-0",
            )}
          >
            <p className="text-xs font-medium leading-snug text-muted-foreground">
              {content.body}
            </p>
            {content.links && content.links.length > 0 ? (
              <RegulationSectionLinks links={content.links} />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function matchesCountrySearch(
  country: CountryRegulations,
  query: string,
  translatedLabel: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    country.label.toLowerCase().includes(q) ||
    translatedLabel.toLowerCase().includes(q) ||
    country.id.includes(q) ||
    country.authority.toLowerCase().includes(q)
  );
}

export function ReglementationsSmsView() {
  const { t } = useI18n();
  const { openHelp } = useShellHelpActions();
  const [country, setCountry] = useState<SmsRegulationCountry>("fr");
  const [searchQuery, setSearchQuery] = useState("");
  const [introDismissed, setIntroDismissed] = useState(false);
  const [openDropdownKey, setOpenDropdownKey] =
    useState<RegulationSectionKey | null>(null);
  const [openDropdownCountry, setOpenDropdownCountry] =
    useState<SmsRegulationCountry>(country);
  if (country !== openDropdownCountry) {
    setOpenDropdownCountry(country);
    setOpenDropdownKey(null);
  }

  const filteredCountries = useMemo(
    () =>
      SMS_REGULATIONS.filter((c) =>
        matchesCountrySearch(c, searchQuery, t(countryLabelKey(c.id))),
      ),
    [searchQuery, t],
  );

  const active =
    SMS_REGULATIONS.find((c) => c.id === country) ?? SMS_REGULATIONS[0];

  const toggleDropdown = (key: RegulationSectionKey) => {
    setOpenDropdownKey((current) => (current === key ? null : key));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      {!introDismissed ? (
        <ListEmptyIntroBanner
          section="reglementations-sms"
          compact
          className="shrink-0"
          onLearnMore={openHelp}
          onDismiss={() => setIntroDismissed(true)}
        />
      ) : null}

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,400px)_minmax(0,2fr)]">
      <div
        className={cn(
          fieldBox,
          "flex min-h-0 flex-col gap-3 overflow-y-auto py-4",
        )}
      >
        <div className="flex min-h-0 flex-col gap-2">
          <p className="m-0 shrink-0 text-sm font-semibold text-foreground">
            {t("regs.step1")}
          </p>

          <div className="shrink-0 [&>div]:mt-0">
            <SearchBar
              placeholder={t("regs.searchPh")}
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>

          <p className="m-0 shrink-0 text-xs font-medium text-muted-foreground">
            {t("regs.orList")}
          </p>

          <ul
            className="m-0 flex shrink-0 list-none flex-col gap-1.5 p-0"
            role="listbox"
            aria-label={t("regs.countriesAria")}
          >
            {filteredCountries.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs font-medium text-muted-foreground">
                {t("regs.empty")}
              </li>
            ) : (
              filteredCountries.map((c) => {
                const selected = c.id === country;
                return (
                  <li key={c.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => setCountry(c.id)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                        selected
                          ? "border-primary bg-accent ring-1 ring-primary/10"
                          : "border-border bg-card hover:bg-muted/50",
                      )}
                    >
                      <CountryFlag country={c.id} className="h-5 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">
                          {t(countryLabelKey(c.id))}
                        </span>
                        <span className="block truncate text-xs font-medium text-muted-foreground">
                          {c.authority}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <Alert className="shrink-0 border-amber-200/80 bg-amber-50/90 text-amber-950 [&>svg]:text-amber-700">
          <AlertTriangle aria-hidden />
          <AlertTitle>{t("regs.important")}</AlertTitle>
          <AlertDescription className="text-xs text-amber-900/90">
            {t("regs.importantBody")}
          </AlertDescription>
        </Alert>

        <div className="shrink-0">
          <h2 className="m-0 text-sm font-semibold text-foreground">
            {t("regs.previewTitle")}
          </h2>
          <div className="mt-2 grid grid-cols-2 gap-x-3">
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {PREVIEW_LEFT_KEYS.map((key) => (
                <RegulationPreviewBullet
                  key={key}
                  sectionKey={key}
                  label={t(sectionLabelKey(key))}
                />
              ))}
            </ul>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {PREVIEW_RIGHT_KEYS.map((key) => (
                <RegulationPreviewBullet
                  key={key}
                  sectionKey={key}
                  label={t(sectionLabelKey(key))}
                />
              ))}
            </ul>
          </div>
        </div>

      </div>

      <div
        className={cn(
          fieldBox,
          "flex min-h-0 min-w-0 flex-col py-4",
        )}
      >
        <div className="mb-3 shrink-0 space-y-3 border-b border-border pb-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <CountryFlag country={active.id} className="h-7 shrink-0" />
            <div className="min-w-0">
              <h2 className="m-0 text-base font-semibold text-foreground">
                {t(countryLabelKey(active.id))}
              </h2>
              <p className="m-0 mt-0.5 text-xs font-medium text-muted-foreground">
                {active.authority}
              </p>
            </div>
          </div>
          <Alert className="border-emerald-200/80 bg-emerald-50/90 text-emerald-950 [&>svg]:text-emerald-700">
            <BadgeCheck aria-hidden />
            <AlertTitle className="text-emerald-950">
              {t("regs.marketingBannerTitle")}
            </AlertTitle>
            <AlertDescription className="text-xs text-emerald-900/90">
              {t("regs.marketingBannerSubtitle")}
            </AlertDescription>
          </Alert>
        </div>

        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 content-start gap-2.5 overflow-y-auto">
          <div className="grid min-w-0 shrink-0 grid-cols-1 gap-3 sm:grid-cols-3 sm:[&>*]:min-w-0">
            {HIGHLIGHT_SECTION_KEYS.map((key) => (
              <RegulationHighlightCard
                key={key}
                sectionKey={key}
                title={t(highlightTitleKey(key))}
                content={active.sections[key]}
              />
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            {DROPDOWN_SECTION_KEYS.map((key) => (
              <RegulationSectionDropdown
                key={key}
                sectionKey={key}
                title={t(sectionLabelKey(key))}
                content={active.sections[key]}
                open={openDropdownKey === key}
                onToggle={() => toggleDropdown(key)}
              />
            ))}
          </div>
        </div>

        <Alert
          role="note"
          aria-label={t("regs.disclaimerAria")}
          className="mt-3 shrink-0 border-yellow-300/90 bg-yellow-100 text-yellow-950"
        >
          <Info className="text-yellow-700" aria-hidden />
          <AlertDescription className="text-xs leading-snug text-yellow-900/95">
            {t("regs.disclaimer")}
          </AlertDescription>
        </Alert>
      </div>
      </div>
    </div>
  );
}
