"use client";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type SelectAllExpandBannerProps = {
  /** null = count en cours */
  matchTotal: number | null;
  hasSearch: boolean;
  /** e.g. "contacts" / "groupes" — used in no-search copy */
  entityLabel: string;
  counting?: boolean;
  expanding?: boolean;
  error?: string | null;
  onExpand: () => void;
  className?: string;
};

export function SelectAllExpandBanner({
  matchTotal,
  hasSearch,
  entityLabel,
  counting = false,
  expanding = false,
  error = null,
  onExpand,
  className,
}: SelectAllExpandBannerProps) {
  const prompt =
    matchTotal == null
      ? hasSearch
        ? "Sélectionner tous les résultats de la recherche ?"
        : `Sélectionner tous les ${entityLabel} du compte ?`
      : hasSearch
      ? `Sélectionner les ${matchTotal} résultats de la recherche ?`
      : `Sélectionner les ${matchTotal} ${entityLabel} du compte ?`;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-semibold text-foreground",
        className
      )}
      role="status"
      aria-busy={counting || expanding}
    >
      <span className="min-w-0 flex-1 truncate" title={prompt}>
        {prompt}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-6 w-6 shrink-0 p-0"
        disabled={expanding}
        aria-label="Tout sélectionner"
        onClick={onExpand}
      >
        {expanding ? (
          <span aria-hidden>…</span>
        ) : (
          <Check className="h-3.5 w-3.5" aria-hidden />
        )}
      </Button>
      {error ? (
        <span className="w-full text-[11px] font-semibold text-destructive">
          {error}
        </span>
      ) : null}
    </div>
  );
}
