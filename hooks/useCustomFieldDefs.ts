"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import {
  createCustomFieldDef,
  deleteCustomFieldDef,
  fetchCustomFieldDefs,
  swapCustomFieldDefOrder,
  updateCustomFieldDef,
} from "@/lib/supabase/customFields";
import type {
  CustomFieldDef,
  CustomFieldType,
} from "@/lib/types/customFields";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useCustomFieldDefs() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const supabase = useMemo(() => createClient(), []);
  const [defs, setDefs] = useState<CustomFieldDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setDefs([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchCustomFieldDefs(supabase, userId);
    if (err) {
      setError(err.message);
      setDefs([]);
    } else {
      setDefs(data);
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

  const createDef = useCallback(
    async (input: { label: string; fieldType: CustomFieldType }) => {
      if (!userId) return { error: new Error("Non authentifié.") };
      const { error: err } = await createCustomFieldDef(supabase, userId, input);
      if (!err) await refresh();
      return { error: err };
    },
    [userId, supabase, refresh],
  );

  const renameDef = useCallback(
    async (fieldId: string, label: string) => {
      if (!userId) return { error: new Error("Non authentifié.") };
      const { error: err } = await updateCustomFieldDef(supabase, userId, fieldId, {
        label,
      });
      if (!err) await refresh();
      return { error: err };
    },
    [userId, supabase, refresh],
  );

  const removeDef = useCallback(
    async (fieldId: string) => {
      if (!userId) return { error: new Error("Non authentifié.") };
      const { error: err } = await deleteCustomFieldDef(supabase, userId, fieldId);
      if (!err) await refresh();
      return { error: err };
    },
    [userId, supabase, refresh],
  );

  const moveDef = useCallback(
    async (fieldId: string, direction: "up" | "down") => {
      if (!userId) return { error: new Error("Non authentifié.") };
      const idx = defs.findIndex((d) => d.id === fieldId);
      if (idx < 0) return { error: null };
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= defs.length) return { error: null };
      const a = defs[idx];
      const b = defs[swapIdx];
      const { error: err } = await swapCustomFieldDefOrder(
        supabase,
        userId,
        a.id,
        a.sortOrder,
        b.id,
        b.sortOrder,
      );
      if (!err) await refresh();
      return { error: err };
    },
    [userId, supabase, defs, refresh],
  );

  return {
    defs,
    loading,
    error,
    refresh,
    createDef,
    renameDef,
    removeDef,
    moveDef,
    supabase,
    userId,
  };
}
