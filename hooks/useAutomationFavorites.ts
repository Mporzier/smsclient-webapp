"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  addFavorite,
  listFavorites,
  removeFavorite,
} from "@/lib/supabase/automationFavorites";
import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useAutomationFavorites(enabled = true) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const supabase = useMemo(() => createClient(), []);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setFavoriteIds([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await listFavorites(supabase, userId);
    if (err) {
      setError(err.message);
      setFavoriteIds([]);
    } else {
      setFavoriteIds(data);
    }
    setLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    if (authLoading || !enabled) return;
    queueMicrotask(() => {
      void refresh();
    });
  }, [authLoading, enabled, refresh]);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const toggleFavorite = useCallback(
    async (automationId: string) => {
      if (!userId) return;
      const wasFav = favoriteSet.has(automationId);
      setFavoriteIds((prev) =>
        wasFav
          ? prev.filter((id) => id !== automationId)
          : [...prev, automationId],
      );
      setError(null);
      const result = wasFav
        ? await removeFavorite(supabase, userId, automationId)
        : await addFavorite(supabase, userId, automationId);
      if (result.error) {
        setFavoriteIds((prev) =>
          wasFav
            ? [...prev, automationId]
            : prev.filter((id) => id !== automationId),
        );
        setError(result.error.message);
      }
    },
    [userId, supabase, favoriteSet],
  );

  return {
    favoriteIds,
    favoriteSet,
    loading,
    error,
    toggleFavorite,
    refresh,
  };
}
