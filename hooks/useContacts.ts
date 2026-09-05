"use client";

import { createClient } from "@/lib/supabase/client";
import {
  countUnsubscribedContacts,
  fetchClientsPage,
  fetchUnsubscribedContacts,
} from "@/lib/supabase/clients";
import type { ContactRowData } from "@/lib/types/contact";
import type { ContactListSort } from "@/lib/proto/contactSort";
import type { CustomFieldType } from "@/lib/types/customFields";
import { useAuth } from "@/components/auth/AuthProvider";
import { isContactsRealtimeRefreshPaused } from "@/lib/proto/contactsRefreshGate";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type UnsubscribedContactSummary = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  date: string;
};

export function useContacts(withUnsubscribed = true) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const supabase = useMemo(() => createClient(), []);
  const enabled = !authLoading && Boolean(userId);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const customFieldTypesRef = useRef<Record<string, CustomFieldType>>({});
  const setCustomFieldFilterTypes = useCallback(
    (types: Record<string, CustomFieldType>) => {
      customFieldTypesRef.current = types;
    },
    [],
  );
  const sort: ContactListSort | null = sorting[0]
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
      sort: ContactListSort | null;
      filters?: ColumnFiltersState;
    }) => {
      const res = await fetchClientsPage(supabase, {
        offset,
        limit,
        search,
        sort: pageSort,
        includeTotal: offset === 0,
        eligibleOnly: true,
        filters,
        customFieldTypes: customFieldTypesRef.current,
      });
      return {
        data: res.data,
        hasMore: res.hasMore,
        totalCount: res.totalCount,
        error: res.error,
      };
    },
    [supabase],
  );

  const {
    rows,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    error,
    totalCount,
    searchInput,
    setSearchInput,
    refresh: refreshList,
  } = useInfiniteList<ContactRowData>({
    enabled,
    fetchPage,
    sort,
    filters: columnFilters,
  });

  const [unsubscribedContacts, setUnsubscribedContacts] = useState<
    UnsubscribedContactSummary[]
  >([]);
  const [unsubscribedCount, setUnsubscribedCount] = useState(0);
  const [unsubscribedLoading, setUnsubscribedLoading] = useState(false);
  const unsubscribedOpenedRef = useRef(false);

  const loadUnsubscribed = useCallback(async () => {
    if (!userId) {
      setUnsubscribedContacts([]);
      return;
    }
    unsubscribedOpenedRef.current = true;
    setUnsubscribedLoading(true);
    const { data, error: err } = await fetchUnsubscribedContacts(supabase);
    if (!err) {
      setUnsubscribedContacts(data);
      setUnsubscribedCount(data.length);
    }
    setUnsubscribedLoading(false);
  }, [userId, supabase]);

  const refreshUnsubscribed = useCallback(async () => {
    if (!userId || !withUnsubscribed) {
      setUnsubscribedContacts([]);
      setUnsubscribedCount(0);
      return;
    }
    if (unsubscribedOpenedRef.current) {
      await loadUnsubscribed();
      return;
    }
    const { count, error: err } = await countUnsubscribedContacts(supabase);
    if (!err) setUnsubscribedCount(count);
  }, [userId, supabase, withUnsubscribed, loadUnsubscribed]);

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      await refreshList(options);
      await refreshUnsubscribed();
    },
    [refreshList, refreshUnsubscribed],
  );

  useEffect(() => {
    if (!enabled || !withUnsubscribed) {
      queueMicrotask(() => {
        unsubscribedOpenedRef.current = false;
        setUnsubscribedContacts([]);
        setUnsubscribedCount(0);
      });
      return;
    }
    queueMicrotask(() => {
      void refreshUnsubscribed();
    });
  }, [enabled, withUnsubscribed, refreshUnsubscribed]);

  useEffect(() => {
    if (authLoading || !userId) return;

    let debounce: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (isContactsRealtimeRefreshPaused()) return;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        debounce = null;
        if (isContactsRealtimeRefreshPaused()) return;
        void refresh({ silent: true });
      }, 300);
    };

    const channel = supabase
      .channel(`realtime:clients:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clients",
        },
        () => {
          scheduleRefresh();
        },
      )
      .subscribe();

    return () => {
      if (debounce) clearTimeout(debounce);
      void supabase.removeChannel(channel);
    };
  }, [authLoading, userId, supabase, refresh]);

  return {
    rows,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    error,
    totalCount,
    searchInput,
    setSearchInput,
    refresh,
    unsubscribedContacts,
    unsubscribedCount,
    unsubscribedLoading,
    loadUnsubscribed,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    setCustomFieldFilterTypes,
  };
}
