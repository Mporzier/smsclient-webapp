"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { fetchUserSmsTemplatesPage } from "@/lib/supabase/smsTemplates";
import type { UserSmsTemplateRow } from "@/lib/types/smsTemplate";
import type { ListSort } from "@/lib/proto/listSort";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";

export function useSmsTemplates(active = true) {
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
      return fetchUserSmsTemplatesPage(supabase, userId, {
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

  const list = useInfiniteList<UserSmsTemplateRow>({
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
    supabase,
    userId,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
  };
}
