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
      className="border-violet-500/35 bg-violet-500/10 text-violet-700 hover:bg-violet-500/15 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300"
      onClick={onToggle}
    >
      <CircleHelp className="size-5" strokeWidth={2.5} aria-hidden />
    </Button>
  );
}
