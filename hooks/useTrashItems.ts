"use client";

import {
  fetchDeletedContacts,
  fetchDeletedGroups,
} from "@/lib/supabase/trash";
import type { DeletedContactRow, DeletedGroupRow } from "@/lib/types/trash";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

export function useTrashItems(
  supabase: SupabaseClient,
  userId: string | undefined,
  enabled: boolean,
) {
  const id = userId ?? null;
  const [contacts, setContacts] = useState<DeletedContactRow[]>([]);
  const [groups, setGroups] = useState<DeletedGroupRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [settled, setSettled] = useState<{
    nonce: number;
    userId: string | null;
    enabled: boolean;
  } | null>(null);
  const waitersRef = useRef<Array<() => void>>([]);

  const flushWaiters = useCallback(() => {
    const waiters = waitersRef.current.splice(0);
    for (const resolve of waiters) resolve();
  }, []);

  if ((!enabled || !id) && settled !== null) {
    setSettled(null);
    setContacts([]);
    setGroups([]);
    setError(null);
  }

  const loading =
    enabled &&
    id != null &&
    (settled == null ||
      settled.nonce !== nonce ||
      settled.userId !== id ||
      !settled.enabled);

  useEffect(() => {
    if (enabled && id) return;
    flushWaiters();
  }, [enabled, id, flushWaiters]);

  useEffect(() => {
    if (!enabled || !id) return;
    let cancelled = false;
    const requestNonce = nonce;
    const requestUserId = id;

    void Promise.all([
      fetchDeletedContacts(supabase, requestUserId),
      fetchDeletedGroups(supabase, requestUserId),
    ]).then(([contactsRes, groupsRes]) => {
      if (cancelled) return;
      if (contactsRes.error) {
        setError(contactsRes.error.message);
        setContacts([]);
        setGroups([]);
      } else if (groupsRes.error) {
        setError(groupsRes.error.message);
        setContacts([]);
        setGroups([]);
      } else {
        setError(null);
        setContacts(contactsRes.data);
        setGroups(groupsRes.data);
      }
      setSettled({
        nonce: requestNonce,
        userId: requestUserId,
        enabled: true,
      });
      flushWaiters();
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, id, supabase, nonce, flushWaiters]);

  const refresh = useCallback(() => {
    return new Promise<void>((resolve) => {
      waitersRef.current.push(resolve);
      setNonce((n) => n + 1);
    });
  }, []);

  return { contacts, groups, loading, error, refresh };
}
