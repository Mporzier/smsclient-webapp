"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchListColumnVisibility,
  saveListColumnVisibility,
} from "@/lib/supabase/listColumnPreferences";
import {
  normalizeListColumnVisibility,
  readListColumnVisibilityCache,
  writeListColumnVisibilityCache,
  type ListColumnPrefsKey,
} from "@/lib/types/listColumnPreferences";
import { createClient } from "@/lib/supabase/client";
import type { OnChangeFn, VisibilityState } from "@tanstack/react-table";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const SAVE_DEBOUNCE_MS = 450;

export function usePersistedListColumnVisibility(listKey: ListColumnPrefsKey) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const supabase = useMemo(() => createClient(), []);
  const [columnVisibility, setColumnVisibilityState] =
    useState<VisibilityState>({});
  const [serverSynced, setServerSynced] = useState(false);
  const persistReadyRef = useRef(false);
  const lastPersistedRef = useRef("");

  /** 1er paint post-auth : cache local (sync), pas `{}` puis fetch. */
  const columnVisibilityForUi = useMemo(() => {
    if (authLoading) return {};
    if (!userId) return {};
    if (serverSynced) return columnVisibility;
    return readListColumnVisibilityCache(userId, listKey);
  }, [
    authLoading,
    userId,
    listKey,
    serverSynced,
    columnVisibility,
  ]);

  useLayoutEffect(() => {
    if (authLoading) return;

    if (!userId) {
      persistReadyRef.current = false;
      lastPersistedRef.current = "";
      return;
    }

    const cached = readListColumnVisibilityCache(userId, listKey);
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setColumnVisibilityState(cached);
      lastPersistedRef.current = JSON.stringify(
        normalizeListColumnVisibility(cached),
      );
      setServerSynced(false);
      persistReadyRef.current = false;
    });
    void fetchListColumnVisibility(supabase, userId, listKey).then(
      ({ visibility, error }) => {
        if (cancelled) return;
        const next = error ? cached : visibility;
        const nextNorm = normalizeListColumnVisibility(next);
        const cachedNorm = normalizeListColumnVisibility(cached);
        writeListColumnVisibilityCache(userId, listKey, nextNorm);
        lastPersistedRef.current = JSON.stringify(nextNorm);
        if (JSON.stringify(nextNorm) !== JSON.stringify(cachedNorm)) {
          setColumnVisibilityState(nextNorm);
        }
        setServerSynced(true);
        persistReadyRef.current = true;
      },
    );

    return () => {
      cancelled = true;
    };
  }, [authLoading, userId, listKey, supabase]);

  const setColumnVisibility: OnChangeFn<VisibilityState> = useCallback(
    (updater) => {
      setServerSynced(true);
      persistReadyRef.current = true;
      setColumnVisibilityState((prev) => {
        const next =
          typeof updater === "function" ? updater(prev) : updater;
        if (userId) writeListColumnVisibilityCache(userId, listKey, next);
        return next;
      });
    },
    [listKey, userId],
  );

  useEffect(() => {
    if (!userId || !persistReadyRef.current) return;

    const normalized = normalizeListColumnVisibility(columnVisibility);
    const payload = JSON.stringify(normalized);
    if (payload === lastPersistedRef.current) return;

    writeListColumnVisibilityCache(userId, listKey, normalized);

    const timer = setTimeout(() => {
      void saveListColumnVisibility(supabase, userId, listKey, normalized).then(
        ({ error }) => {
          if (!error) lastPersistedRef.current = payload;
        },
      );
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [columnVisibility, listKey, supabase, userId]);

  return {
    columnVisibility: columnVisibilityForUi,
    setColumnVisibility,
    columnVisibilityHydrated: !authLoading && (userId ? serverSynced : true),
  };
}
