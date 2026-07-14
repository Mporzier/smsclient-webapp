"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { fetchGroupsWithStats } from "@/lib/supabase/groups";
import type { GroupRowData } from "@/lib/types/group";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useGroups() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const userId = user?.id ?? null;

  const [rows, setRows] = useState<GroupRowData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [settled, setSettled] = useState<{
    nonce: number;
    userId: string | null;
  } | null>(null);
  const waitersRef = useRef<Array<() => void>>([]);

  const flushWaiters = useCallback(() => {
    const waiters = waitersRef.current.splice(0);
    for (const resolve of waiters) resolve();
  }, []);

  if (!userId && settled !== null) {
    setSettled(null);
    setRows([]);
    setError(null);
  }

  const loading =
    authLoading ||
    (userId != null &&
      (settled == null ||
        settled.nonce !== nonce ||
        settled.userId !== userId));

  useEffect(() => {
    if (userId) return;
    flushWaiters();
  }, [userId, flushWaiters]);

  useEffect(() => {
    if (authLoading || !userId) return;
    let cancelled = false;
    const requestNonce = nonce;
    const requestUserId = userId;

    void fetchGroupsWithStats(supabase, requestUserId).then(
      ({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
          setRows([]);
        } else {
          setError(null);
          setRows(data);
        }
        setSettled({ nonce: requestNonce, userId: requestUserId });
        flushWaiters();
      },
    );

    return () => {
      cancelled = true;
    };
  }, [authLoading, userId, supabase, nonce, flushWaiters]);

  const refresh = useCallback(() => {
    return new Promise<void>((resolve) => {
      waitersRef.current.push(resolve);
      setNonce((n) => n + 1);
    });
  }, []);

  return { rows, loading, error, refresh };
}
