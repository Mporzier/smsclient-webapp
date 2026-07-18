"use client";

import { CircleHelp } from "lucide-react";

import { Button } from "@/components/ui/button";

type HeaderHelpMenuProps = {
  open: boolean;
  onToggle: () => void;
};

export function HeaderHelpMenu({ open, onToggle }: HeaderHelpMenuProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      title="Aide"
      aria-label="Aide"
      aria-expanded={open}
      aria-controls="floating-help-banner"
      className="border-emerald-500/35 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
      onClick={onToggle}
    >
      <CircleHelp className="size-5" strokeWidth={2.5} aria-hidden />
    </Button>
  );
}
