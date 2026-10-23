"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { fetchReferralDashboard } from "@/lib/supabase/referral";
import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useReferral(active = true) {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const enabled = active && !authLoading && Boolean(user?.id);

  const [code, setCode] = useState<string | null>(null);
  const [signupCount, setSignupCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchReferralDashboard(supabase);
    setLoading(false);
    if (err || !data) {
      setError(err ?? "Chargement impossible.");
      setCode(null);
      setSignupCount(0);
      return;
    }
    setCode(data.code);
    setSignupCount(data.signupCount);
  }, [enabled, supabase]);

  useEffect(() => {
    if (authLoading || !active) return;
    queueMicrotask(() => {
      void refresh();
    });
  }, [active, authLoading, refresh]);

  return {
    code,
    signupCount,
    loading: authLoading || loading,
    error,
    refresh,
  };
}
