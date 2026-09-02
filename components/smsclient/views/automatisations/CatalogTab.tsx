"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { CatalogAutomationCard } from "@/components/smsclient/views/automatisations/CatalogAutomationCard";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingLabel } from "@/components/ui/loading-label";
import {
  AUTOMATION_CATALOG,
  filterCatalogAutomations,
  listCatalogFilterTags,
  sortByRelevance,
  splitByActivity,
  type CatalogAutomation,
} from "@/lib/automations/catalog";
import type { AutomationPresetKey } from "@/lib/types/automation";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateUserProfile } from "@/lib/supabase/profile";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type CatalogTabProps = {
  enabledPresetKeys: ReadonlySet<string>;
  onConfigure: (presetKey: AutomationPresetKey) => void;
};

function CatalogSection({
  title,
  items,
  activeTag,
  enabledPresetKeys,
  onConfigure,
}: {
  title: string;
  items: CatalogAutomation[];
  activeTag: string | null;
  enabledPresetKeys: ReadonlySet<string>;
  onConfigure: (presetKey: AutomationPresetKey) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="m-0 mb-3 text-sm font-black uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((auto) => (
          <CatalogAutomationCard
            key={auto.id}
            automation={auto}
            activeTag={activeTag}
            enabled={enabledPresetKeys.has(auto.id)}
            onConfigure={
              auto.id
                ? () => onConfigure(auto.id as AutomationPresetKey)
                : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}

export function CatalogTab({
  enabledPresetKeys,
  onConfigure,
}: CatalogTabProps) {
  const { user, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  // `null` = profil pas encore résolu ; `{ id }` = résolu (id peut être null).
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

  const activityId = user ? (activity?.id ?? null) : null;
  const activityLoaded = !authLoading && (!user || activity !== null);

  const filterTags = useMemo(() => listCatalogFilterTags(), []);

  const filtered = useMemo(
    () =>
      filterCatalogAutomations({
        source: AUTOMATION_CATALOG,
        query,
        tag,
      }),
    [query, tag],
  );

  const { matched, other } = useMemo(
    () => splitByActivity(filtered, activityId),
    [filtered, activityId],
  );

  const matchedSorted = useMemo(() => sortByRelevance(matched), [matched]);
  const otherSorted = useMemo(() => sortByRelevance(other), [other]);
  const hasActivity = Boolean(activityId);
  const empty = filtered.length === 0;

  function resetFilters() {
    setQuery("");
    setTag(null);
  }

  return (
    <div id="automatisations-disponibles" className="flex flex-col gap-3">
      <h2 className="m-0 text-sm font-black uppercase tracking-wide text-muted-foreground">
        Automatisations disponibles
      </h2>
      <div className="flex flex-col gap-2">
        <InputGroup
          className="max-w-xl bg-transparent dark:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0"
          role="search"
        >
          <InputGroupAddon align="inline-start">
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une automatisation…"
            aria-label="Rechercher une automatisation"
          />
        </InputGroup>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={tag ?? "all"}
            onValueChange={(value) => setTag(value === "all" ? null : value)}
          >
            <SelectTrigger
              size="sm"
              className="w-[11.5rem]"
              aria-label="Catégorie"
            >
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {filterTags.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!activityLoaded ? (
        <div
          className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-8"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <LoadingLabel>Chargement du catalogue…</LoadingLabel>
        </div>
      ) : empty ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center">
          <p className="m-0 text-sm font-bold text-foreground">
            Aucun résultat
          </p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Modifie la recherche ou les filtres.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={resetFilters}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      ) : hasActivity ? (
        <>
          <CatalogSection
            title="Pour mon activité"
            items={matchedSorted}
            activeTag={tag}
            enabledPresetKeys={enabledPresetKeys}
            onConfigure={onConfigure}
          />
          <CatalogSection
            title="Autres"
            items={otherSorted}
            activeTag={tag}
            enabledPresetKeys={enabledPresetKeys}
            onConfigure={onConfigure}
          />
        </>
      ) : (
        <CatalogSection
          title="Catalogue"
          items={matchedSorted}
          activeTag={tag}
          enabledPresetKeys={enabledPresetKeys}
          onConfigure={onConfigure}
        />
      )}
    </div>
  );
}
