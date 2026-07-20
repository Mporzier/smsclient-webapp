"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

export function SettingCard({
  title,
  description,
  icon: Icon,
  onClick,
  upcoming = false,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  upcoming?: boolean;
}) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex cursor-pointer flex-col rounded-xl border border-border/80 bg-card p-3 text-left transition-colors hover:border-border hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-2">
        <Icon
          className="h-4 w-4 shrink-0 text-ring"
          strokeWidth={2}
          aria-hidden
        />
        {upcoming ? (
          <span className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {t("parametres.upcoming")}
          </span>
        ) : null}
      </div>
      <span className="mt-2 text-sm font-bold leading-tight text-foreground">
        {title}
      </span>
      <span className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-muted-foreground">
        {description}
      </span>
    </button>
  );
}

export function ModalPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {children}
    </div>
  );
}
