"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { fetchSmsCampaignsPage } from "@/lib/supabase/campaigns";
import type { CampaignRowData } from "@/lib/types/campaign";
import type { ListSort } from "@/lib/proto/listSort";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";

export function useCampaigns(active = true) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const supabase = useMemo(() => createClient(), []);
  const enabled = active && !authLoading && Boolean(userId);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const sort: ListSort | null = sorting[0]
    ? { id: sorting[0].id, desc: !!sorting[0].desc }
    : null;

  const fetchPage = useCallback(
    async ({
      offset,
      limit,
      search,
      sort: pageSort,
      filters,
    }: {
      offset: number;
      limit: number;
      search: string;
      sort: ListSort | null;
      filters?: ColumnFiltersState;
    }) => {
      if (!userId) {
        return { data: [], hasMore: false, error: null };
      }
      return fetchSmsCampaignsPage(supabase, userId, {
        offset,
        limit,
        search,
        sort: pageSort,
        includeTotal: offset === 0,
        filters,
      });
    },
    [supabase, userId],
  );

  const list = useInfiniteList<CampaignRowData>({
    enabled,
    fetchPage,
    sort,
    filters: columnFilters,
  });

  const loading = active && (authLoading || list.loading);

  return {
    rows: list.rows,
    loading,
    loadingMore: list.loadingMore,
    hasMore: list.hasMore,
    loadMore: list.loadMore,
    error: list.error,
    totalCount: list.totalCount,
    searchInput: list.searchInput,
    setSearchInput: list.setSearchInput,
    refresh: list.refresh,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
  };
}
