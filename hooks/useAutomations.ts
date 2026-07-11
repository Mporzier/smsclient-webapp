"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { fetchAutomations } from "@/lib/supabase/automations";
import type { AutomationRowData } from "@/lib/types/automation";
import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useAutomations(enabled = true) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<AutomationRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchAutomations(supabase, userId);
    if (err) {
      setError(err.message);
      setRows([]);
    } else {
      setRows(data);
    }
    setLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    if (authLoading || !enabled) return;
    queueMicrotask(() => {
      void refresh();
    });
  }, [authLoading, enabled, refresh]);

  return { rows, loading, error, refresh };
}
