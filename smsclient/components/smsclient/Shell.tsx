"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";
import type { AppRoute } from "@/lib/proto/routes";
import { navOverrideForRoute } from "@/lib/proto/routes";
import type { ReactNode } from "react";
import {
  BarChart3,
  Bell,
  Coins,
  LogOut,
  Plus,
  Search,
  Send,
  Settings,
  Tags,
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

function LogoMark() {
  const starPoints =
    "41,33 42.25,36.75 46,38 42.25,39.25 41,43 39.75,39.25 36,38 39.75,36.75";
  return (
    <svg viewBox="-2 -2 62 62" width="45" height="45" fill="none" aria-hidden>
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

const navMainIconClass = "h-[22px] w-[22px] shrink-0 text-[#2f6fed]";
const navSubIconClass = "h-[22px] w-[22px] shrink-0 text-[#475569]";

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
    {
      id: "contacts",
      label: "Contacts",
      hash: "contacts",
      icon: <Users className={navMainIconClass} aria-hidden />,
    },
    {
      id: "groupes",
      label: "Groupes",
      hash: "groupes",
      icon: <Tags className={navMainIconClass} aria-hidden />,
    },
    {
      id: "campagnes",
      label: "Campagnes",
      hash: "campagnes",
      icon: <Send className={navMainIconClass} aria-hidden />,
    },
    {
      id: "credits",
      label: "Crédits",
      hash: "credits",
      icon: <Coins className={navMainIconClass} aria-hidden />,
    },
    {
      id: "statistiques",
      label: "Statistiques",
      hash: "statistiques",
      icon: <BarChart3 className={navMainIconClass} aria-hidden />,
    },
    {
      id: "parametres",
      label: "Paramètres",
      hash: "parametres",
      icon: <Settings className={navMainIconClass} aria-hidden />,
    },
  ];

export function AppShell({ route, go, onNewCampaign, children }: ShellProps) {
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
        <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-[22px] py-[18px]">
          <div className="flex items-center gap-3.5 text-2xl font-extrabold tracking-wide text-slate-900">
            <div className="grid h-11 w-11 place-items-center" aria-hidden>
              <LogoMark />
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
              <Bell
                className="h-[18px] w-[18px] shrink-0 text-slate-900"
                aria-hidden
              />
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
              <Plus
                className="h-5 w-5 shrink-0"
                strokeWidth={2.5}
                aria-hidden
              />
              Envoyer un SMS
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
                        : "border-transparent font-medium text-slate-700 hover:translate-x-0.5 hover:border-slate-200/90 hover:bg-slate-50 hover:shadow-[0_6px_16px_rgba(15,23,42,0.06)] active:scale-[0.99] active:bg-slate-100/80"
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
                onClick={handleLogout}
                className="group flex w-full cursor-pointer select-none items-center gap-3 rounded-2xl border border-transparent px-3.5 py-3 text-left font-semibold text-slate-600 transition-all duration-200 ease-out hover:translate-x-0.5 hover:border-slate-200/80 hover:bg-slate-50 hover:shadow-[0_6px_16px_rgba(15,23,42,0.05)] active:scale-[0.99] active:bg-rose-50/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500/40"
              >
                <span className="shrink-0 transition-transform duration-200 ease-out group-hover:scale-110">
                  <LogOut className={navSubIconClass} aria-hidden />
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
