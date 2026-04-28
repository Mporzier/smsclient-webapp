"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { fetchStatisticsSnapshot } from "@/lib/supabase/statistics";
import type { StatisticsSnapshot } from "@/lib/types/statistics";
import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useMemo, useState } from "react";

function emptyData(): StatisticsSnapshot {
  return {
    kpis: {
      smsSent: 0,
      deliveryRate: null,
      stopCount: 0,
      creditsConsumed: 0,
    },
    campaignSeries: [],
    topGroups: [],
  };
}

export function useStatistics(range: { from: string; to: string }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<StatisticsSnapshot>(emptyData());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setData(emptyData());
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await fetchStatisticsSnapshot(supabase, userId, {
      from: range.from,
      to: range.to,
    });
    if (result.error) {
      setError(result.error.message);
      setData(emptyData());
      setLoading(false);
      return;
    }
    setData(result.data);
    setLoading(false);
  }, [supabase, userId, range.from, range.to]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  return { data, loading, error, refresh };
}
