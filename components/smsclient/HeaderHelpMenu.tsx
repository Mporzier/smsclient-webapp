"use client";

import { CircleHelp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";

type HeaderHelpMenuProps = {
  open: boolean;
  onToggle: () => void;
};

export function HeaderHelpMenu({ open, onToggle }: HeaderHelpMenuProps) {
  const { t } = useI18n();
  const label = t("shell.help");

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      title={label}
      aria-label={label}
      aria-expanded={open}
      aria-controls="shell-help-modal"
      className={cn(
        "help-accent-surface border px-3.5 font-semibold hover:bg-help-accent-bg-hover hover:text-help-accent-fg-hover",
      )}
      onClick={onToggle}
    >
      <CircleHelp
        data-icon="inline-start"
        className="size-4"
        strokeWidth={2.5}
        aria-hidden
      />
      {label}
    </Button>
  );
}
