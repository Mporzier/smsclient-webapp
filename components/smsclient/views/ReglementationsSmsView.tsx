"use client";

import { CountryFlag } from "@/components/smsclient/CountryFlag";
import { SearchBar } from "@/components/smsclient/Shell";
import { fieldBox } from "@/components/smsclient/flowFieldStyles";
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
  Scale,
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

function sectionLabelKey(key: RegulationSectionKey): MessageKey {
  return `regs.section.${key}` as MessageKey;
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
        className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-[#2f6fed]/15 bg-[#eef4ff] text-[#2f6fed]"
        aria-hidden
      >
        <Icon className="h-2.5 w-2.5" />
      </span>
      <span className="min-w-0 text-[11px] font-semibold leading-snug text-slate-700">
        {label}
      </span>
    </li>
  );
}

function RegulationSectionCard({
  sectionKey,
  content,
  title,
}: {
  sectionKey: RegulationSectionKey;
  content: RegulationSectionContent;
  title: string;
}) {
  const Icon = SECTION_ICONS[sectionKey];

  return (
    <section className="rounded-xl border border-slate-200/90 bg-slate-50/60 px-3 py-2.5">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-[#2f6fed]/15 bg-[#eef4ff] text-[#2f6fed]">
          <Icon className="h-3 w-3" aria-hidden />
        </span>
        <h3 className="m-0 text-xs font-black text-[#1f3b77]">{title}</h3>
      </div>
      <p className="m-0 text-[11px] font-semibold leading-snug text-slate-600">
        {content.body}
      </p>
      {content.links && content.links.length > 0 ? (
        <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
          {content.links.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2f6fed] hover:underline"
              >
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
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
  const [country, setCountry] = useState<SmsRegulationCountry>("fr");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = useMemo(
    () =>
      SMS_REGULATIONS.filter((c) =>
        matchesCountrySearch(c, searchQuery, t(countryLabelKey(c.id))),
      ),
    [searchQuery, t],
  );

  const active =
    SMS_REGULATIONS.find((c) => c.id === country) ?? SMS_REGULATIONS[0];

  const riskLabel =
    active.riskLevel === "faible"
      ? t("regs.risk.faible")
      : active.riskLevel;

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
      <div
        className={cn(
          fieldBox,
          "flex min-h-0 flex-col gap-3 overflow-y-auto py-4",
        )}
      >
        <div className="shrink-0">
          <div className="flex items-start gap-2.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#2f6fed]/20 bg-[#eef4ff] text-[#2f6fed]">
              <Scale className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="m-0 text-base font-black leading-snug text-slate-900">
                {t("regs.title")}
              </h1>
              <p className="m-0 mt-1 text-xs font-semibold leading-snug text-slate-500">
                {t("regs.subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-2">
          <p className="m-0 shrink-0 text-xs font-black text-slate-800">
            {t("regs.step1")}
          </p>

          <div className="shrink-0 [&>div]:mt-0">
            <SearchBar
              placeholder={t("regs.searchPh")}
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>

          <p className="m-0 shrink-0 text-[11px] font-semibold text-slate-500">
            {t("regs.orList")}
          </p>

          <ul
            className="m-0 flex shrink-0 list-none flex-col gap-1.5 p-0"
            role="listbox"
            aria-label={t("regs.countriesAria")}
          >
            {filteredCountries.length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs font-semibold text-slate-500">
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
                          ? "border-[#2f6fed] bg-[#eef4ff] shadow-[inset_0_0_0_1px_rgba(47,111,237,0.12)]"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80",
                      )}
                    >
                      <CountryFlag country={c.id} className="h-5 w-[30px]" />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block text-sm font-extrabold",
                            selected ? "text-[#1f3b77]" : "text-slate-900",
                          )}
                        >
                          {t(countryLabelKey(c.id))}
                        </span>
                        <span className="block truncate text-[10px] font-semibold text-slate-500">
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

        <div className="flex shrink-0 items-start gap-2.5 rounded-xl border border-amber-200/90 bg-amber-50 px-3 py-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="m-0 text-xs font-black text-amber-900">
              {t("regs.important")}
            </p>
            <p className="m-0 mt-0.5 text-[11px] font-semibold leading-snug text-amber-800/90">
              {t("regs.importantBody")}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <h2 className="m-0 text-xs font-black text-slate-900">
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

        <div className="mt-auto flex shrink-0 items-start gap-2 rounded-xl border border-yellow-200/90 bg-yellow-50 px-3 py-2.5">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-yellow-100 text-yellow-700">
            <Info className="h-3.5 w-3.5" aria-hidden />
          </span>
          <p className="m-0 text-[10px] font-semibold leading-snug text-yellow-900/90">
            {t("regs.disclaimer")}
          </p>
        </div>
      </div>

      <div
        className={cn(
          fieldBox,
          "flex min-h-0 flex-col overflow-hidden py-4",
        )}
      >
        <div className="mb-3 flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <CountryFlag country={active.id} className="h-7 w-10" />
            <h2 className="m-0 text-base font-black text-slate-900">
              {t(countryLabelKey(active.id))}
            </h2>
          </div>
          <div className="flex shrink-0 items-start gap-2 rounded-xl border border-emerald-200/90 bg-emerald-50 px-2.5 py-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-700">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="m-0 text-[11px] font-black leading-snug text-emerald-900">
                {t("regs.compliant")}
              </p>
              <p className="m-0 text-[10px] font-semibold capitalize text-emerald-800/85">
                {t("regs.riskLevel", { level: riskLabel })}
              </p>
            </div>
          </div>
        </div>

        <p className="m-0 mb-2.5 shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          {active.authority}
        </p>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {REGULATION_SECTION_ORDER.map((key) => (
            <RegulationSectionCard
              key={key}
              sectionKey={key}
              title={t(sectionLabelKey(key))}
              content={active.sections[key]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
