"use client";

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
        "flex min-w-0 flex-1 flex-wrap items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-semibold text-foreground",
        className,
      )}
      role="status"
    >
      <span className="min-w-0 flex-1 truncate">{prompt}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-6 shrink-0 px-2 text-[11px]"
        disabled={expanding || counting}
        onClick={onExpand}
      >
        {expanding ? "…" : counting ? "…" : "Tout sélectionner"}
      </Button>
      {error ? (
        <span className="w-full text-[11px] font-semibold text-destructive">
          {error}
        </span>
      ) : null}
    </div>
  );
}
