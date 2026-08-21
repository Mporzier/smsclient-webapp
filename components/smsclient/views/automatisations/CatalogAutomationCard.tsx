"use client";

import { brandBtnCls } from "@/components/smsclient/modals/modalChrome";
import { Button } from "@/components/ui/button";
import type { CatalogAutomation } from "@/lib/automations/catalog";
import {
  clampRelevance,
  isConfigurableCatalogId,
  primaryTagForDisplay,
} from "@/lib/automations/catalog";
import { Check, Pencil, Star } from "lucide-react";

const cardCls =
  "flex h-full flex-col rounded-xl border border-border bg-card p-3 shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_10px_22px_rgba(15,23,42,0.08)]";

const activeCardCls =
  "flex h-full flex-col rounded-xl border border-emerald-300 bg-card p-3 shadow-[0_8px_18px_rgba(16,185,129,0.12)] transition-shadow hover:shadow-[0_10px_22px_rgba(16,185,129,0.16)]";

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
          className={`h-3 w-3 ${
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
  enabled?: boolean;
  onConfigure?: () => void;
};

export function CatalogAutomationCard({
  automation,
  activeTag,
  enabled = false,
  onConfigure,
}: CatalogAutomationCardProps) {
  const tag = primaryTagForDisplay(automation, activeTag);
  const canConfigure =
    automation.status === "available" &&
    isConfigurableCatalogId(automation.id) &&
    typeof onConfigure === "function";

  return (
    <article className={enabled ? activeCardCls : cardCls}>
      <div className="flex items-start gap-1.5">
        {enabled ? (
          <span
            className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"
            title="Automatisation active"
            aria-label="Automatisation active"
            role="img"
          >
            <Check className="h-3.5 w-3.5" aria-hidden strokeWidth={3} />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-sm font-extrabold leading-tight text-foreground">
            {automation.label}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {automation.status === "available" ? null : (
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                Bientôt
              </span>
            )}
            {tag ? (
              <span className="inline-flex items-center rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                {tag}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
        {automation.description}
      </p>
      <div className="mt-1.5">
        <RelevanceStars value={automation.relevance ?? 0} />
      </div>
      <div className="mt-auto flex justify-end pt-2.5">
        {canConfigure ? (
          <Button
            variant="outline"
            size="sm"
            className={brandBtnCls}
            onClick={onConfigure}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {enabled ? "Modifier" : "Configurer"}
          </Button>
        ) : (
          <Button variant="outline" size="sm" className={brandBtnCls} disabled>
            Bientôt
          </Button>
        )}
      </div>
    </article>
  );
}
