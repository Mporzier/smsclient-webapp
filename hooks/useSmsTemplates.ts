"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { fetchUserSmsTemplates } from "@/lib/supabase/smsTemplates";
import type { UserSmsTemplateRow } from "@/lib/types/smsTemplate";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useSmsTemplates() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<UserSmsTemplateRow[]>([]);
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
    const { data, error: err } = await fetchUserSmsTemplates(supabase, userId);
    if (err) {
      setError(err.message);
      setRows([]);
    } else {
      setRows(data);
    }
    setLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    if (authLoading) return;
    const t = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(t);
  }, [authLoading, refresh]);

  return { rows, loading, error, refresh, supabase, userId };
}
