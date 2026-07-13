"use client";

import { cn } from "@/lib/cn";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  BarChart3, CalendarSync, CircleHelp, CircleUserRound, LayoutTemplate, Link, Megaphone, MessageSquareText, QrCode, Scale, Users, type LucideIcon,
} from "lucide-react";
import type { AppRoute } from "@/lib/proto/routes";

/** Fond applicatif (canvas entre sidebar et contenu) */
export const APP_CANVAS_CLASS = "bg-canvas";

/** Panneau principal (carte blanche comme la sidebar) */
export const MAIN_PANEL_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-border bg-card";

/** Largeur du menu latéral */
export const SIDEBAR_W_EXPANDED = "w-[260px]";
export const SIDEBAR_W_COLLAPSED = "w-[84px]";

const navIconWrapClass =
  "grid h-[18px] w-[18px] shrink-0 place-items-center text-primary";
const navMainIconClass = "h-[17px] w-[17px] shrink-0";
export const navMainIconStroke = 1.85;

const sidebarTextClass = "text-[13px] font-bold leading-none";
const sidebarSectionLabelClass =
  "px-2.5 pb-1.5 pt-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground";

const navItemBase = cn(
  "group flex h-[34px] w-full cursor-pointer select-none items-center gap-[9px] rounded-full border border-transparent px-2.5 text-left no-underline transition-[background-color,color] duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  sidebarTextClass
);

function sidebarNavItemClass(isActive: boolean) {
  return cn(
    navItemBase,
    isActive
      ? "bg-accent text-primary hover:bg-accent/80"
      : "text-foreground/80 hover:bg-muted"
  );
}

function SidebarNavIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className={navIconWrapClass} aria-hidden>
      <Icon
        className={navMainIconClass}
        strokeWidth={navMainIconStroke}
        aria-hidden
      />
    </span>
  );
}

export function SidebarMenuIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      className="grid h-[17px] w-[17px] shrink-0 place-items-center text-primary"
      aria-hidden
    >
      <Icon className="h-4 w-4" strokeWidth={navMainIconStroke} aria-hidden />
    </span>
  );
}

type NavKey =
  | "dashboard"
  | "contacts"
  | "groupes"
  | "campagnes"
  | "automatisations"
  | "statistiques"
  | "parametres"
  | "qr-boutique"
  | "reglementations-sms"
  | "aide"
  | "soumettre-avis"
  | "liens"
  | "modeles-sms";

export type ShellProps = {
  route: AppRoute;
  go: (path: string) => void;
  onNewCampaign: () => void;
  creditsLabel?: string;
  campaignWizardStep?: 1 | 2 | 3;
  children: ReactNode;
};

type NavItem = {
  id: NavKey;
  label: string;
  hash: string;
  icon: LucideIcon;
};

export const generalNav: NavItem[] = [
  {
    id: "dashboard",
    label: "Accueil",
    hash: "dashboard",
    icon: LayoutTemplate,
  },
  {
    id: "contacts",
    label: "Contacts",
    hash: "contacts",
    icon: CircleUserRound,
  },
  { id: "groupes", label: "Groupes", hash: "groupes", icon: Users },
  { id: "campagnes", label: "Campagnes", hash: "campagnes", icon: Megaphone },
  {
    id: "statistiques",
    label: "Statistiques",
    hash: "statistiques",
    icon: BarChart3,
  },
];

export const toolsNav: NavItem[] = [
  {
    id: "automatisations",
    label: "Automatisations",
    hash: "automatisations",
    icon: CalendarSync,
  },
  { id: "liens", label: "Liens", hash: "liens", icon: Link },
  {
    id: "modeles-sms",
    label: "Modèles SMS",
    hash: "modeles-sms",
    icon: MessageSquareText,
  },
  {
    id: "qr-boutique",
    label: "QR code boutique",
    hash: "qr-boutique",
    icon: QrCode,
  },
];

export const assistanceNav: NavItem[] = [
  {
    id: "aide",
    label: "Centre d'aide",
    hash: "aide",
    icon: CircleHelp,
  },
  {
    id: "reglementations-sms",
    label: "Réglementations SMS",
    hash: "reglementations-sms",
    icon: Scale,
  },
];

export function SidebarHoverTooltip({
  label,
  enabled,
  children,
}: {
  label: string;
  enabled: boolean;
  children: ReactNode;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      top: rect.top + rect.height / 2,
      left: rect.right + 10,
    });
  }, []);

  const show = useCallback(() => {
    if (!enabled) return;
    updatePosition();
    setVisible(true);
  }, [enabled, updatePosition]);

  const hide = useCallback(() => setVisible(false), []);

  useEffect(() => {
    if (!visible || !enabled) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [visible, enabled, updatePosition]);

  return (
    <>
      <div
        ref={anchorRef}
        className="relative"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </div>
      {enabled &&
        visible &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[100] -translate-y-1/2 whitespace-nowrap rounded-[10px] border border-border bg-popover px-2.5 py-1.5 text-xs font-bold text-popover-foreground shadow-md"
            style={{ top: pos.top, left: pos.left }}
          >
            {label}
          </div>,
          document.body
        )}
    </>
  );
}

function SidebarNavItem({
  item,
  isActive,
  collapsed,
  onGo,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onGo: (hash: string) => void;
}) {
  return (
    <SidebarHoverTooltip label={item.label} enabled={collapsed}>
      <button
        type="button"
        onClick={() => onGo(item.hash)}
        aria-current={isActive ? "page" : undefined}
        aria-label={collapsed ? item.label : undefined}
        className={cn(
          sidebarNavItemClass(isActive),
          collapsed && "justify-center px-0"
        )}
      >
        <SidebarNavIcon icon={item.icon} />
        {!collapsed && item.label}
      </button>
    </SidebarHoverTooltip>
  );
}

export function SidebarNavSection({
  label,
  items,
  active,
  onGo,
  bordered,
  collapsed,
}: {
  label: string;
  items: NavItem[];
  active: string;
  onGo: (hash: string) => void;
  bordered?: boolean;
  collapsed: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-[3px]",
        bordered && "mt-2.5 border-t border-border pt-2.5"
      )}
    >
      {!collapsed && <p className={sidebarSectionLabelClass}>{label}</p>}
      <nav className="flex flex-col gap-[3px]" aria-label={label}>
        {items.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isActive={active === item.id}
            collapsed={collapsed}
            onGo={onGo}
          />
        ))}
      </nav>
    </div>
  );
}
