"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { UserQrCodeRecord } from "@/lib/supabase/qrCodes";
import {
  fetchWheelConfig,
  replaceWheelSegments,
  saveWheelSettings,
  seedDefaultWheelSegments,
} from "@/lib/supabase/qrWheel";
import type { QrWheelConfig, QrWheelSegment } from "@/lib/types/qrWheel";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useQrWheel(qrRecord: UserQrCodeRecord | null) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const supabase = useMemo(() => createClient(), []);
  const [config, setConfig] = useState<QrWheelConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId || !qrRecord) {
      setConfig(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchWheelConfig(supabase, userId, qrRecord);
    if (err) {
      setError(err.message);
      setConfig(null);
    } else {
      setConfig(data);
    }
    setLoading(false);
  }, [userId, qrRecord, supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  const saveAll = useCallback(
    async (next: QrWheelConfig) => {
      if (!userId) throw new Error("Non connecté");
      const { error: settingsErr } = await saveWheelSettings(supabase, userId, next);
      if (settingsErr) throw settingsErr;
      const { error: segErr } = await replaceWheelSegments(
        supabase,
        userId,
        next.segments,
      );
      if (segErr) throw segErr;
      await refresh();
    },
    [userId, supabase, refresh],
  );

  const enableWithDefaults = useCallback(async () => {
    if (!userId) throw new Error("Non connecté");
    const { error: seedErr } = await seedDefaultWheelSegments(supabase, userId);
    if (seedErr) throw seedErr;
    const { error: settingsErr } = await saveWheelSettings(supabase, userId, {
      enabled: true,
      title: "Tournez la roue !",
      subtitle: "Inscrivez-vous et tentez votre chance",
      allowRepeat: false,
      prizeValidityDays: 30,
      sendPrizeSms: true,
    });
    if (settingsErr) throw settingsErr;
    await refresh();
  }, [userId, supabase, refresh]);

  return {
    config,
    loading,
    error,
    refresh,
    saveAll,
    enableWithDefaults,
  };
}

export type { QrWheelConfig, QrWheelSegment };
