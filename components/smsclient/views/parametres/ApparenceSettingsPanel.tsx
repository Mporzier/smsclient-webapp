"use client";

import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Check, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";

export function ApparenceSettingsPanel() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <section className="grid gap-3 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          {t("parametres.appearance.themeTitle")}
        </h3>
        <p className="mt-1 text-xs font-medium leading-snug text-muted-foreground">
          {t("parametres.appearance.themeDescription")}
        </p>
      </div>

      <div
        className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(13rem,1fr))]"
        role="radiogroup"
        aria-label={t("parametres.appearance.themeTitle")}
      >
        <ThemeTile
          selected={theme === "light"}
          icon={<Sun className="size-4" aria-hidden />}
          label={t("parametres.appearance.light")}
          previewCls="bg-white"
          barCls="bg-slate-200"
          blockCls="bg-slate-100"
          onSelect={() => setTheme("light")}
        />
        <ThemeTile
          selected={theme === "dark"}
          icon={<Moon className="size-4" aria-hidden />}
          label={t("parametres.appearance.dark")}
          previewCls="bg-slate-900"
          barCls="bg-slate-700"
          blockCls="bg-slate-800"
          onSelect={() => setTheme("dark")}
        />
      </div>
    </section>
  );
}

function ThemeTile({
  selected,
  icon,
  label,
  previewCls,
  barCls,
  blockCls,
  onSelect,
}: {
  selected: boolean;
  icon: ReactNode;
  label: string;
  previewCls: string;
  barCls: string;
  blockCls: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex cursor-pointer flex-col gap-3 rounded-xl border p-3 text-left transition-colors",
        selected
          ? "border-ring bg-accent/50 ring-1 ring-ring/25"
          : "border-border hover:bg-muted/60",
      )}
    >
      <span
        className={cn(
          "flex h-24 w-full flex-col gap-1.5 overflow-hidden rounded-lg border border-border/70 p-2",
          previewCls,
        )}
        aria-hidden
      >
        <span className={cn("h-2 w-1/2 rounded-full", barCls)} />
        <span className={cn("h-2 w-3/4 rounded-full", blockCls)} />
        <span className={cn("mt-auto h-7 w-full rounded-md", blockCls)} />
      </span>
      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className={selected ? "text-ring" : "text-muted-foreground"}>
          {icon}
        </span>
        {label}
        {selected ? (
          <Check className="ml-auto size-4 text-ring" aria-hidden />
        ) : null}
      </span>
    </button>
  );
}
