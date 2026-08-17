"use client";

import { useUserProfile } from "@/components/auth/UserProfileProvider";
import { LoadingLabel } from "@/components/ui/loading-label";
import {
  buildRecentActivities,
  countActiveGroups,
  countSentSms,
  countSentSmsThisMonth,
  estimateSmsFromCredits,
  hasUserSentSms,
} from "@/components/smsclient/views/dashboard/dashboardHelpers";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import { formatStatsNumber } from "@/lib/supabase/statistics";
import { SMS_STOP_SUFFIX } from "@/lib/proto/smsStopMention";
import type { CampaignRowData } from "@/lib/types/campaign";
import type { ContactRowData } from "@/lib/types/contact";
import type { GroupRowData } from "@/lib/types/group";
import {
  Check,
  Coins,
  Headphones,
  Megaphone,
  Shield,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

type DashboardViewProps = {
  creditsLabel?: string;
  creditsBalance?: number;
  contactsCount: number;
  groupsCount: number;
  campaignRows: CampaignRowData[];
  groupRows: GroupRowData[];
  contacts: ContactRowData[];
  contactsLoading?: boolean;
  campaignsLoading?: boolean;
  onNewCampaign: () => void;
  onGo: (hash: string) => void;
};

function LinkishBtn({
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
        "cursor-pointer border-0 bg-transparent p-0 text-xs font-extrabold text-primary hover:underline",
        className
      )}
    >
      {children}
    </button>
  );
}

function StepCircle({
  icon: Icon,
  step,
  done,
}: {
  icon: LucideIcon;
  step: number;
  done?: boolean;
}) {
  return (
    <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-primary">
      <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
      <span
        className={cn(
          "absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full text-[9px] font-extrabold text-white",
          done ? "bg-emerald-500" : "bg-primary"
        )}
      >
        {step}
      </span>
    </div>
  );
}

