"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { defaultWheelSegments } from "@/lib/qr/wheelDefaults";
import {
  fetchWheelConfig,
  replaceWheelSegments,
  saveWheelSettings,
  seedDefaultWheelSegments,
} from "@/lib/supabase/qrWheel";
import type { QrWheelConfig, QrWheelSegment } from "@/lib/types/qrWheel";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useQrWheel(active: boolean) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const supabase = useMemo(() => createClient(), []);
  const [config, setConfig] = useState<QrWheelConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const refresh = useCallback(
    async (silent = false) => {
      if (!userId || !active) {
        setConfig(null);
        hasLoadedRef.current = false;
        return;
      }
      if (!silent && !hasLoadedRef.current) {
        setLoading(true);
      }
      setError(null);
      const { data, error: err } = await fetchWheelConfig(supabase, userId);
      if (err) {
        setError(err.message);
        if (!silent) setConfig(null);
      } else {
        setConfig(data);
        hasLoadedRef.current = true;
      }
      setLoading(false);
    },
    [userId, active, supabase],
  );

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  const patchEnabled = useCallback((enabled: boolean) => {
    setConfig((current) => (current ? { ...current, enabled } : current));
  }, []);

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
      setConfig(next);
    },
    [userId, supabase],
  );

  const enableWithDefaults = useCallback(async () => {
    if (!userId) throw new Error("Non connecté");

    const defaults = defaultWheelSegments();
    const optimistic: QrWheelConfig = {
      enabled: true,
      title: "Tournez la roue !",
      subtitle: "Inscrivez-vous et tentez votre chance",
      allowRepeat: false,
      prizeValidityDays: 30,
      sendPrizeSms: true,
      segments: defaults,
    };
    setConfig(optimistic);

    const { error: seedErr } = await seedDefaultWheelSegments(supabase, userId);
    if (seedErr) throw seedErr;
    const { error: settingsErr } = await saveWheelSettings(supabase, userId, {
      enabled: true,
      title: optimistic.title,
      subtitle: optimistic.subtitle,
      allowRepeat: optimistic.allowRepeat,
      prizeValidityDays: optimistic.prizeValidityDays,
      sendPrizeSms: optimistic.sendPrizeSms,
    });
    if (settingsErr) throw settingsErr;
    await refresh(true);
  }, [userId, supabase, refresh]);

  return {
    config,
    loading,
    error,
    refresh,
    patchEnabled,
    saveAll,
    enableWithDefaults,
  };
}

export type { QrWheelConfig, QrWheelSegment };
