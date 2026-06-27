"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { fetchQrCaptureStats, type QrCaptureStats } from "@/lib/supabase/qrStats";
import { useCallback, useEffect, useMemo, useState } from "react";

const EMPTY_STATS: QrCaptureStats = {
  totalRegistrations: 0,
  optInRegistrations: 0,
  wheelSpins: 0,
};

export function useQrStats(enabled = true) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<QrCaptureStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !userId) {
      setStats(EMPTY_STATS);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchQrCaptureStats(supabase, userId);
    if (err) {
      setError(err.message);
      setStats(EMPTY_STATS);
    } else {
      setStats(data ?? EMPTY_STATS);
    }
    setLoading(false);
  }, [enabled, userId, supabase]);

  useEffect(() => {
    if (authLoading) return;
    queueMicrotask(() => {
      void refresh();
    });
  }, [authLoading, refresh]);

  return { stats, loading, error, refresh };
}
