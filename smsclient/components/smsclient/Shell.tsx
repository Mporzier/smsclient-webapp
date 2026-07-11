"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useUserProfile } from "@/components/auth/UserProfileProvider";
import { HeaderHelpMenu } from "@/components/smsclient/HeaderHelpMenu";
import { MonProfilModal } from "@/components/smsclient/modals/MonProfilModal";
import { CampaignWizardStepper } from "@/components/smsclient/CreateCampaign/CampaignWizardStepper";
import { cn } from "@/lib/cn";
import { contactInitials } from "@/lib/proto/contactDisplay";
import { useRouter } from "next/navigation";
import type { AppRoute } from "@/lib/proto/routes";
import {
  navOverrideForRoute,
  ROUTE_TITLES,
  isCampaignWizardRoute,
} from "@/lib/proto/routes";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BarChart3,
  Bell,
  CalendarSync,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CircleUserRound,
  Coins,
  LayoutDashboard,
  Link,
  LogOut,
  Megaphone,
  MoreHorizontal,
  Plus,
  Search,
  MessageSquareText,
  QrCode,
  Scale,
  Settings,
  UserRound,
  Users,
  type LucideIcon,
  LayoutTemplate,
} from "lucide-react";
import { LogoMark } from "@/components/smsclient/shell/LogoMark";
import {
  APP_CANVAS_CLASS, MAIN_PANEL_CLASS, SIDEBAR_W_COLLAPSED, SIDEBAR_W_EXPANDED,
  assistanceNav, generalNav, toolsNav, SidebarNavSection, SidebarHoverTooltip, SidebarMenuIcon, navMainIconStroke,
} from "@/components/smsclient/shell/SidebarNav";
export { SearchBar } from "@/components/smsclient/shell/SearchBar";

