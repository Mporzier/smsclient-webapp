"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { fetchSmsLinksPage } from "@/lib/supabase/links";
import type { LinkRowData } from "@/lib/types/link";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import { useCallback, useMemo } from "react";

export function useLinks() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const supabase = useMemo(() => createClient(), []);
  const enabled = !authLoading && Boolean(userId);

  const fetchPage = useCallback(
    async ({
      offset,
      limit,
      search,
    }: {
      offset: number;
      limit: number;
      search: string;
    }) => {
      if (!userId) {
        return { data: [], hasMore: false, error: null };
      }
      return fetchSmsLinksPage(supabase, userId, {
        offset,
        limit,
        search,
        includeTotal: offset === 0,
      });
    },
    [supabase, userId],
  );

  const list = useInfiniteList<LinkRowData>({ enabled, fetchPage });

  return {
    rows: list.rows,
    loading: list.loading,
    loadingMore: list.loadingMore,
    hasMore: list.hasMore,
    loadMore: list.loadMore,
    error: list.error,
    totalCount: list.totalCount,
    searchInput: list.searchInput,
    setSearchInput: list.setSearchInput,
    refresh: list.refresh,
    supabase,
    userId,
  };
}
