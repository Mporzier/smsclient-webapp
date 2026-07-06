"use client";

import { useUserProfile } from "@/components/auth/UserProfileProvider";
import {
  buildRecentActivities,
  countActiveGroups,
  countSentSms,
  countSentSmsThisMonth,
  estimateSmsFromCredits,
  hasUserSentSms,
} from "@/components/smsclient/views/dashboard/dashboardHelpers";
import { SectionGuideCard } from "@/components/smsclient/SectionGuideCard";
import { cn } from "@/lib/cn";
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
  modelesSmsCount?: number;
  modelesSmsLoading?: boolean;
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
        "cursor-pointer border-0 bg-transparent p-0 text-xs font-extrabold text-[#1648e8] hover:underline",
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
    <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eaf3ff] text-[#1648e8]">
      <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
      <span
        className={cn(
          "absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full text-[9px] font-extrabold text-white",
          done ? "bg-[#16b978]" : "bg-[#1648e8]"
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
        "rounded-xl border border-[#dbe5f4] p-3",
        gradient
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/80">
          <Icon className="h-4 w-4 text-[#1648e8]" strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-2xl font-extrabold leading-none text-[#0b1b3f]">
            {value}
          </div>
          <b className="mt-1 block text-xs text-[#0b1b3f]">{label}</b>
          <p className="m-0 mt-0.5 line-clamp-1 text-[11px] leading-snug text-[#3f4d68]">
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
        "rounded-xl border border-[#dbe5f4] p-3.5",
        gradient
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/70">
          <Icon className="h-4 w-4 text-[#1648e8]" strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-sm font-extrabold text-[#0b1b3f]">{title}</h3>
          {value != null && (
            <div className="text-2xl font-extrabold leading-none text-[#0b1b3f]">
              {value}
            </div>
          )}
          <p className="m-0 mt-1 line-clamp-2 text-[11px] leading-snug text-[#344260]">
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
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#bdd5ff] bg-[#f5f9ff] px-3 py-2 text-[11px] text-[#25375c]">
      <span className="font-semibold leading-snug">{children}</span>
      <div className="flex shrink-0 items-center gap-2">
        {action && onAction && (
          <LinkishBtn onClick={onAction}>{action}</LinkishBtn>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="grid h-6 w-6 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-[#64728b] hover:bg-white/70"
            aria-label="Fermer"
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
  return (
    <aside className="grid gap-2.5">
      <SideInfoCard
        icon={Coins}
        title="Crédits restants"
        value={creditsLabel}
        description={creditsHint}
        action="Recharger"
        onAction={() => onGo("acheter-credits")}
        gradient="bg-gradient-to-br from-[#fff6d9] to-white"
      />
      <SideInfoCard
        icon={Shield}
        title="Le saviez-vous ?"
        description="Vos SMS marketing doivent inclure la mention STOP."
        action="En savoir plus"
        onAction={() => onGo("reglementations-sms")}
        gradient="bg-gradient-to-br from-[#eff8ff] to-white"
        actionAsLink
      />
      <SideInfoCard
        icon={Headphones}
        title="Besoin d'aide ?"
        description="Notre centre d'aide vous accompagne à chaque étape."
        action="Centre d'aide"
        onAction={() => onGo("aide")}
        gradient="bg-gradient-to-br from-[#f5f0ff] to-white"
      />
    </aside>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="m-0 mb-2 text-sm font-extrabold text-[#0b1b3f]">
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
  campaignRows,
  campaignsLoading = false,
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
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  const showGuide =
    !contactsLoading &&
    !campaignsLoading &&
    contactsCount === 0 &&
    groupsCount === 0 &&
    campaignRows.length === 0;

  const steps = [
    {
      icon: UserPlus,
      step: 1,
      title: "Ajouter des contacts",
      onClick: () => onGo("contacts"),
    },
    {
      icon: Users,
      step: 2,
      title: "Créer un groupe",
      onClick: () => onGo("groupes"),
    },
    {
      icon: Megaphone,
      step: 3,
      title: "Envoyer un SMS",
      onClick: onNewCampaign,
    },
    {
      icon: Check,
      step: 4,
      title: "C'est parti !",
      done: true,
      onClick: onNewCampaign,
    },
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="m-0 text-2xl font-extrabold leading-tight text-[#0b1b3f]">
          Bienvenue {greetingName} ! 👋
        </h2>
        <p className="m-0 mt-1 text-sm text-[#27385d]">
          Suivez ces étapes pour envoyer votre premier SMS.
        </p>
      </div>

      <div className="grid gap-3 min-[1100px]:grid-cols-[1fr_240px]">
        <div className="flex flex-col gap-3">
          {showGuide && (
            <SectionGuideCard
              section="dashboard"
              onPrimaryAction={onNewCampaign}
              onNavigate={onGo}
            />
          )}

          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[#dbe5f4] bg-white min-[900px]:grid-cols-4">
            {steps.map((step, index) => (
              <button
                key={step.step}
                type="button"
                onClick={step.onClick}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 border-[#dbe5f4] bg-white px-3 py-2.5 text-left",
                  index < 2 && "border-b min-[900px]:border-b-0",
                  index % 2 === 0 && "border-r min-[900px]:border-r",
                  index < 3 && "min-[900px]:border-r",
                )}
              >
                <StepCircle icon={step.icon} step={step.step} done={step.done} />
                <b className="text-xs leading-snug text-[#0b1b3f]">{step.title}</b>
              </button>
            ))}
          </div>

          <section>
            <SectionTitle>Vue d&apos;ensemble</SectionTitle>
            <div className="grid grid-cols-2 gap-2 min-[900px]:grid-cols-4">
              <OverviewMetric
                icon={Coins}
                value={creditsLabel}
                label="Crédits restants"
                hint="Rechargez pour envoyer."
                action="Recharger"
                onAction={() => onGo("acheter-credits")}
                gradient="bg-gradient-to-br from-[#fff7dc] to-white"
              />
              <OverviewMetric
                icon={UserPlus}
                value={contactsLoading ? "…" : String(contactsCount)}
                label="Contacts"
                hint="Ajoutez vos contacts."
                action="Ajouter"
                onAction={() => onGo("contacts")}
                gradient="bg-gradient-to-br from-[#eafff4] to-white"
              />
              <OverviewMetric
                icon={Users}
                value={String(groupsCount)}
                label="Groupes"
                hint="Créez un groupe."
                action="Créer"
                onAction={() => onGo("groupes")}
                gradient="bg-gradient-to-br from-[#f5efff] to-white"
              />
              <OverviewMetric
                icon={Megaphone}
                value="0"
                label="SMS envoyés"
                hint="Aucun SMS pour le moment."
                action="Envoyer"
                onAction={onNewCampaign}
                gradient="bg-gradient-to-br from-[#eff8ff] to-white"
              />
            </div>
          </section>

          {!noticeDismissed && (
            <NoticeBar onDismiss={() => setNoticeDismissed(true)}>
              SMS marketing : mention STOP obligatoire
              {SMS_STOP_SUFFIX.trim()}
            </NoticeBar>
          )}
        </div>

        <DashboardSideColumn
          creditsLabel={creditsLabel}
          creditsHint="Rechargez pour envoyer des SMS."
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
  modelesSmsCount = 0,
  modelesSmsLoading = false,
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
  modelesSmsCount?: number;
  modelesSmsLoading?: boolean;
  onGo: (hash: string) => void;
}) {
  const activities = useMemo(
    () => buildRecentActivities(campaignRows, contacts),
    [campaignRows, contacts],
  );

  const showGuide = !modelesSmsLoading && modelesSmsCount === 0;

  const creditsHint =
    creditsBalance > 0
      ? `≈ ${formatStatsNumber(estimateSmsFromCredits(creditsBalance))} SMS`
      : "Rechargez pour envoyer.";

  const smsHint =
    smsSentThisMonth > 0
      ? `+${formatStatsNumber(smsSentThisMonth)} ce mois-ci`
      : "Voir les statistiques.";

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="m-0 text-2xl font-extrabold leading-tight text-[#0b1b3f]">
          Bonjour {greetingName} ! 👋
        </h2>
        <p className="m-0 mt-1 text-sm text-[#27385d]">
          Voici un aperçu de votre activité.
        </p>
      </div>

      <div className="grid gap-3 min-[1100px]:grid-cols-[1fr_240px]">
        <div className="flex flex-col gap-3">
          {showGuide && (
            <SectionGuideCard section="modeles-sms" onNavigate={onGo} />
          )}

          <section>
            <SectionTitle>Activités récentes</SectionTitle>
            {campaignsLoading ? (
              <p className="m-0 text-xs font-semibold text-[#64728b]">Chargement…</p>
            ) : activities.length === 0 ? (
              <p className="m-0 rounded-xl border border-[#dbe5f4] bg-white px-3 py-2 text-xs text-[#64728b]">
                Aucune activité récente.
              </p>
            ) : (
              <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[#dbe5f4] bg-white min-[900px]:grid-cols-4">
                {activities.map((act) => (
                  <article
                    key={`${act.title}-${act.sortAt}`}
                    className="border-b border-r border-[#dbe5f4] px-3 py-2.5 last:border-r-0 min-[900px]:border-b-0"
                  >
                    <div className="mb-1.5 grid h-8 w-8 place-items-center rounded-full bg-[#eaf3ff] text-[#1648e8]">
                      <act.icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </div>
                    <b className="block text-xs text-[#0b1b3f]">{act.title}</b>
                    <p className="m-0 mt-0.5 line-clamp-2 text-[11px] leading-snug text-[#3b4a68]">
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
            <SectionTitle>Vue d&apos;ensemble</SectionTitle>
            <div className="grid grid-cols-2 gap-2 min-[900px]:grid-cols-4">
              <OverviewMetric
                icon={Coins}
                value={creditsLabel}
                label="Crédits restants"
                hint={creditsHint}
                action="Recharger"
                onAction={() => onGo("acheter-credits")}
                gradient="bg-gradient-to-br from-[#fff7dc] to-white"
              />
              <OverviewMetric
                icon={UserPlus}
                value={contactsLoading ? "…" : formatStatsNumber(contactsCount)}
                label="Contacts"
                hint="Gérez votre base."
                action="Voir contacts"
                onAction={() => onGo("contacts")}
                gradient="bg-gradient-to-br from-[#eafff4] to-white"
              />
              <OverviewMetric
                icon={Users}
                value={formatStatsNumber(groupsCount)}
                label="Groupes"
                hint={
                  activeGroupsCount > 0
                    ? `${formatStatsNumber(activeGroupsCount)} actif${activeGroupsCount > 1 ? "s" : ""}`
                    : "Organisez vos contacts."
                }
                action="Voir groupes"
                onAction={() => onGo("groupes")}
                gradient="bg-gradient-to-br from-[#f5efff] to-white"
              />
              <OverviewMetric
                icon={Megaphone}
                value={formatStatsNumber(smsSentCount)}
                label="SMS envoyés"
                hint={smsHint}
                action="Voir stats"
                onAction={() => onGo("statistiques")}
                gradient="bg-gradient-to-br from-[#eff8ff] to-white"
              />
            </div>
          </section>

          <NoticeBar
            action="Réglementation"
            onAction={() => onGo("reglementations-sms")}
          >
            Consentement des contacts et mention STOP obligatoires.
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
  modelesSmsCount = 0,
  modelesSmsLoading = false,
  onNewCampaign,
  onGo,
}: DashboardViewProps) {
  const { profile, loading: profileLoading } = useUserProfile();

  const greetingName =
    profile?.firstName?.trim() ||
    profile?.companyName?.trim() ||
    "bienvenue";

  const displayCredits = creditsLabel ?? "0";
  const sentSms = hasUserSentSms(campaignRows);
  const smsSentCount = countSentSms(campaignRows);
  const smsSentThisMonth = countSentSmsThisMonth(campaignRows);
  const activeGroupsCount = countActiveGroups(groupRows);

  if (profileLoading) {
    return (
      <p className="m-0 text-sm font-semibold text-[#64728b]">Chargement…</p>
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
        modelesSmsCount={modelesSmsCount}
        modelesSmsLoading={modelesSmsLoading}
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
