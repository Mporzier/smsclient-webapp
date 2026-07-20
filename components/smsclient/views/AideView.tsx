"use client";

import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import { openOpenWidget } from "@/lib/openwidget";
import {
  BarChart3,
  Check,
  LayoutTemplate,
  Megaphone,
  MessageSquare,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

type AideViewProps = {
  onGo?: (hash: string) => void;
};

type HelpCardProps = {
  softBg: string;
  color: string;
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
};

function openSupportEmail() {
  window.location.href =
    "mailto:support@smsclient.fr?subject=Aide%20SMSClient";
}

function openSupportContact() {
  if (openOpenWidget("form-contact")) return;
  openSupportEmail();
}

function openHelpResources() {
  window.open("https://smsclient.fr/faq", "_blank", "noopener,noreferrer");
}

function openHelpFaq() {
  if (openOpenWidget("faq")) return;
  openHelpResources();
}

function HelpCard({
  softBg,
  color,
  icon: Icon,
  title,
  description,
  children,
  className,
}: HelpCardProps) {
  return (
    <article
      className={cn(
        "grid min-h-[190px] grid-cols-[58px_1fr] gap-4 rounded-[18px] border border-border bg-card p-6 shadow-[0_12px_35px_rgba(15,31,56,0.05)] min-[1100px]:grid-cols-[72px_1fr] min-[1100px]:gap-[18px]",
        className,
      )}
    >
      <div
        className="grid h-[58px] w-[58px] place-items-center rounded-full"
        style={{ backgroundColor: softBg, color }}
      >
        <Icon className="h-7 w-7" strokeWidth={2} aria-hidden />
      </div>
      <div className="min-w-0">
        <h3 className="m-0 mb-2.5 mt-1 text-[19px] font-extrabold leading-tight text-foreground">
          {title}
        </h3>
        <p className="m-0 text-sm font-semibold leading-relaxed text-muted-foreground">
          {description}
        </p>
        {children}
      </div>
    </article>
  );
}

function WideBtn({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mt-5 h-[42px] w-full cursor-pointer rounded-[13px] border-0 bg-primary text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(52,120,246,0.22)] transition-[filter] hover:brightness-105",
        className,
      )}
    >
      {children}
    </button>
  );
}

function HelpHeroIllustration() {
  return (
    <div
      className="relative z-[1] hidden h-[130px] w-[250px] items-center justify-center min-[1100px]:flex"
      aria-hidden
    >
      <div className="absolute left-2.5 top-1.5 grid h-[52px] w-[82px] place-items-center rounded-[18px] bg-white text-base font-black text-[#2343d2] shadow-[0_14px_30px_rgba(0,0,0,0.16)]">
        •••
      </div>
      <div className="absolute right-1 top-[42px] grid h-[45px] w-[68px] place-items-center rounded-[18px] bg-white text-base font-black text-[#18b979] shadow-[0_14px_30px_rgba(0,0,0,0.16)]">
        ✓
      </div>
      <div className="relative h-24 w-24 rounded-[34px] bg-gradient-to-b from-[#ffd5bd] to-[#f59b72] shadow-[0_22px_45px_rgba(0,0,0,0.18)]">
        <div className="absolute left-[26px] top-5 h-[18px] w-[45px] rounded-full bg-[#1a2b52]" />
        <span className="absolute -bottom-1.5 -right-3.5 text-[42px] leading-none">
          📱
        </span>
      </div>
    </div>
  );
}

