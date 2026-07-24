"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { fetchGroupsPage } from "@/lib/supabase/groups";
import type { GroupRowData } from "@/lib/types/group";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import { useCallback, useMemo } from "react";

export function useGroups() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const userId = user?.id ?? null;
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
      return fetchGroupsPage(supabase, userId, {
        offset,
        limit,
        search,
        includeTotal: offset === 0,
      });
    },
    [supabase, userId],
  );

  const list = useInfiniteList<GroupRowData>({ enabled, fetchPage });

  const refresh = useCallback(() => list.refresh(), [list.refresh]);

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
    refresh,
  };
}
