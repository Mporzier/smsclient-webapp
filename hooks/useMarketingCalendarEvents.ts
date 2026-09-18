"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchMarketingCalendarEvents,
  insertMarketingCalendarEvent,
} from "@/lib/supabase/marketingCalendarEvents";
import { createClient } from "@/lib/supabase/client";
import type {
  MarketingCalendarEvent,
  MarketingCalendarEventType,
} from "@/lib/types/marketingCalendarEvent";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useMarketingCalendarEvents() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const supabase = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<MarketingCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setEvents([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetchMarketingCalendarEvents(supabase, userId);
    if (res.error) {
      setError(res.error.message);
      setEvents([]);
    } else {
      setEvents(res.data);
    }
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    if (authLoading) return;
    queueMicrotask(() => {
      void refresh();
    });
  }, [authLoading, refresh]);

  const addEvent = useCallback(
    async (input: {
      title: string;
      date: string;
      type: MarketingCalendarEventType;
    }) => {
      if (!userId) {
        return { error: "not_authenticated" as const };
      }
      const res = await insertMarketingCalendarEvent(supabase, userId, input);
      if (res.error) {
        return { error: res.error.message };
      }
      if (res.data) {
        setEvents((prev) =>
          [...prev, res.data!].sort((a, b) => a.date.localeCompare(b.date)),
        );
      }
      return { data: res.data, error: null };
    },
    [supabase, userId],
  );

  return {
    events,
    loading: authLoading || loading,
    error,
    refresh,
    addEvent,
  };
}
