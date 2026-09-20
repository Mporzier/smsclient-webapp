"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { CatalogAutomationCard } from "@/components/smsclient/views/automatisations/CatalogAutomationCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  AUTOMATION_CATALOG,
  filterCatalogAutomations,
  filterCatalogByScope,
  sortByRelevance,
  type CatalogAutomation,
  type CatalogScopeFilter,
} from "@/lib/automations/catalog";
import type { AutomationPresetKey } from "@/lib/types/automation";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateUserProfile } from "@/lib/supabase/profile";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const SCOPE_OPTIONS: {
  id: CatalogScopeFilter;
  label: string;
  emoji: string;
}[] = [
  { id: "all", label: "Toutes", emoji: "✨" },
  { id: "general", label: "Générales", emoji: "🌍" },
  { id: "activity", label: "Pour mon activité", emoji: "🎯" },
];

export type CatalogPickerProps = {
  enabledPresetKeys: ReadonlySet<string>;
  onConfigure: (presetKey: AutomationPresetKey) => void;
  focusTag?: string | null;
};

function CatalogGrid({
  items,
  enabledPresetKeys,
  onConfigure,
}: {
  items: CatalogAutomation[];
  enabledPresetKeys: ReadonlySet<string>;
  onConfigure: (presetKey: AutomationPresetKey) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((auto) => (
        <CatalogAutomationCard
          key={auto.id}
          automation={auto}
          enabled={enabledPresetKeys.has(auto.id)}
          onConfigure={
            auto.id
              ? () => onConfigure(auto.id as AutomationPresetKey)
              : undefined
          }
        />
      ))}
    </div>
  );
}

export function CatalogPicker({
  enabledPresetKeys,
  onConfigure,
}: CatalogPickerProps) {
  const { user, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<CatalogScopeFilter>("all");

  const [activity, setActivity] = useState<{ id: string | null } | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    const supabase = createClient();
    void getOrCreateUserProfile(supabase, user.id, user.email ?? "").then(
      ({ data }) => {
        if (cancelled) return;
        setActivity({ id: data?.businessActivity?.trim() || null });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const activityId =
    user && !authLoading && activity !== null ? activity.id : null;

  const filtered = useMemo(() => {
    const bySearch = filterCatalogAutomations({
      source: AUTOMATION_CATALOG,
      query,
    });
    return filterCatalogByScope(bySearch, scope, activityId);
  }, [query, scope, activityId]);

  const sorted = useMemo(() => sortByRelevance(filtered), [filtered]);
  const empty = sorted.length === 0;
  const activityScopeBlocked =
    scope === "activity" && !activityId?.trim();

  function resetFilters() {
    setQuery("");
    setScope("all");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="shrink-0 space-y-3 rounded-xl border border-border/60 bg-card p-3 shadow-sm">
        <InputGroup
          className="bg-background has-[[data-slot=input-group-control]:focus-visible]:ring-1"
          role="search"
        >
          <InputGroupAddon align="inline-start">
            <Search className="size-4 text-muted-foreground" aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une automatisation…"
            aria-label="Rechercher une automatisation"
          />
        </InputGroup>

        <div className="flex flex-wrap gap-1.5">
          {SCOPE_OPTIONS.map((opt) => {
            const active = scope === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={cn(
                  "inline-flex h-7 cursor-pointer items-center rounded-full border px-2.5 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted",
                )}
                onClick={() => setScope(opt.id)}
              >
                <span className="mr-1" aria-hidden>
                  {opt.emoji}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable] px-1.5 py-1">
        {activityScopeBlocked ? (
          <Empty className="border border-dashed border-border bg-muted/30">
            <EmptyHeader>
              <EmptyTitle>Activité non renseignée</EmptyTitle>
              <EmptyDescription>
                Indiquez votre type d&apos;activité dans Paramètres pour voir
                les automatisations ciblées.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : empty ? (
          <Empty className="border border-dashed border-border bg-muted/30">
            <EmptyHeader>
              <EmptyTitle>Aucun résultat</EmptyTitle>
              <EmptyDescription>
                Modifie la recherche ou le filtre.
              </EmptyDescription>
            </EmptyHeader>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={resetFilters}
            >
              Réinitialiser
            </Button>
          </Empty>
        ) : (
          <section className="space-y-3 pb-1">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2">
              <span className="text-base leading-none" aria-hidden>
                {SCOPE_OPTIONS.find((o) => o.id === scope)?.emoji}
              </span>
              <h2 className="m-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {SCOPE_OPTIONS.find((o) => o.id === scope)?.label}
              </h2>
              <Badge variant="secondary" className="ml-auto tabular-nums">
                {sorted.length}
              </Badge>
            </div>
            <CatalogGrid
              items={sorted}
              enabledPresetKeys={enabledPresetKeys}
              onConfigure={onConfigure}
            />
          </section>
        )}
      </div>
    </div>
  );
}
