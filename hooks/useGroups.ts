"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { fetchGroupsPage } from "@/lib/supabase/groups";
import type { GroupRowData } from "@/lib/types/group";
import type { ListSort } from "@/lib/proto/listSort";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";

export function useGroups() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const userId = user?.id ?? null;
  const enabled = !authLoading && Boolean(userId);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "contactCount", desc: true },
  ]);
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
      return fetchGroupsPage(supabase, userId, {
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

  const list = useInfiniteList<GroupRowData>({
    enabled,
    fetchPage,
    sort,
    filters: columnFilters,
  });

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
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
  };
}