export function AideView({ onGo }: AideViewProps) {
  const { t } = useI18n();
  const go = (hash: string) => onGo?.(hash);

  return (
    <div className="relative flex flex-col gap-[18px] pb-16">
      <div className="relative flex min-h-[180px] items-center justify-between overflow-hidden rounded-[22px] bg-gradient-to-br from-[#1632c9] via-[#2358e8] to-[#84c8ff] px-7 py-8 text-white min-[1100px]:px-11 min-[1100px]:py-[34px]">
        <div
          className="pointer-events-none absolute -right-20 -top-[120px] h-[380px] w-[380px] rounded-full bg-white/15"
          aria-hidden
        />
        <div className="relative z-[1] min-w-0">
          <h2 className="m-0 mb-3.5 text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em]">
            {t("help.heroTitle")}
          </h2>
          <p className="m-0 max-w-[560px] text-[15px] font-semibold leading-relaxed text-white/90">
            {t("help.heroBody")}
          </p>
        </div>
        <HelpHeroIllustration />
      </div>

      <div className="grid gap-3.5 min-[1100px]:grid-cols-2">
        <HelpCard
          softBg="#eaf8d8"
          color="#6fbd27"
          icon={Megaphone}
          title={t("help.firstSms.title")}
          description={t("help.firstSms.desc")}
        >
          <ul className="m-0 mt-[22px] grid list-none gap-[11px] p-0">
            {[
              t("help.firstSms.step1"),
              t("help.firstSms.step2"),
              t("help.firstSms.step3"),
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2.5 text-[13px] font-bold text-foreground"
              >
                <Check
                  className="h-5 w-5 shrink-0 text-[#7ac943]"
                  strokeWidth={3}
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>
          <WideBtn onClick={() => go("nouvelle-campagne")}>
            {t("help.firstSms.cta")}
          </WideBtn>
        </HelpCard>

        <HelpCard
          softBg="var(--accent)"
          color="var(--ring)"
          icon={Users}
          title={t("help.contacts.title")}
          description={t("help.contacts.desc")}
        >
          <div className="mt-5 grid gap-2.5">
            {[
              {
                step: 1,
                label: t("help.contacts.step1"),
                hash: "contacts",
              },
              {
                step: 2,
                label: t("help.contacts.step2"),
                hash: "groupes",
              },
            ].map((row) => (
              <div
                key={row.step}
                className="grid min-h-12 grid-cols-[36px_1fr_auto] items-center gap-3 rounded-[13px] border border-border bg-muted/50 px-3.5 text-[13px] font-bold text-muted-foreground"
              >
                <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-accent text-sm font-black text-ring">
                  {row.step}
                </span>
                <span>{row.label}</span>
                <button
                  type="button"
                  onClick={() => go(row.hash)}
                  className="cursor-pointer border-0 bg-transparent p-0 text-[13px] font-extrabold text-ring hover:underline"
                >
                  {t("help.contacts.how")}
                </button>
              </div>
            ))}
          </div>
        </HelpCard>

        <HelpCard
          softBg="#f0e4ff"
          color="#7a35ee"
          icon={Zap}
          title={t("help.ai.title")}
          description={t("help.ai.desc")}
        >
          <div className="mt-[22px] overflow-hidden rounded-[14px] border border-border">
            {[
              { emoji: "✨", label: t("help.ai.gen") },
              { emoji: "✎", label: t("help.ai.fix") },
              { emoji: "✦", label: t("help.ai.tone") },
            ].map((row, index, arr) => (
              <div
                key={row.label}
                className={cn(
                  "grid h-[42px] grid-cols-[26px_1fr_auto] items-center gap-2.5 bg-card px-3.5 text-[13px] font-bold text-muted-foreground",
                  index < arr.length - 1 && "border-b border-border",
                )}
              >
                <span aria-hidden>{row.emoji}</span>
                <span>{row.label}</span>
                <button
                  type="button"
                  onClick={() => go("nouvelle-campagne")}
                  className="cursor-pointer border-0 bg-transparent p-0 text-[13px] font-extrabold text-ring hover:underline"
                >
                  {t("help.ai.discover")}
                </button>
              </div>
            ))}
          </div>
        </HelpCard>

        <HelpCard
          softBg="#fff1cf"
          color="#c97900"
          icon={BarChart3}
          title={t("help.perf.title")}
          description={t("help.perf.desc")}
        >
          <div className="mt-6 grid gap-2.5 min-[1100px]:grid-cols-3">
            {[
              {
                glyph: "↗",
                label: t("help.perf.delivery"),
                hint: t("help.perf.deliveryHint"),
                soft: "#eaf8d8",
                color: "#5aae24",
              },
              {
                glyph: "◉",
                label: t("help.perf.read"),
                hint: t("help.perf.readHint"),
                soft: "var(--accent)",
                color: "var(--ring)",
              },
              {
                glyph: "⌁",
                label: t("help.perf.click"),
                hint: t("help.perf.clickHint"),
                soft: "#f0e4ff",
                color: "#7a35ee",
              },
            ].map((pill) => (
              <div
                key={pill.label}
                className="grid grid-cols-[34px_1fr] items-center gap-2.5 rounded-[13px] border border-border bg-card p-3.5"
              >
                <span
                  className="grid h-[34px] w-[34px] place-items-center rounded-[11px] text-sm font-black"
                  style={{ backgroundColor: pill.soft, color: pill.color }}
                >
                  {pill.glyph}
                </span>
                <span>
                  <b className="block text-xs font-extrabold text-foreground">
                    {pill.label}
                  </b>
                  <small className="text-xs font-bold text-muted-foreground">
                    {pill.hint}
                  </small>
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => go("statistiques")}
            className="mt-5 h-[42px] w-full cursor-pointer rounded-[13px] border-0 bg-[#fff1c8] text-sm font-extrabold text-[#a96b00] transition-[filter] hover:brightness-95"
          >
            {t("help.perf.cta")}
          </button>
        </HelpCard>

        <HelpCard
          softBg="color-mix(in srgb, var(--destructive) 12%, white)"
          color="var(--destructive)"
          icon={MessageSquare}
          title={t("help.support.title")}
          description={t("help.support.desc")}
        >
          <button
            type="button"
            onClick={openSupportContact}
            className="mt-[18px] h-[38px] cursor-pointer rounded-xl border-0 bg-destructive/15 px-[18px] text-[13px] font-extrabold text-destructive transition-[filter] hover:brightness-95"
          >
            {t("help.support.cta")}
          </button>
        </HelpCard>

        <HelpCard
          softBg="var(--accent)"
          color="var(--ring)"
          icon={LayoutTemplate}
          title={t("help.discover.title")}
          description={t("help.discover.desc")}
          className="bg-gradient-to-br from-accent to-accent/60"
        >
          <WideBtn onClick={openHelpFaq} className="mt-5 w-auto px-[34px]">
            {t("help.discover.cta")}
          </WideBtn>
        </HelpCard>
      </div>
    </div>
  );
}
