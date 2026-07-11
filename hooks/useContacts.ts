"use client";

import { createClient } from "@/lib/supabase/client";
import { fetchClients } from "@/lib/supabase/clients";
import type { ContactRowData } from "@/lib/types/contact";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useContacts() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<ContactRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!userId) {
        setRows([]);
        if (!silent) setLoading(false);
        setError(null);
        return;
      }
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      const { data, error: err } = await fetchClients(supabase);
      if (err) {
        setError(err.message);
        setRows([]);
      } else {
        setRows(data);
      }
      if (!silent) {
        setLoading(false);
      }
    },
    [userId, supabase],
  );

  useEffect(() => {
    if (authLoading) return;
    queueMicrotask(() => {
      void refresh();
    });
  }, [authLoading, refresh]);

  /**
   * Mises à jour live : Realtime (si la table est dans `supabase_realtime` côté projet).
   * Pas de `filter` côté client : seules les lignes autorisées par RLS (SELECT) sont
   * envoyées, ce qui évite les soucis de filtre `user_id=eq.…` sur l’abonnement.
   */
  useEffect(() => {
    if (authLoading || !userId) return;

    let debounce: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        debounce = null;
        void refresh({ silent: true });
      }, 300);
    };

    const channel = supabase
      .channel(`realtime:clients:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clients",
        },
        () => {
          scheduleRefresh();
        },
      )
      .subscribe();

    return () => {
      if (debounce) clearTimeout(debounce);
      void supabase.removeChannel(channel);
    };
  }, [authLoading, userId, supabase, refresh]);

  /**
   * Quand l’onglet redevient visible (ex. retour depuis le formulaire QR dans un autre onglet),
   * re-sync même si Realtime n’est pas dispo (migration non appliquée, réseau, etc.).
   */
  useEffect(() => {
    if (authLoading || !userId) return;

    let debounce: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        debounce = null;
        if (document.visibilityState === "visible") {
          void refresh({ silent: true });
        }
      }, 400);
    };

    const onVis = () => {
      schedule();
    };
    const onFocus = () => {
      schedule();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);

    return () => {
      if (debounce) clearTimeout(debounce);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
    };
  }, [authLoading, userId, refresh]);

  return { rows, loading, error, refresh };
}
