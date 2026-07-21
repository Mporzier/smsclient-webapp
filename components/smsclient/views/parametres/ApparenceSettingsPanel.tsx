"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";

export function ApparenceSettingsPanel() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-bold text-foreground">
        {t("parametres.appearance.themeTitle")}
      </h2>
      <p className="mt-1 text-xs font-medium text-muted-foreground">
        {t("parametres.appearance.themeDescription")}
      </p>
      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label={t("parametres.appearance.themeTitle")}
      >
        <Button
          type="button"
          size="sm"
          variant={theme === "light" ? "default" : "outline"}
          aria-pressed={theme === "light"}
          onClick={() => setTheme("light")}
          className={cn("gap-1.5")}
        >
          <Sun className="size-4" aria-hidden />
          {t("parametres.appearance.light")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={theme === "dark" ? "default" : "outline"}
          aria-pressed={theme === "dark"}
          onClick={() => setTheme("dark")}
          className={cn("gap-1.5")}
        >
          <Moon className="size-4" aria-hidden />
          {t("parametres.appearance.dark")}
        </Button>
      </div>
    </div>
  );
}
