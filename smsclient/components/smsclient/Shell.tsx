"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";
import type { AppRoute } from "@/lib/proto/routes";
import { navOverrideForRoute } from "@/lib/proto/routes";
import type { ReactNode } from "react";

function IconUsers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke="#2f6fed"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7" r="4" stroke="#2f6fed" strokeWidth="2" />
    </svg>
  );
}

function IconTag() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20.6 13.2 11 22l-9-9 9.6-9.6a2 2 0 0 1 1.4-.6H19a2 2 0 0 1 2 2v5.6a2 2 0 0 1-.4 1.2z"
        stroke="#2f6fed"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="17" cy="7" r="1.6" stroke="#2f6fed" strokeWidth="2" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 2 11 13"
        stroke="#2f6fed"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M22 2 15 22l-4-9-9-4 20-7z"
        stroke="#2f6fed"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCoins() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7c0-2 4-3 8-3s8 1 8 3-4 3-8 3-8-1-8-3z"
        stroke="#2f6fed"
        strokeWidth="2"
      />
      <path
        d="M4 7v10c0 2 4 3 8 3s8-1 8-3V7"
        stroke="#2f6fed"
        strokeWidth="2"
      />
      <path d="M4 12c0 2 4 3 8 3s8-1 8-3" stroke="#2f6fed" strokeWidth="2" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 20V10" stroke="#2f6fed" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 20V4" stroke="#2f6fed" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16 20v-7"
        stroke="#2f6fed"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M22 20v-12"
        stroke="#2f6fed"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"
        stroke="#475569"
        strokeWidth="2"
      />
      <path
        d="M19.4 15a2 2 0 0 0 .4 2.2l.1.1a2.4 2.4 0 0 1-1.7 4.1 2.4 2.4 0 0 1-1.7-.7l-.1-.1a2 2 0 0 0-2.2-.4 2 2 0 0 0-1.2 1.8V22a2.4 2.4 0 0 1-4.8 0v-.1a2 2 0 0 0-1.2-1.8 2 2 0 0 0-2.2.4l-.1.1A2.4 2.4 0 0 1 2.7 19a2.4 2.4 0 0 1 .7-1.7l.1-.1a2 2 0 0 0 .4-2.2 2 2 0 0 0-1.8-1.2H2a2.4 2.4 0 0 1 0-4.8h.1a2 2 0 0 0 1.8-1.2 2 2 0 0 0-.4-2.2l-.1-.1A2.4 2.4 0 0 1 5 2.7a2.4 2.4 0 0 1 1.7.7l.1.1a2 2 0 0 0 2.2.4 2 2 0 0 0 1.2-1.8V2a2.4 2.4 0 0 1 4.8 0v.1a2 2 0 0 0 1.2 1.8 2 2 0 0 0 2.2-.4l.1-.1A2.4 2.4 0 0 1 21.3 5a2.4 2.4 0 0 1-.7 1.7l-.1.1a2 2 0 0 0-.4 2.2 2 2 0 0 0 1.8 1.2H22a2.4 2.4 0 0 1 0 4.8h-.1a2 2 0 0 0-1.8 1.2z"
        stroke="#475569"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 17l-1 4H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4l1 4"
        stroke="#475569"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M17 7l5 5-5 5"
        stroke="#475569"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 12H10"
        stroke="#475569"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

type NavKey =
  | "contacts"
  | "groupes"
  | "campagnes"
  | "credits"
  | "statistiques"
  | "parametres"
  | "deconnexion";

type ShellProps = {
  route: AppRoute;
  go: (path: string) => void;
  onNewCampaign: () => void;
  children: ReactNode;
};

const mainNav: { id: NavKey; label: string; hash: string; icon: ReactNode }[] =
  [
    { id: "contacts", label: "Contacts", hash: "contacts", icon: <IconUsers /> },
    { id: "groupes", label: "Groupes", hash: "groupes", icon: <IconTag /> },
    {
      id: "campagnes",
      label: "Campagnes",
      hash: "campagnes",
      icon: <IconSend />,
    },
    { id: "credits", label: "Crédits", hash: "credits", icon: <IconCoins /> },
    {
      id: "statistiques",
      label: "Statistiques",
      hash: "statistiques",
      icon: <IconChart />,
    },
  ];

