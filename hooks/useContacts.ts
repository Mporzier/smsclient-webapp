"use client";

import { createClient } from "@/lib/supabase/client";
import {
  fetchClientsPage,
  fetchUnsubscribedContacts,
} from "@/lib/supabase/clients";
import type { ContactRowData } from "@/lib/types/contact";
import type { ContactListSort } from "@/lib/proto/contactSort";
import { useAuth } from "@/components/auth/AuthProvider";
import { isContactsRealtimeRefreshPaused } from "@/lib/proto/contactsRefreshGate";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import type { SortingState } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";

export type UnsubscribedContactSummary = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  date: string;
};

export function useContacts() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const supabase = useMemo(() => createClient(), []);
  const enabled = !authLoading && Boolean(userId);

  const [sorting, setSorting] = useState<SortingState>([]);
  const sort: ContactListSort | null = sorting[0]
    ? { id: sorting[0].id, desc: !!sorting[0].desc }
    : null;

  const fetchPage = useCallback(
    async ({
      offset,
      limit,
      search,
      sort: pageSort,
    }: {
      offset: number;
      limit: number;
      search: string;
      sort: ContactListSort | null;
    }) => {
      const res = await fetchClientsPage(supabase, {
        offset,
        limit,
        search,
        sort: pageSort,
        includeTotal: offset === 0,
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
  });

  const [unsubscribedContacts, setUnsubscribedContacts] = useState<
    UnsubscribedContactSummary[]
  >([]);

  const refreshUnsubscribed = useCallback(async () => {
    if (!userId) {
      setUnsubscribedContacts([]);
      return;
    }
    const { data, error: err } = await fetchUnsubscribedContacts(supabase);
    if (!err) setUnsubscribedContacts(data);
  }, [userId, supabase]);

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      await refreshList(options);
      await refreshUnsubscribed();
    },
    [refreshList, refreshUnsubscribed],
  );

  useEffect(() => {
    if (!enabled) {
      queueMicrotask(() => setUnsubscribedContacts([]));
      return;
    }
    queueMicrotask(() => {
      void refreshUnsubscribed();
    });
  }, [enabled, refreshUnsubscribed]);

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
    sorting,
    setSorting,
  };
}
