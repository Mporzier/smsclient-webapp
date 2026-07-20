"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useUserProfile } from "@/components/auth/UserProfileProvider";
import { FloatingHelpBanner } from "@/components/smsclient/FloatingHelpBanner";
import { HeaderHelpMenu } from "@/components/smsclient/HeaderHelpMenu";
import { CampaignWizardStepper } from "@/components/smsclient/CreateCampaign/CampaignWizardStepper";
import { requestParametresSection } from "@/components/smsclient/views/parametres/parametresNav";
import { cn } from "@/lib/utils";
import { contactInitials } from "@/lib/proto/contactDisplay";
import { useRouter } from "next/navigation";
import {
  navOverrideForRoute,
  ROUTE_TITLES,
  isCampaignWizardRoute,
} from "@/lib/proto/routes";
import { guideKeyForRoute } from "@/lib/sectionGuides";
import { useMemo, useState } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Coins,
  LogOut,
  MoreHorizontal,
  Plus,
  MessageSquareText,
  Settings,
  UserRound,
} from "lucide-react";
import { LogoMark } from "@/components/smsclient/shell/LogoMark";
import {
  APP_CANVAS_CLASS,
  MAIN_PANEL_CLASS,
  SIDEBAR_W_COLLAPSED,
  SIDEBAR_W_EXPANDED,
  assistanceNav,
  generalNav,
  toolsNav,
  SidebarNavSection,
  SidebarHoverTooltip,
  SidebarMenuIcon,
  navMainIconStroke,
  ROUTE_ICONS,
  type ShellProps,
} from "@/components/smsclient/shell/SidebarNav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const TitleIcon = ROUTE_ICONS[route];
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
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
          <div className="relative flex h-full min-h-0 w-full flex-col overflow-visible rounded-3xl border border-border bg-card px-3 py-3.5">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-expanded={!sidebarCollapsed}
              aria-label={
                sidebarCollapsed
                  ? "Ouvrir le menu latéral"
                  : "Fermer le menu latéral"
              }
              className="absolute right-0 top-8 z-40 grid h-7 w-7 translate-x-1/2 cursor-pointer place-items-center rounded-full border border-border bg-card text-primary transition-colors hover:bg-muted"
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

            <button
              type="button"
              onClick={() => go("dashboard")}
              aria-label="Retour à l'accueil"
              className={cn(
                "mb-7 flex shrink-0 cursor-pointer items-center rounded-lg border-0 bg-transparent p-0 text-left outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring",
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
                <span className="min-w-0 truncate text-lg font-extrabold leading-none text-foreground">
                  smsclient.fr
                </span>
              )}
            </button>

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

            <div className="relative shrink-0 border-t border-border pt-2.5">
              <div
                className={cn(
                  "items-center",
                  sidebarCollapsed
                    ? "flex flex-col gap-2"
                    : "grid grid-cols-[32px_1fr_34px] gap-2"
                )}
              >
                <SidebarHoverTooltip
                  label={displayName ?? "Mon compte"}
                  enabled={sidebarCollapsed}
                >
                  <div
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-primary text-[11px] font-extrabold text-primary-foreground"
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
                  <span className="min-w-0 truncate text-xs font-bold leading-tight text-foreground">
                    {displayName ?? (
                      <span className="inline-block h-3 w-16 animate-pulse rounded bg-muted align-middle" />
                    )}
                  </span>
                )}
                <DropdownMenu open={profileOpen} onOpenChange={setProfileOpen}>
                  <DropdownMenuTrigger
                    aria-label="Menu du compte"
                    className={cn(
                      "grid h-[34px] w-[34px] shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                      profileOpen && "bg-accent text-primary",
                      sidebarCollapsed && "mx-auto"
                    )}
                  >
                    <MoreHorizontal
                      className="h-4 w-4"
                      strokeWidth={navMainIconStroke}
                      aria-hidden
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side={sidebarCollapsed ? "right" : "top"}
                    align={sidebarCollapsed ? "end" : "start"}
                    sideOffset={10}
                    className="w-56"
                    aria-label="Menu du compte"
                  >
                    <DropdownMenuItem
                      onSelect={() => {
                        requestParametresSection("compte");
                        go("parametres");
                      }}
                    >
                      <SidebarMenuIcon icon={UserRound} />
                      Mon profil
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => go("parametres")}>
                      <SidebarMenuIcon icon={Settings} />
                      Paramètres
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => go("acheter-credits")}>
                      <SidebarMenuIcon icon={Coins} />
                      Crédits
                      {creditsLabel ? (
                        <span className="ml-auto rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold tabular-nums text-muted-foreground">
                          {creditsLabel}
                        </span>
                      ) : null}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => go("soumettre-avis")}>
                      <SidebarMenuIcon icon={MessageSquareText} />
                      Soumettre un avis
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => void handleLogout()}
                    >
                      <LogOut
                        className="h-4 w-4"
                        strokeWidth={navMainIconStroke}
                        aria-hidden
                      />
                      Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col p-3 pl-0 max-[860px]:pl-3">
          <div className={MAIN_PANEL_CLASS}>
          <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-border px-4 pr-[22px] md:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => go("dashboard")}
                aria-label="Retour à l'accueil"
                className="hidden min-w-0 cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-left outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring max-[860px]:flex"
              >
                <div
                  className="grid h-10 w-10 shrink-0 place-items-center"
                  aria-hidden
                >
                  <LogoMark size={40} />
                </div>
                <span className="min-w-0 truncate text-lg font-semibold leading-none text-foreground">
                  smsclient.fr
                </span>
              </button>
              <h1 className="m-0 flex shrink-0 items-center gap-2.5 rounded-full bg-muted px-3 py-1.5 text-xl font-semibold tracking-tight text-foreground">
                <TitleIcon
                  className="size-6 shrink-0 text-primary"
                  strokeWidth={2.25}
                  aria-hidden
                />
                {ROUTE_TITLES[route]}
              </h1>
              {isCampaignWizard && campaignWizardStep != null && (
                <CampaignWizardStepper current={campaignWizardStep} compact />
              )}
            </div>
            <div className="flex items-center gap-2">
              {creditsLabel && (
                <Badge
                  variant="outline"
                  className="h-9 gap-1.5 rounded-lg px-2.5 text-sm font-medium [&>svg]:size-3.5!"
                  title="Crédits restants"
                >
                  <Coins
                    data-icon="inline-start"
                    className="text-amber-600 dark:text-amber-400"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <span className="tabular-nums font-semibold text-foreground">
                    {creditsLabel}
                  </span>
                  <span className="font-normal text-muted-foreground">
                    crédits
                  </span>
                </Badge>
              )}
              <Button
                type="button"
                size="lg"
                onClick={onNewCampaign}
                className="bg-chart-1 px-3.5 font-semibold text-primary-foreground shadow-xs hover:bg-chart-2"
              >
                <Plus
                  data-icon="inline-start"
                  className="size-4"
                  strokeWidth={2.5}
                  aria-hidden
                />
                Nouvelle campagne
              </Button>
              <HeaderHelpMenu
                open={helpOpen}
                onToggle={() => setHelpOpen((v) => !v)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                title="Notifications"
                aria-label="Notifications"
                className="border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 hover:text-orange-700 dark:text-amber-400 dark:hover:text-amber-300"
              >
                <Bell className="size-5" strokeWidth={2.5} aria-hidden />
              </Button>
            </div>
          </header>

          <main
            data-app-main-scroll
            className={cn(
              "app-main-scroll flex min-h-0 min-w-0 flex-1 flex-col bg-card px-4 md:px-5",
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

      <FloatingHelpBanner
        section={guideKeyForRoute(route)}
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        onNavigate={(hash) => {
          setHelpOpen(false);
          go(hash);
        }}
      />
    </div>
  );
}