export function AppShell({
  route,
  go,
  onNewCampaign,
  children,
}: ShellProps) {
  const { signOut } = useAuth();
  const router = useRouter();
  const active = navOverrideForRoute(route);

  async function handleLogout() {
    await signOut();
    router.replace("/auth/login");
  }

  return (
    <div className="h-screen w-screen bg-[#f5f7fb]">
      <div
        className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-white"
        role="application"
        aria-label="SMSClient.fr"
      >
        <header className="flex h-[78px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-[22px] py-[18px]">
          <div className="flex items-center gap-3.5 text-2xl font-extrabold tracking-wide text-slate-900">
            <div
              className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#7fb6ff] to-[#3c7dff] shadow-[0_10px_20px_rgba(47,111,237,0.25)]"
              aria-hidden
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 18l-3 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H7z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 8h8"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M8 12h6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>SMSClient.fr</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-slate-200 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
              title="Notifications"
              aria-label="Notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5"
                  stroke="#0f172a"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M9 17a3 3 0 0 0 6 0"
                  stroke="#0f172a"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)] max-[860px]:grid-cols-1">
          <aside className="flex min-h-0 flex-col gap-3.5 border-r border-slate-200/80 bg-white p-[18px] max-[860px]:hidden">
            <button
              type="button"
              onClick={onNewCampaign}
              className="flex cursor-pointer select-none items-center gap-2.5 rounded-2xl border-none bg-gradient-to-br from-[#4a86ff] to-[#2f6fed] px-4 py-3.5 font-bold text-white shadow-[0_18px_30px_rgba(47,111,237,0.25)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_22px_36px_rgba(47,111,237,0.32)] hover:brightness-[1.03] active:translate-y-0 active:scale-[0.99] active:brightness-100"
            >
              <span className="text-lg font-black">＋</span>Nouvelle campagne
            </button>

            <nav className="flex flex-col gap-2.5 pt-1" aria-label="Navigation">
              {mainNav.map((item) => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => go(item.hash)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group flex w-full cursor-pointer select-none items-center gap-3 rounded-2xl border px-3.5 py-3 text-left font-semibold no-underline transition-all duration-200 ease-out",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6fed]",
                      isActive
                        ? "border-slate-200 bg-white text-slate-900 shadow-[0_10px_22px_rgba(15,23,42,0.08)] hover:shadow-[0_12px_26px_rgba(15,23,42,0.10)] active:scale-[0.99]"
                        : "border-transparent font-medium text-slate-700 hover:translate-x-0.5 hover:border-slate-200/90 hover:bg-slate-50 hover:shadow-[0_6px_16px_rgba(15,23,42,0.06)] active:scale-[0.99] active:bg-slate-100/80",
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

            <div className="flex flex-col gap-2.5 border-t border-slate-200/80 pt-3.5">
              <button
                type="button"
                onClick={() => go("parametres")}
                className={cn(
                  "group flex w-full cursor-pointer select-none items-center gap-3 rounded-2xl border border-transparent px-3.5 py-3 text-left font-semibold text-slate-600 transition-all duration-200 ease-out",
                  "hover:translate-x-0.5 hover:border-slate-200/90 hover:bg-slate-50 hover:shadow-[0_6px_16px_rgba(15,23,42,0.06)] active:scale-[0.99] active:bg-slate-100/80",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6fed]",
                  active === "parametres" &&
                    "border-slate-200 bg-white text-slate-900 shadow-[0_10px_22px_rgba(15,23,42,0.08)] hover:shadow-[0_12px_26px_rgba(15,23,42,0.10)]",
                )}
              >
                <span className="shrink-0 transition-transform duration-200 ease-out group-hover:scale-110">
                  <IconSettings />
                </span>
                Paramètres
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="group flex w-full cursor-pointer select-none items-center gap-3 rounded-2xl border border-transparent px-3.5 py-3 text-left font-semibold text-slate-600 transition-all duration-200 ease-out hover:translate-x-0.5 hover:border-slate-200/80 hover:bg-slate-50 hover:shadow-[0_6px_16px_rgba(15,23,42,0.05)] active:scale-[0.99] active:bg-rose-50/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500/40"
              >
                <span className="shrink-0 transition-transform duration-200 ease-out group-hover:scale-110">
                  <IconLogout />
                </span>
                Déconnexion
              </button>
            </div>
          </aside>

          <main className="flex min-h-0 min-w-0 flex-col gap-[18px] overflow-auto px-4 py-4 md:px-5 md:py-5">
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="11" cy="11" r="7" stroke="#64748b" strokeWidth="2" />
        <path
          d="M20 20l-3.3-3.3"
          stroke="#64748b"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <input
        className="w-full border-none bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}
