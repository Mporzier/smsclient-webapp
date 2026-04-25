"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import {
  getOrCreateUserQrCode,
  regenerateUserQrCode,
  type UserQrCodeRecord,
} from "@/lib/supabase/qrCodes";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useUserQrCode() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const supabase = useMemo(() => createClient(), []);
  const [record, setRecord] = useState<UserQrCodeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setRecord(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await getOrCreateUserQrCode(supabase, userId);
    if (err) {
      setError(err.message);
      setRecord(null);
    } else {
      setRecord(data);
    }
    setLoading(false);
  }, [userId, supabase]);

  const regenerate = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await regenerateUserQrCode(supabase, userId);
    if (err) {
      setError(err.message);
    } else {
      setRecord(data);
    }
    setLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    if (authLoading) return;
    queueMicrotask(() => {
      void refresh();
    });
  }, [authLoading, refresh]);

  const publicUrl =
    record?.slug && typeof window !== "undefined"
      ? `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/capture/?s=${encodeURIComponent(record.slug)}`
      : "";

  return {
    record,
    publicUrl,
    loading,
    error,
    refresh,
    regenerate,
  };
}
