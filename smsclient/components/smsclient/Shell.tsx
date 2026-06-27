"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useUserProfile } from "@/components/auth/UserProfileProvider";
import { HeaderHelpMenu } from "@/components/smsclient/HeaderHelpMenu";
import { CampaignWizardStepper } from "@/components/smsclient/CreateCampaign/CampaignWizardStepper";
import { cn } from "@/lib/cn";
import { contactInitials } from "@/lib/proto/contactDisplay";
import { useRouter } from "next/navigation";
import type { AppRoute } from "@/lib/proto/routes";
import { navOverrideForRoute, ROUTE_TITLES, isCampaignWizardRoute } from "@/lib/proto/routes";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  Coins,
  LogOut,
  Plus,
  Search,
  Send,
  Zap,
  Contact,
  Link2,
  MessageSquareText,
  QrCode,
  Scale,
  Settings,
  Users,
} from "lucide-react";

function polygonToRoundedPath(points: string, radius: number): string {
  const coords = points.split(" ").map((p) => {
    const [x, y] = p.split(",").map(Number);
    return { x, y };
  });
  if (coords.length < 3) return "";

  const getVector = (
    from: { x: number; y: number },
    to: { x: number; y: number }
  ) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    return { dx: dx / len, dy: dy / len, len };
  };

  let path = "";
  for (let i = 0; i < coords.length; i++) {
    const prev = coords[(i - 1 + coords.length) % coords.length];
    const curr = coords[i];
    const next = coords[(i + 1) % coords.length];
    const v1 = getVector(curr, prev);
    const v2 = getVector(curr, next);
    const r = Math.min(radius, v1.len / 2, v2.len / 2);
    const p1 = { x: curr.x + v1.dx * r, y: curr.y + v1.dy * r };
    const p2 = { x: curr.x + v2.dx * r, y: curr.y + v2.dy * r };
    if (i === 0) {
      path = `M ${p1.x},${p1.y}`;
    } else {
      path += ` L ${p1.x},${p1.y}`;
    }
    path += ` Q ${curr.x},${curr.y} ${p2.x},${p2.y}`;
  }
  return `${path} Z`;
}

function LogoMark({ size = 45 }: { size?: number }) {
  const starPoints =
    "41,33 42.25,36.75 46,38 42.25,39.25 41,43 39.75,39.25 36,38 39.75,36.75";
  return (
    <svg
      viewBox="-2 -2 62 62"
      width={size}
      height={size}
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <g>
        <path
          fill="#0ea5e9"
          d={polygonToRoundedPath("0,22.032 17.064,31.032 58.064,10.032", 1.5)}
        />
        <path
          fill="#38bdf8"
          d={polygonToRoundedPath(
            "24.064,35.032 20.064,48.032 58.064,10.032",
            1.5
          )}
        />
        <path
          fill="#7dd3fc"
          d={polygonToRoundedPath(
            "17.064,31.032 24.064,35.032 44.064,48.032 58.064,10.032",
            1.5
          )}
        />
        <path
          fill="#bae6fd"
          d={polygonToRoundedPath(
            "24.064,35.032 20.127,48.032 17.064,31.032 58.064,10.032",
            1.5
          )}
        />
      </g>
      <defs>
        <clipPath id="shell-star-tr-bl">
          <polygon points="41,33 46,38 41,38" />
          <polygon points="41,38 36,38 41,43" />
        </clipPath>
      </defs>
      <polygon fill="#ffffff" points={starPoints} />
      <polygon
        fill="#ffffff"
        points={starPoints}
        clipPath="url(#shell-star-tr-bl)"
      />
    </svg>
  );
}

/** Largeur menu latéral + bandeau marque dans le header */
const SIDEBAR_W = "w-[240px]";

const navMainIconClass = "h-[22px] w-[22px] shrink-0 text-[#2f6fed]";
const navSubIconClass = "h-[22px] w-[22px] shrink-0 text-[#475569]";

type NavKey =
  | "contacts"
  | "groupes"
  | "campagnes"
  | "automatisations"
  | "statistiques"
  | "parametres"
  | "qr-boutique"
  | "reglementations-sms"
  | "soumettre-avis"
  | "liens";

type ShellProps = {
  route: AppRoute;
  go: (path: string) => void;
  onNewCampaign: () => void;
  creditsLabel?: string;
  onBuyCredits?: () => void;
  campaignWizardStep?: 1 | 2 | 3;
  children: ReactNode;
};

const mainNav: { id: NavKey; label: string; hash: string; icon: ReactNode }[] =
  [
    {
      id: "contacts",
      label: "Contacts",
      hash: "contacts",
      icon: <Contact className={navMainIconClass} aria-hidden />,
    },
    {
      id: "groupes",
      label: "Groupes",
      hash: "groupes",
      icon: <Users className={navMainIconClass} aria-hidden />,
    },
    {
      id: "campagnes",
      label: "Campagnes",
      hash: "campagnes",
      icon: <Send className={navMainIconClass} aria-hidden />,
    },
    {
      id: "automatisations",
      label: "Automatisations",
      hash: "automatisations",
      icon: <Zap className={navMainIconClass} aria-hidden />,
    },
    {
      id: "statistiques",
      label: "Statistiques",
      hash: "statistiques",
      icon: <BarChart3 className={navMainIconClass} aria-hidden />,
    },
  ];

