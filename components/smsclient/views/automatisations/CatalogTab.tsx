"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { CatalogAutomationCard } from "@/components/smsclient/views/automatisations/CatalogAutomationCard";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useAutomationFavorites } from "@/hooks/useAutomationFavorites";
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
import { Heart, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type CatalogTabProps = {
  onConfigure: (presetKey: AutomationPresetKey) => void;
};

function CatalogSection({
  title,
  items,
  activeTag,
  favoriteSet,
  onToggleFavorite,
  onConfigure,
}: {
  title: string;
  items: CatalogAutomation[];
  activeTag: string | null;
  favoriteSet: Set<string>;
  onToggleFavorite: (id: string) => void;
  onConfigure: (presetKey: AutomationPresetKey) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="m-0 mb-3 text-sm font-black uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((auto) => (
          <CatalogAutomationCard
            key={auto.id}
            automation={auto}
            activeTag={activeTag}
            favorited={favoriteSet.has(auto.id)}
            onToggleFavorite={() => onToggleFavorite(auto.id)}
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

export function CatalogTab({ onConfigure }: CatalogTabProps) {
  const { user, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [activityId, setActivityId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const favorites = useAutomationFavorites(Boolean(user));

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setActivityId(null);
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    void getOrCreateUserProfile(supabase, user.id, user.email ?? "").then(
      ({ data }) => {
        if (cancelled) return;
        setActivityId(data?.businessActivity?.trim() || null);
        setProfileLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const filterTags = useMemo(() => listCatalogFilterTags(), []);

  const filtered = useMemo(
    () =>
      filterCatalogAutomations({
        source: AUTOMATION_CATALOG,
        query,
        tag,
        favoritesOnly,
        favoriteIds: favorites.favoriteSet,
      }),
    [query, tag, favoritesOnly, favorites.favoriteSet],
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
    setFavoritesOnly(false);
  }

  const loading = profileLoading || favorites.loading;

  return (
    <div className="flex flex-col gap-3">
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
          <Button
            type="button"
            size="sm"
            variant={tag === null ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setTag(null)}
          >
            Tous
          </Button>
          {filterTags.map((t) => (
            <Button
              key={t}
              type="button"
              size="sm"
              variant={tag === t ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setTag(t)}
            >
              {t}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant={favoritesOnly ? "default" : "outline"}
            className="rounded-full"
            aria-pressed={favoritesOnly}
            onClick={() => setFavoritesOnly((v) => !v)}
          >
            <Heart
              className={`mr-1.5 h-3.5 w-3.5 ${
                favoritesOnly ? "fill-current" : ""
              }`}
              aria-hidden
            />
            Favoris
          </Button>
        </div>
      </div>

      {favorites.error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
          {favorites.error}
          <p className="mt-1 text-xs font-semibold text-rose-800">
            Applique la migration Supabase{" "}
            <code className="rounded bg-rose-100 px-1">
              20260717120000_sms_automation_favorites.sql
            </code>{" "}
            si la table n&apos;existe pas encore.
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl border border-border bg-muted"
            />
          ))}
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
            favoriteSet={favorites.favoriteSet}
            onToggleFavorite={(id) => void favorites.toggleFavorite(id)}
            onConfigure={onConfigure}
          />
          <CatalogSection
            title="Autres"
            items={otherSorted}
            activeTag={tag}
            favoriteSet={favorites.favoriteSet}
            onToggleFavorite={(id) => void favorites.toggleFavorite(id)}
            onConfigure={onConfigure}
          />
        </>
      ) : (
        <CatalogSection
          title="Catalogue"
          items={matchedSorted}
          activeTag={tag}
          favoriteSet={favorites.favoriteSet}
          onToggleFavorite={(id) => void favorites.toggleFavorite(id)}
          onConfigure={onConfigure}
        />
      )}
    </div>
  );
}