export function AppShell({
  route,
  go,
  onNewCampaign,
  creditsLabel,
  campaignWizardStep,
  children,
}: ShellProps) {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const router = useRouter();
  const active = navOverrideForRoute(route);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isCampaignWizard = isCampaignWizardRoute(route);

  const email = user?.email ?? "";

  const displayName = useMemo(() => {
    if (profileLoading) return null;

    const first = profile?.firstName?.trim() ?? "";
    const last = profile?.lastName?.trim() ?? "";
    const full = [first, last].filter(Boolean).join(" ");
    if (full) return full;
    const company = profile?.companyName?.trim();
    if (company) return company;
    const local = email.split("@")[0]?.trim();
    return local || "Mon compte";
  }, [profile, profileLoading, email]);

  const initials = useMemo(() => {
    if (profileLoading) return null;

    if (profile?.firstName?.trim() || profile?.lastName?.trim()) {
      return contactInitials({
        firstName: profile.firstName,
        lastName: profile.lastName,
      });
    }
    const local = email.split("@")[0]?.trim();
    return local ? local.slice(0, 2).toUpperCase() : "?";
  }, [profile, profileLoading, email]);

  useEffect(() => {
    if (!profileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [profileOpen]);

  async function handleLogout() {
    setProfileOpen(false);
    await signOut();
    router.replace("/auth/login");
  }

  function toggleSidebar() {
    setProfileOpen(false);
    setSidebarCollapsed((collapsed) => !collapsed);
  }

  return (
    <div className={cn("h-screen w-screen", APP_CANVAS_CLASS)}>
      <div
        className={cn("flex h-full w-full min-w-0 overflow-hidden", APP_CANVAS_CLASS)}
        role="application"
        aria-label="smsclient.fr - Application SMS"
      >
        <div
          className={cn(
            "relative z-30 flex h-full min-h-0 shrink-0 p-3 transition-[width] duration-200 ease-out max-[860px]:hidden",
            sidebarCollapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED
          )}
        >
          <div className="relative flex h-full min-h-0 w-full flex-col overflow-visible rounded-3xl border border-[#e5edf6] bg-white px-3 py-3.5">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-expanded={!sidebarCollapsed}
              aria-label={
                sidebarCollapsed
                  ? "Ouvrir le menu latéral"
                  : "Fermer le menu latéral"
              }
              className="absolute right-0 top-8 z-40 grid h-7 w-7 translate-x-1/2 cursor-pointer place-items-center rounded-full border border-[#e5edf6] bg-white text-[#1831c9] transition-colors hover:bg-slate-50"
            >
              {sidebarCollapsed ? (
                <ChevronRight
                  className="h-4 w-4"
                  strokeWidth={2.5}
                  aria-hidden
                />
              ) : (
                <ChevronLeft
                  className="h-4 w-4"
                  strokeWidth={2.5}
                  aria-hidden
                />
              )}
            </button>

            <div
              className={cn(
                "mb-7 flex shrink-0 items-center",
                sidebarCollapsed ? "justify-center px-0" : "gap-2 px-2"
              )}
            >
              <div
                className="grid h-[27px] w-[27px] shrink-0 place-items-center"
                aria-hidden
              >
                <LogoMark size={27} />
              </div>
              {!sidebarCollapsed && (
                <span className="min-w-0 truncate text-lg font-extrabold leading-none text-[#14284f]">
                  smsclient.fr
                </span>
              )}
            </div>

            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col",
                sidebarCollapsed ? "overflow-visible" : "overflow-y-auto"
              )}
            >
              <SidebarNavSection
                label="Général"
                items={generalNav}
                active={active}
                onGo={go}
                collapsed={sidebarCollapsed}
              />
              <SidebarNavSection
                label="Outils"
                items={toolsNav}
                active={active}
                onGo={go}
                bordered
                collapsed={sidebarCollapsed}
              />
              <SidebarNavSection
                label="Assistance"
                items={assistanceNav}
                active={active}
                onGo={go}
                bordered
                collapsed={sidebarCollapsed}
              />
            </div>

            <div className="relative shrink-0 border-t border-[#dfe6f0] pt-2.5">
              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setProfileOpen(false)}
                    aria-hidden
                  />
                  <div
                    className={cn(
                      "absolute z-50 overflow-hidden rounded-2xl border border-[#e5edf6] bg-white p-1.5 shadow-[0_18px_48px_rgba(15,31,56,0.16)]",
                      sidebarCollapsed
                        ? "bottom-0 left-[calc(100%+10px)] mb-0 w-[220px]"
                        : "bottom-full left-0 right-0 mb-2"
                    )}
                    role="menu"
                    aria-label="Menu du compte"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="flex h-[35px] w-full cursor-pointer items-center gap-[9px] rounded-full px-2.5 text-left text-xs font-bold text-[#293852] transition-colors hover:bg-[#f5f8fd]"
                    >
                      <SidebarMenuIcon icon={UserRound} />
                      Mon profil
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileOpen(false);
                        go("parametres");
                      }}
                      className="flex h-[35px] w-full cursor-pointer items-center gap-[9px] rounded-full px-2.5 text-left text-xs font-bold text-[#293852] transition-colors hover:bg-[#f5f8fd]"
                    >
                      <SidebarMenuIcon icon={Settings} />
                      Paramètres
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileOpen(false);
                        go("acheter-credits");
                      }}
                      className="flex h-[35px] w-full cursor-pointer items-center gap-[9px] rounded-full px-2.5 text-left text-xs font-bold text-[#293852] transition-colors hover:bg-[#f5f8fd]"
                    >
                      <SidebarMenuIcon icon={Coins} />
                      Crédits
                      {creditsLabel ? (
                        <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-slate-600">
                          {creditsLabel}
                        </span>
                      ) : null}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileOpen(false);
                        go("soumettre-avis");
                      }}
                      className="flex h-[35px] w-full cursor-pointer items-center gap-[9px] rounded-full px-2.5 text-left text-xs font-bold text-[#293852] transition-colors hover:bg-[#f5f8fd]"
                    >
                      <SidebarMenuIcon icon={MessageSquareText} />
                      Soumettre un avis
                    </button>
                    <div
                      className="mx-1 my-1.5 h-px bg-[#edf1f6]"
                      role="separator"
                      aria-hidden
                    />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void handleLogout()}
                      className="group flex h-[35px] w-full cursor-pointer items-center gap-[9px] rounded-full px-2.5 text-left text-xs font-bold text-[#e13b54] transition-colors hover:bg-[#f5f8fd]"
                    >
                      <span
                        className="grid h-[17px] w-[17px] shrink-0 place-items-center text-[#e13b54]"
                        aria-hidden
                      >
                        <LogOut
                          className="h-4 w-4"
                          strokeWidth={navMainIconStroke}
                          aria-hidden
                        />
                      </span>
                      Se déconnecter
                    </button>
                  </div>
                </>
              )}

              <div
                className={cn(
                  "items-center",
                  sidebarCollapsed
                    ? "flex flex-col gap-2"
                    : "grid grid-cols-[32px_1fr_24px] gap-2"
                )}
              >
                <SidebarHoverTooltip
                  label={displayName ?? "Mon compte"}
                  enabled={sidebarCollapsed}
                >
                  <div
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#1831c9] text-[11px] font-extrabold text-white"
                    aria-hidden
                  >
                    {initials ?? (
                      <span className="text-[11px] font-extrabold opacity-80">
                        …
                      </span>
                    )}
                  </div>
                </SidebarHoverTooltip>
                {!sidebarCollapsed && (
                  <span className="min-w-0 truncate text-xs font-bold leading-tight text-[#14284f]">
                    {displayName ?? (
                      <span className="inline-block h-3 w-16 animate-pulse rounded bg-slate-200/80 align-middle" />
                    )}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  aria-label="Menu du compte"
                  className={cn(
                    "grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-[#7d8ba0] transition-colors hover:bg-slate-100 hover:text-[#18243a]",
                    profileOpen && "bg-[#e9f5ff] text-[#1831c9]",
                    sidebarCollapsed && "mx-auto"
                  )}
                >
                  <MoreHorizontal
                    className="h-4 w-4"
                    strokeWidth={navMainIconStroke}
                    aria-hidden
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col p-3 pl-0 max-[860px]:pl-3">
          <div className={MAIN_PANEL_CLASS}>
          <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-[#e5edf6] px-4 pr-[22px] md:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="hidden min-w-0 items-center gap-1.5 max-[860px]:flex">
                <div
                  className="grid h-10 w-10 shrink-0 place-items-center"
                  aria-hidden
                >
                  <LogoMark size={40} />
                </div>
                <span className="min-w-0 truncate text-lg font-semibold leading-none text-slate-900">
                  smsclient.fr
                </span>
              </div>
              <h1 className="m-0 shrink-0 text-lg font-extrabold text-slate-700">
                {ROUTE_TITLES[route]}
              </h1>
              {isCampaignWizard && campaignWizardStep != null && (
                <CampaignWizardStepper current={campaignWizardStep} compact />
              )}
            </div>
            <div className="flex items-center gap-2.5">
              {creditsLabel && (
                <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700">
                  <Coins className="h-4 w-4 text-[#2f6fed]" aria-hidden />
                  {creditsLabel} · Crédits restants
                </div>
              )}
              <button
                type="button"
                onClick={onNewCampaign}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border-none bg-gradient-to-br from-[#4a86ff] to-[#2f6fed] px-3.5 py-1.5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(47,111,237,0.2)] transition-all hover:brightness-[1.03]"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                Nouvelle campagne
              </button>
              <HeaderHelpMenu />
              <button
                type="button"
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-slate-200 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell
                  className="h-[18px] w-[18px] shrink-0 text-slate-900"
                  aria-hidden
                />
              </button>
            </div>
          </header>

          <main
            data-app-main-scroll
            className={cn(
              "app-main-scroll flex min-h-0 min-w-0 flex-1 flex-col bg-white px-4 md:px-5",
              route === "nouvelle-campagne" ||
                route === "reglementations-sms" ||
                route === "qr-boutique"
                ? "gap-2 overflow-hidden py-3"
                : "gap-[18px] overflow-auto py-4 md:py-5"
            )}
          >
            {children}
          </main>
          </div>
        </div>
      </div>

      <MonProfilModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
}

