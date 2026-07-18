"use client";

import { brandBtnCls } from "@/components/smsclient/modals/modalChrome";
import { Button } from "@/components/ui/button";
import type { CatalogAutomation } from "@/lib/automations/catalog";
import {
  clampRelevance,
  isConfigurableCatalogId,
  primaryTagForDisplay,
} from "@/lib/automations/catalog";
import { Heart, Pencil, Star } from "lucide-react";

const cardCls =
  "rounded-2xl border border-border bg-card p-4 shadow-[0_10px_22px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_12px_26px_rgba(15,23,42,0.08)]";

function RelevanceStars({ value }: { value: number }) {
  const n = clampRelevance(value);
  if (n <= 0) return null;
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`Pertinence ${n} sur 5`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < n
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/35"
          }`}
          aria-hidden
        />
      ))}
    </div>
  );
}

export type CatalogAutomationCardProps = {
  automation: CatalogAutomation;
  activeTag?: string | null;
  favorited: boolean;
  onToggleFavorite: () => void;
  onConfigure?: () => void;
};

export function CatalogAutomationCard({
  automation,
  activeTag,
  favorited,
  onToggleFavorite,
  onConfigure,
}: CatalogAutomationCardProps) {
  const tag = primaryTagForDisplay(automation, activeTag);
  const canConfigure =
    automation.status === "available" &&
    isConfigurableCatalogId(automation.id) &&
    typeof onConfigure === "function";

  return (
    <article className={cardCls}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 text-base font-extrabold text-foreground">
              {automation.label}
            </h3>
            {automation.status === "available" ? (
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                Dispo
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                Bientôt
              </span>
            )}
            {tag ? (
              <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                {tag}
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {automation.description}
          </p>
          <div className="mt-2">
            <RelevanceStars value={automation.relevance ?? 0} />
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label={
            favorited
              ? `Retirer ${automation.label} des favoris`
              : `Ajouter ${automation.label} aux favoris`
          }
          aria-pressed={favorited}
          onClick={onToggleFavorite}
        >
          <Heart
            className={`h-5 w-5 ${
              favorited
                ? "fill-rose-500 text-rose-500"
                : "text-muted-foreground"
            }`}
            aria-hidden
          />
        </Button>
      </div>
      <div className="mt-3 flex justify-end border-t border-border/50 pt-3">
        {canConfigure ? (
          <Button
            variant="outline"
            size="lg"
            className={brandBtnCls}
            onClick={onConfigure}
          >
            <Pencil className="mr-2 h-4 w-4" aria-hidden />
            Configurer
          </Button>
        ) : (
          <Button variant="outline" size="lg" className={brandBtnCls} disabled>
            Bientôt
          </Button>
        )}
      </div>
    </article>
  );
}
