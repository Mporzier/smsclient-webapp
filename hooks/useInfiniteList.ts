"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { LIST_PAGE_SIZE } from "@/lib/supabase/postgrestChunk";

export type PageResult<T> = {
  data: T[];
  hasMore: boolean;
  totalCount?: number;
  error: Error | null;
};

type FetchPageFn<T> = (args: {
  offset: number;
  limit: number;
  search: string;
}) => Promise<PageResult<T>>;

type UseInfiniteListOptions<T> = {
  enabled: boolean;
  fetchPage: FetchPageFn<T>;
  /** Debounce search ms */
  searchDebounceMs?: number;
  pageSize?: number;
};

/**
 * Liste paginée serveur + search debounce + loadMore.
 * `refresh` remet offset 0.
 */
export function useInfiniteList<T extends { id: string }>({
  enabled,
  fetchPage,
  searchDebounceMs = 300,
  pageSize = LIST_PAGE_SIZE,
}: UseInfiniteListOptions<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;
  const inflightRef = useRef(0);
  const rowsLenRef = useRef(0);
  rowsLenRef.current = rows.length;

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, searchDebounceMs);
    return () => window.clearTimeout(t);
  }, [searchInput, searchDebounceMs]);

  useEffect(() => {
    if (!enabled) {
      setRows([]);
      setLoading(false);
      setLoadingMore(false);
      setHasMore(false);
      setError(null);
      setTotalCount(null);
      return;
    }

    let cancelled = false;
    const reqId = ++inflightRef.current;
    setLoading(true);
    setError(null);

    void fetchPageRef
      .current({ offset: 0, limit: pageSize, search })
      .then((res) => {
        if (cancelled || reqId !== inflightRef.current) return;
        if (res.error) {
          setError(res.error.message);
          setRows([]);
          setHasMore(false);
          setTotalCount(null);
        } else {
          setRows(res.data);
          setHasMore(res.hasMore);
          if (typeof res.totalCount === "number") {
            setTotalCount(res.totalCount);
          }
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, search, pageSize, reloadKey]);

  const loadMore = useCallback(async () => {
    if (!enabled || loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const offset = rowsLenRef.current;
    const reqId = inflightRef.current;
    const res = await fetchPageRef.current({
      offset,
      limit: pageSize,
      search,
    });
    if (reqId !== inflightRef.current) {
      setLoadingMore(false);
      return;
    }
    if (res.error) {
      setError(res.error.message);
    } else {
      setRows((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        const next = [...prev];
        for (const row of res.data) {
          if (!seen.has(row.id)) next.push(row);
        }
        return next;
      });
      setHasMore(res.hasMore);
      if (typeof res.totalCount === "number") {
        setTotalCount(res.totalCount);
      }
    }
    setLoadingMore(false);
  }, [enabled, loading, loadingMore, hasMore, pageSize, search]);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!enabled) {
      setRows([]);
      setError(null);
      if (!silent) setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    setError(null);
    const reqId = ++inflightRef.current;
    const res = await fetchPageRef.current({
      offset: 0,
      limit: pageSize,
      search,
    });
    if (reqId !== inflightRef.current) return;
    if (res.error) {
      setError(res.error.message);
      setRows([]);
      setHasMore(false);
    } else {
      setRows(res.data);
      setHasMore(res.hasMore);
      if (typeof res.totalCount === "number") {
        setTotalCount(res.totalCount);
      }
    }
    if (!silent) setLoading(false);
  }, [enabled, pageSize, search]);

  const resetAndReload = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  return {
    rows,
    loading,
    loadingMore,
    hasMore,
    error,
    totalCount,
    searchInput,
    setSearchInput,
    search,
    loadMore,
    refresh,
    resetAndReload,
  };
}