function OverviewMetric({
  icon: Icon,
  value,
  label,
  hint,
  action,
  onAction,
  gradient,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  hint: string;
  action: string;
  onAction: () => void;
  gradient: string;
}) {
  return (
    <article
      className={cn(
        "rounded-xl border border-border p-3",
        gradient
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-card/80">
          <Icon className="h-4 w-4 text-primary" strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-2xl font-extrabold leading-none text-foreground">
            {value}
          </div>
          <b className="mt-1 block text-xs text-foreground">{label}</b>
          <p className="m-0 mt-0.5 line-clamp-1 text-[11px] leading-snug text-muted-foreground">
            {hint}
          </p>
        </div>
      </div>
      <LinkishBtn onClick={onAction} className="mt-2">
        {action} →
      </LinkishBtn>
    </article>
  );
}

function SideInfoCard({
  icon: Icon,
  title,
  value,
  description,
  action,
  onAction,
  gradient,
  actionAsLink,
}: {
  icon: LucideIcon;
  title: string;
  value?: string;
  description: string;
  action: string;
  onAction: () => void;
  gradient: string;
  actionAsLink?: boolean;
}) {
  return (
    <article
      className={cn(
        "rounded-xl border border-border p-3.5",
        gradient
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-card/70">
          <Icon className="h-4 w-4 text-primary" strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-sm font-extrabold text-foreground">{title}</h3>
          {value != null && (
            <div className="text-2xl font-extrabold leading-none text-foreground">
              {value}
            </div>
          )}
          <p className="m-0 mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
            {description}
          </p>
          {actionAsLink ? (
            <LinkishBtn onClick={onAction} className="mt-1.5">
              {action}
            </LinkishBtn>
          ) : (
            <LinkishBtn onClick={onAction} className="mt-1.5">
              {action} →
            </LinkishBtn>
          )}
        </div>
      </div>
    </article>
  );
}

function NoticeBar({
  children,
  action,
  onAction,
  onDismiss,
}: {
  children: ReactNode;
  action?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-accent px-3 py-2 text-[11px] text-muted-foreground">
      <span className="font-semibold leading-snug">{children}</span>
      <div className="flex shrink-0 items-center gap-2">
        {action && onAction && (
          <LinkishBtn onClick={onAction}>{action}</LinkishBtn>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="grid h-6 w-6 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted-foreground hover:bg-card/70"
            aria-label={t("dashboard.closeNotice")}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}

function DashboardSideColumn({
  creditsLabel,
  creditsHint,
  onGo,
}: {
  creditsLabel: string;
  creditsHint: string;
  onGo: (hash: string) => void;
}) {
  const { t } = useI18n();
  return (
    <aside className="grid gap-2.5">
      <SideInfoCard
        icon={Coins}
        title={t("dashboard.creditsRemaining")}
        value={creditsLabel}
        description={creditsHint}
        action={t("dashboard.recharge")}
        onAction={() => onGo("acheter-credits")}
        gradient="bg-gradient-to-br from-[#fff6d9] to-card"
      />
      <SideInfoCard
        icon={Shield}
        title={t("dashboard.didYouKnow")}
        description={t("dashboard.stopHint")}
        action={t("dashboard.learnMore")}
        onAction={() => onGo("reglementations-sms")}
        gradient="bg-gradient-to-br from-accent to-card"
        actionAsLink
      />
      <SideInfoCard
        icon={Headphones}
        title={t("dashboard.needHelp")}
        description={t("dashboard.helpDesc")}
        action={t("dashboard.helpCenter")}
        onAction={() => onGo("aide")}
        gradient="bg-gradient-to-br from-[#f5f0ff] to-card"
      />
    </aside>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="m-0 mb-2 text-sm font-extrabold text-foreground">
      {children}
    </h3>
  );
}

function DashboardFirstVisit({
  greetingName,
  creditsLabel,
  contactsCount,
  groupsCount,
  contactsLoading,
  onNewCampaign,
  onGo,
}: {
  greetingName: string;
  creditsLabel: string;
  contactsCount: number;
  groupsCount: number;
  contactsLoading?: boolean;
  campaignRows: CampaignRowData[];
  campaignsLoading?: boolean;
  onNewCampaign: () => void;
  onGo: (hash: string) => void;
}) {
  const { t } = useI18n();
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  const steps = [
    {
      icon: UserPlus,
      step: 1,
      title: t("dashboard.step.contacts"),
      onClick: () => onGo("contacts"),
    },
    {
      icon: Users,
      step: 2,
      title: t("dashboard.step.group"),
      onClick: () => onGo("groupes"),
    },
    {
      icon: Megaphone,
      step: 3,
      title: t("dashboard.step.sms"),
      onClick: onNewCampaign,
    },
    {
      icon: Check,
      step: 4,
      title: t("dashboard.step.go"),
      done: true,
      onClick: onNewCampaign,
    },
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="m-0 text-2xl font-extrabold leading-tight text-foreground">
          {t("dashboard.welcome", { name: greetingName })}
        </h2>
        <p className="m-0 mt-1 text-sm text-muted-foreground">
          {t("dashboard.welcomeSubtitle")}
        </p>
      </div>

      <div className="grid gap-3 min-[1100px]:grid-cols-[1fr_240px]">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card min-[900px]:grid-cols-4">
            {steps.map((step, index) => (
              <button
                key={step.step}
                type="button"
                onClick={step.onClick}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 border-border bg-card px-3 py-2.5 text-left",
                  index < 2 && "border-b min-[900px]:border-b-0",
                  index % 2 === 0 && "border-r min-[900px]:border-r",
                  index < 3 && "min-[900px]:border-r",
                )}
              >
                <StepCircle
                  icon={step.icon}
                  step={step.step}
                  done={"done" in step ? step.done : undefined}
                />
                <b className="text-xs leading-snug text-foreground">{step.title}</b>
              </button>
            ))}
          </div>

          <section>
            <SectionTitle>{t("dashboard.overview")}</SectionTitle>
            <div className="grid grid-cols-2 gap-2 min-[900px]:grid-cols-4">
              <OverviewMetric
                icon={Coins}
                value={creditsLabel}
                label={t("dashboard.creditsRemaining")}
                hint={t("dashboard.creditsHintSend")}
                action={t("dashboard.recharge")}
                onAction={() => onGo("acheter-credits")}
                gradient="bg-gradient-to-br from-[#fff7dc] to-card"
              />
              <OverviewMetric
                icon={UserPlus}
                value={contactsLoading ? "…" : String(contactsCount)}
                label={t("dashboard.contacts")}
                hint={t("dashboard.contactsHintAdd")}
                action={t("dashboard.add")}
                onAction={() => onGo("contacts")}
                gradient="bg-gradient-to-br from-[#eafff4] to-card"
              />
              <OverviewMetric
                icon={Users}
                value={String(groupsCount)}
                label={t("dashboard.groups")}
                hint={t("dashboard.groupsHintCreate")}
                action={t("dashboard.create")}
                onAction={() => onGo("groupes")}
                gradient="bg-gradient-to-br from-[#f5efff] to-card"
              />
              <OverviewMetric
                icon={Megaphone}
                value="0"
                label={t("dashboard.smsSent")}
                hint={t("dashboard.smsHintNone")}
                action={t("dashboard.send")}
                onAction={onNewCampaign}
                gradient="bg-gradient-to-br from-accent to-card"
              />
            </div>
          </section>

          {!noticeDismissed && (
            <NoticeBar onDismiss={() => setNoticeDismissed(true)}>
              {t("dashboard.noticeStop")}
              {SMS_STOP_SUFFIX.trim()}
            </NoticeBar>
          )}
        </div>

        <DashboardSideColumn
          creditsLabel={creditsLabel}
          creditsHint={t("dashboard.creditsHintSms")}
          onGo={onGo}
        />
      </div>
    </div>
  );
}

function DashboardReturning({
  greetingName,
  creditsLabel,
  creditsBalance,
  contactsCount,
  groupsCount,
  smsSentCount,
  smsSentThisMonth,
  activeGroupsCount,
  campaignRows,
  contacts,
  contactsLoading,
  campaignsLoading,
  onGo,
}: {
  greetingName: string;
  creditsLabel: string;
  creditsBalance: number;
  contactsCount: number;
  groupsCount: number;
  smsSentCount: number;
  smsSentThisMonth: number;
  activeGroupsCount: number;
  campaignRows: CampaignRowData[];
  contacts: ContactRowData[];
  contactsLoading?: boolean;
  campaignsLoading?: boolean;
  onGo: (hash: string) => void;
}) {
  const { t } = useI18n();
  const activities = useMemo(
    () => buildRecentActivities(campaignRows, contacts, t),
    [campaignRows, contacts, t],
  );

  const creditsHint =
    creditsBalance > 0
      ? t("dashboard.creditsApproxSms", {
          n: formatStatsNumber(estimateSmsFromCredits(creditsBalance)),
        })
      : t("dashboard.creditsHintSend");

  const smsHint =
    smsSentThisMonth > 0
      ? t("dashboard.smsHintMonth", {
          n: formatStatsNumber(smsSentThisMonth),
        })
      : t("dashboard.smsHintStats");

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="m-0 text-2xl font-extrabold leading-tight text-foreground">
          {t("dashboard.hello", { name: greetingName })}
        </h2>
        <p className="m-0 mt-1 text-sm text-muted-foreground">
          {t("dashboard.helloSubtitle")}
        </p>
      </div>

      <div className="grid gap-3 min-[1100px]:grid-cols-[1fr_240px]">
        <div className="flex flex-col gap-3">
          <section>
            <SectionTitle>{t("dashboard.recentActivity")}</SectionTitle>
            {campaignsLoading ? (
              <p className="m-0 text-xs font-semibold text-muted-foreground">
                {t("common.loading")}
              </p>
            ) : activities.length === 0 ? (
              <p className="m-0 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                {t("dashboard.noActivity")}
              </p>
            ) : (
              <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card min-[900px]:grid-cols-4">
                {activities.map((act) => (
                  <article
                    key={`${act.title}-${act.sortAt}`}
                    className="border-b border-r border-border px-3 py-2.5 last:border-r-0 min-[900px]:border-b-0"
                  >
                    <div className="mb-1.5 grid h-8 w-8 place-items-center rounded-full bg-accent text-primary">
                      <act.icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </div>
                    <b className="block text-xs text-foreground">{act.title}</b>
                    <p className="m-0 mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                      {act.description.replace("\n", " · ")}
                    </p>
                    <span
                      className={cn(
                        "mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                        act.tagClassName,
                      )}
                    >
                      {act.tag}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionTitle>{t("dashboard.overview")}</SectionTitle>
            <div className="grid grid-cols-2 gap-2 min-[900px]:grid-cols-4">
              <OverviewMetric
                icon={Coins}
                value={creditsLabel}
                label={t("dashboard.creditsRemaining")}
                hint={creditsHint}
                action={t("dashboard.recharge")}
                onAction={() => onGo("acheter-credits")}
                gradient="bg-gradient-to-br from-[#fff7dc] to-card"
              />
              <OverviewMetric
                icon={UserPlus}
                value={contactsLoading ? "…" : formatStatsNumber(contactsCount)}
                label={t("dashboard.contacts")}
                hint={t("dashboard.contactsHintManage")}
                action={t("dashboard.viewContacts")}
                onAction={() => onGo("contacts")}
                gradient="bg-gradient-to-br from-[#eafff4] to-card"
              />
              <OverviewMetric
                icon={Users}
                value={formatStatsNumber(groupsCount)}
                label={t("dashboard.groups")}
                hint={
                  activeGroupsCount > 0
                    ? t(
                        activeGroupsCount > 1
                          ? "dashboard.groupsActiveMany"
                          : "dashboard.groupsActiveOne",
                        { n: formatStatsNumber(activeGroupsCount) },
                      )
                    : t("dashboard.groupsHintOrganize")
                }
                action={t("dashboard.viewGroups")}
                onAction={() => onGo("groupes")}
                gradient="bg-gradient-to-br from-[#f5efff] to-card"
              />
              <OverviewMetric
                icon={Megaphone}
                value={formatStatsNumber(smsSentCount)}
                label={t("dashboard.smsSent")}
                hint={smsHint}
                action={t("dashboard.viewStats")}
                onAction={() => onGo("statistiques")}
                gradient="bg-gradient-to-br from-accent to-card"
              />
            </div>
          </section>

          <NoticeBar
            action={t("dashboard.regulation")}
            onAction={() => onGo("reglementations-sms")}
          >
            {t("dashboard.noticeConsent")}
          </NoticeBar>
        </div>

        <DashboardSideColumn
          creditsLabel={creditsLabel}
          creditsHint={creditsHint}
          onGo={onGo}
        />
      </div>
    </div>
  );
}

export function DashboardView({
  creditsLabel,
  creditsBalance = 0,
  contactsCount,
  groupsCount,
  campaignRows,
  groupRows,
  contacts,
  contactsLoading = false,
  campaignsLoading = false,
  onNewCampaign,
  onGo,
}: DashboardViewProps) {
  const { profile, loading: profileLoading } = useUserProfile();
  const { t } = useI18n();

  const greetingName =
    profile?.firstName?.trim() ||
    profile?.companyName?.trim() ||
    t("dashboard.greetingFallback");

  const displayCredits = creditsLabel ?? "0";
  const sentSms = hasUserSentSms(campaignRows);
  const smsSentCount = countSentSms(campaignRows);
  const smsSentThisMonth = countSentSmsThisMonth(campaignRows);
  const activeGroupsCount = countActiveGroups(groupRows);

  if (profileLoading) {
    return (
      <p className="m-0 text-sm font-semibold text-muted-foreground">
        <LoadingLabel>{t("common.loading")}</LoadingLabel>
      </p>
    );
  }

  if (sentSms) {
    return (
      <DashboardReturning
        greetingName={greetingName}
        creditsLabel={displayCredits}
        creditsBalance={creditsBalance}
        contactsCount={contactsCount}
        groupsCount={groupsCount}
        smsSentCount={smsSentCount}
        smsSentThisMonth={smsSentThisMonth}
        activeGroupsCount={activeGroupsCount}
        campaignRows={campaignRows}
        contacts={contacts}
        contactsLoading={contactsLoading}
        campaignsLoading={campaignsLoading}
        onGo={onGo}
      />
    );
  }

  return (
    <DashboardFirstVisit
      greetingName={greetingName}
      creditsLabel={displayCredits}
      contactsCount={contactsCount}
      groupsCount={groupsCount}
      contactsLoading={contactsLoading}
      campaignRows={campaignRows}
      campaignsLoading={campaignsLoading}
      onNewCampaign={onNewCampaign}
      onGo={onGo}
    />
  );
}
