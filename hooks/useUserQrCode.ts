"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { buildDefaultQrWelcomeSmsTemplate } from "@/lib/qr/welcomeSmsDefaults";
import {
  getOrCreateUserQrCode,
  qrCaptureModeFromRecord,
  regenerateUserQrCode,
  setQrCaptureMode,
  updateUserQrWelcomeSms,
  type QrCaptureMode,
  type UserQrCodeRecord,
  type UserQrWelcomeSmsPatch,
} from "@/lib/supabase/qrCodes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function patchCaptureMode(
  record: UserQrCodeRecord,
  mode: QrCaptureMode,
): UserQrCodeRecord {
  return {
    ...record,
    welcome_sms_enabled: mode === "welcome",
    wheel_enabled: mode === "wheel",
  };
}

export function useUserQrCode(enabled = true, companyName?: string) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const supabase = useMemo(() => createClient(), []);
  const [record, setRecord] = useState<UserQrCodeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const refresh = useCallback(
    async (silent = false) => {
      if (!userId) {
        setRecord(null);
        setError(null);
        setLoading(false);
        hasLoadedRef.current = false;
        return;
      }
      if (!silent && !hasLoadedRef.current) {
        setLoading(true);
      }
      setError(null);
      const { data, error: err } = await getOrCreateUserQrCode(supabase, userId);
      if (err) {
        setError(err.message);
        if (!silent) setRecord(null);
      } else {
        setRecord(data);
        hasLoadedRef.current = true;
      }
      setLoading(false);
    },
    [userId, supabase],
  );

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

  const updateWelcomeSms = useCallback(
    async (patch: UserQrWelcomeSmsPatch) => {
      if (!userId) return;
      setError(null);
      const { data, error: err } = await updateUserQrWelcomeSms(
        supabase,
        userId,
        patch,
      );
      if (err) {
        setError(err.message);
        throw err;
      }
      setRecord(data);
    },
    [userId, supabase],
  );

  const patchWelcomeSmsEnabled = useCallback((enabled: boolean) => {
    setRecord((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        welcome_sms_enabled: enabled,
        ...(enabled ? { wheel_enabled: false } : {}),
      };
    });
  }, []);

  const setWelcomeSmsEnabled = useCallback(
    async (enabled: boolean) => {
      if (!userId) return;
      let snapshot: UserQrCodeRecord | null = null;
      setRecord((prev) => {
        if (!prev) return prev;
        snapshot = prev;
        return {
          ...prev,
          welcome_sms_enabled: enabled,
          ...(enabled ? { wheel_enabled: false } : {}),
        };
      });
      if (!snapshot) return;
      try {
        await updateWelcomeSms({ enabled });
      } catch (err) {
        setRecord(snapshot);
        throw err;
      }
    },
    [userId, updateWelcomeSms],
  );

  const setWelcomeSmsTemplate = useCallback(
    async (template: string) => {
      await updateWelcomeSms({ template });
    },
    [updateWelcomeSms],
  );

  const setCaptureMode = useCallback(
    async (mode: QrCaptureMode) => {
      if (!userId) return;
      setError(null);

      let snapshot: UserQrCodeRecord | null = null;
      setRecord((prev) => {
        if (!prev) return prev;
        snapshot = prev;
        return patchCaptureMode(prev, mode);
      });
      if (!snapshot) return;

      const { data, error: err } = await setQrCaptureMode(
        supabase,
        userId,
        mode,
      );
      if (err) {
        setRecord(snapshot);
        setError(err.message);
        throw err;
      }
      if (data) setRecord(data);
    },
    [userId, supabase],
  );

  useEffect(() => {
    if (authLoading || !enabled) return;
    queueMicrotask(() => {
      void refresh();
    });
  }, [authLoading, enabled, refresh]);

  const publicUrl =
    record?.slug && typeof window !== "undefined"
      ? `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/capture/?s=${encodeURIComponent(record.slug)}`
      : "";

  return {
    record,
    publicUrl,
    captureMode: qrCaptureModeFromRecord(record),
    welcomeSmsEnabled: record?.welcome_sms_enabled ?? false,
    welcomeSmsTemplate:
      record?.welcome_sms_template ??
      buildDefaultQrWelcomeSmsTemplate(companyName ?? ""),
    loading,
    error,
    refresh,
    regenerate,
    setCaptureMode,
    patchWelcomeSmsEnabled,
    setWelcomeSmsEnabled,
    setWelcomeSmsTemplate,
  };
}