const bottomNav: { id: NavKey; label: string; hash: string; icon: ReactNode }[] =
  [
    {
      id: "parametres",
      label: "Paramètres",
      hash: "parametres",
      icon: <Settings className={navMainIconClass} aria-hidden />,
    },
    {
      id: "soumettre-avis",
      label: "Soumettre un avis",
      hash: "soumettre-avis",
      icon: <MessageSquareText className={navMainIconClass} aria-hidden />,
    },
  ];

export function AppShell({
  route,
  go,
  onNewCampaign,
  creditsLabel,
  onBuyCredits,
  campaignWizardStep,
  children,
}: ShellProps) {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const router = useRouter();
  const active = navOverrideForRoute(route);
  const [profileOpen, setProfileOpen] = useState(false);
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

  return (
    <div className="h-screen w-screen bg-slate-50">
      <div
        className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-slate-50"
        role="application"
        aria-label="smsclient.fr - Application SMS"
      >
        <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-white pr-[22px]">
          <div className="flex h-full min-w-0 flex-1 items-center">
            <div
              className={cn(
                "flex h-full shrink-0 items-center gap-1.5 border-r border-slate-200/80 bg-slate-100/90 px-2 min-w-0 overflow-hidden max-[860px]:w-auto max-[860px]:border-r-0 max-[860px]:bg-white max-[860px]:pl-4",
                SIDEBAR_W
              )}
            >
              <div
                className="grid h-10 w-10 shrink-0 place-items-center"
                aria-hidden
              >
                <LogoMark size={40} />
              </div>
              <span className="min-w-0 flex-1 truncate text-lg font-semibold leading-none text-slate-900">
                smsclient.fr
              </span>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-3 pl-5 pr-3">
              <h1 className="m-0 shrink-0 text-lg font-extrabold text-slate-700">
                {ROUTE_TITLES[route]}
              </h1>
              {isCampaignWizard && campaignWizardStep != null && (
                <CampaignWizardStepper current={campaignWizardStep} compact />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {creditsLabel && (
              <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700">
                <Coins className="h-4 w-4 text-[#2f6fed]" aria-hidden />
                {creditsLabel} · Crédits restants
              </div>
            )}
            {onBuyCredits && (
              <button
                type="button"
                onClick={onBuyCredits}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border-none bg-gradient-to-br from-[#4a86ff] to-[#2f6fed] px-3.5 py-1.5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(47,111,237,0.2)] transition-all hover:brightness-[1.03]"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                Acheter des crédits
              </button>
            )}
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

        <div className="grid min-h-0 flex-1 grid-cols-[244px_minmax(0,1fr)] max-[860px]:grid-cols-1">
          <aside
            className={cn(
              "flex min-h-0 shrink-0 flex-col gap-2 border-r border-slate-200/80 bg-slate-100 p-2.5 max-[860px]:hidden",
              SIDEBAR_W
            )}
          >
            <button
              type="button"
              onClick={onNewCampaign}
              className="flex cursor-pointer select-none items-center gap-2 rounded-xl border-none bg-gradient-to-br from-[#4a86ff] to-[#2f6fed] px-3 py-2 text-sm font-bold text-white shadow-[0_18px_30px_rgba(47,111,237,0.25)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_22px_36px_rgba(47,111,237,0.32)] hover:brightness-[1.03] active:translate-y-0 active:scale-[0.99] active:brightness-100"
            >
              <Plus
                className="h-4.5 w-4.5 shrink-0"
                strokeWidth={2.5}
                aria-hidden
              />
              Envoyer un SMS
            </button>

            <nav className="flex flex-col gap-1 pt-0.5" aria-label="Navigation">
              {mainNav.map((item) => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => go(item.hash)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group flex w-full cursor-pointer select-none items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-sm font-semibold no-underline transition-all duration-200 ease-out",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6fed]",
                      isActive
                        ? "border-slate-200 bg-white text-slate-900 shadow-[0_10px_22px_rgba(15,23,42,0.08)] hover:shadow-[0_12px_26px_rgba(15,23,42,0.10)] active:scale-[0.99]"
                        : "border-transparent font-medium text-slate-700 hover:translate-x-0.5 hover:border-slate-200/90 hover:bg-white hover:shadow-[0_6px_16px_rgba(15,23,42,0.06)] active:scale-[0.99] active:bg-slate-50"
                    )}
                  >
                    <span className="shrink-0 transition-transform duration-200 ease-out group-hover:scale-110 group-active:scale-105">
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex-1" />

            <nav
              className="flex flex-col gap-1 border-t border-slate-200/80 pt-2.5"
              aria-label="Outils"
            >
              {[
                { id: "liens" as const, label: "Liens", hash: "liens", icon: Link2 },
                {
                  id: "qr-boutique" as const,
                  label: "QR code boutique",
                  hash: "qr-boutique",
                  icon: QrCode,
                },
                {
                  id: "reglementations-sms" as const,
                  label: "Réglementations SMS",
                  hash: "reglementations-sms",
                  icon: Scale,
                },
              ].map((item) => {
                const isActive = active === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => go(item.hash)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group flex w-full cursor-pointer select-none items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-sm font-semibold no-underline transition-all duration-200 ease-out",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6fed]",
                      isActive
                        ? "border-slate-200 bg-white text-slate-900 shadow-[0_10px_22px_rgba(15,23,42,0.08)] hover:shadow-[0_12px_26px_rgba(15,23,42,0.10)] active:scale-[0.99]"
                        : "border-transparent font-medium text-slate-700 hover:translate-x-0.5 hover:border-slate-200/90 hover:bg-white hover:shadow-[0_6px_16px_rgba(15,23,42,0.06)] active:scale-[0.99] active:bg-slate-50"
                    )}
                  >
                    <span className="shrink-0 transition-transform duration-200 ease-out group-hover:scale-110 group-active:scale-105">
                      <Icon className={navMainIconClass} aria-hidden />
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <nav
              className="flex flex-col gap-1 border-t border-slate-200/80 pt-2.5"
              aria-label="Compte et avis"
            >
              {bottomNav.map((item) => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => go(item.hash)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group flex w-full cursor-pointer select-none items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-sm font-semibold no-underline transition-all duration-200 ease-out",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6fed]",
                      isActive
                        ? "border-slate-200 bg-white text-slate-900 shadow-[0_10px_22px_rgba(15,23,42,0.08)] hover:shadow-[0_12px_26px_rgba(15,23,42,0.10)] active:scale-[0.99]"
                        : "border-transparent font-medium text-slate-700 hover:translate-x-0.5 hover:border-slate-200/90 hover:bg-white hover:shadow-[0_6px_16px_rgba(15,23,42,0.06)] active:scale-[0.99] active:bg-slate-50"
                    )}
                  >
                    <span className="shrink-0 transition-transform duration-200 ease-out group-hover:scale-110 group-active:scale-105">
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="relative mt-auto flex flex-col gap-2 border-t border-slate-200/80 pt-3">
              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setProfileOpen(false)}
                    aria-hidden
                  />
                  <div
                    className="absolute bottom-full left-0 z-50 mb-2 w-full rounded-xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.1),0_8px_16px_-6px_rgba(15,23,42,0.1)] transition-opacity duration-150"
                    role="dialog"
                    aria-label="Menu du compte"
                  >
                    <div className="flex flex-col gap-1 border-b border-slate-100 pb-2.5">
                      <p className="m-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Compte connecté
                      </p>
                      <p className="m-0 truncate text-sm font-bold text-slate-900">
                        {displayName ?? "…"}
                      </p>
                      {email && (
                        <p className="m-0 truncate text-xs text-slate-500">
                          {email}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="group mt-2.5 flex w-full cursor-pointer items-center gap-2 rounded-lg border border-transparent bg-rose-50/50 px-2.5 py-2 text-left text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
                    >
                      <LogOut
                        className="h-4 w-4 text-rose-500 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                      Se déconnecter
                    </button>
                  </div>
                </>
              )}

              <div className="px-1">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  aria-expanded={profileOpen}
                  aria-haspopup="dialog"
                  className={cn(
                    "flex w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-xl border p-1.5 text-left transition-all duration-200",
                    profileOpen
                      ? "border-slate-200 bg-white shadow-sm"
                      : "border-transparent hover:bg-slate-200/50"
                  )}
                >
                  <div
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#4a86ff] to-[#2f6fed] text-xs font-bold text-white shadow-sm"
                    aria-hidden
                  >
                    {initials ?? (
                      <span className="text-[10px] font-bold opacity-80">…</span>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-xs font-bold text-slate-700">
                      {displayName ?? (
                        <span className="inline-block h-3 w-16 animate-pulse rounded bg-slate-200/80 align-middle" />
                      )}
                    </span>
                    <span className="truncate text-[11px] text-slate-400">
                      Options
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </aside>

          <main
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col bg-slate-50 px-4 md:px-5",
              route === "nouvelle-campagne" ||
              route === "reglementations-sms" ||
              route === "qr-boutique"
                ? "gap-2 overflow-hidden py-3"
                : "gap-[18px] overflow-auto py-4 md:py-5",
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export function SearchBar({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div
      className="mt-3.5 flex h-11 max-w-full items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 font-semibold text-slate-500 shadow-[0_10px_22px_rgba(15,23,42,0.08)] sm:max-w-[520px] w-full"
      role="search"
    >
      <Search
        className="h-[18px] w-[18px] shrink-0 text-slate-500"
        aria-hidden
      />
      <input
        className="w-full border-none bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}
