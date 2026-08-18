"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { fetchStatisticsSnapshot } from "@/lib/supabase/statistics";
import type { StatisticsSnapshot } from "@/lib/types/statistics";
import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function emptyData(): StatisticsSnapshot {
  return {
    kpis: {
      smsSent: 0,
      deliveryRate: null,
      inscriptionCount: 0,
      stopCount: 0,
      creditsConsumed: 0,
    },
    campaignSeries: [],
    topGroups: [],
  };
}

export function useStatistics(
  range: { from: string; to: string },
  enabled = true,
) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<StatisticsSnapshot>(emptyData);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [settled, setSettled] = useState<{
    nonce: number;
    userId: string | null;
    from: string;
    to: string;
  } | null>(null);
  const waitersRef = useRef<Array<() => void>>([]);

  const flushWaiters = useCallback(() => {
    const waiters = waitersRef.current.splice(0);
    for (const resolve of waiters) resolve();
  }, []);

  if (!userId && settled !== null) {
    setSettled(null);
    setData(emptyData());
    setError(null);
  }

  const rangeDirty =
    settled != null &&
    (settled.from !== range.from || settled.to !== range.to);

  const loading =
    enabled &&
    (authLoading ||
      (userId != null &&
        (settled == null ||
          settled.nonce !== nonce ||
          settled.userId !== userId ||
          rangeDirty)));

  useEffect(() => {
    if (userId) return;
    flushWaiters();
  }, [userId, flushWaiters]);

  useEffect(() => {
    if (authLoading || !userId || !enabled) return;
    let cancelled = false;
    const requestNonce = nonce;
    const requestUserId = userId;
    const from = range.from;
    const to = range.to;

    void fetchStatisticsSnapshot(supabase, requestUserId, { from, to }).then(
      (result) => {
        if (cancelled) return;
        if (result.error) {
          setError(result.error.message);
          setData(emptyData());
        } else {
          setError(null);
          setData(result.data);
        }
        setSettled({
          nonce: requestNonce,
          userId: requestUserId,
          from,
          to,
        });
        flushWaiters();
      },
    );

    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    userId,
    supabase,
    nonce,
    enabled,
    range.from,
    range.to,
    flushWaiters,
  ]);

  const refresh = useCallback(() => {
    return new Promise<void>((resolve) => {
      waitersRef.current.push(resolve);
      setNonce((n) => n + 1);
    });
  }, []);

  return { data, loading, error, refresh };
}
