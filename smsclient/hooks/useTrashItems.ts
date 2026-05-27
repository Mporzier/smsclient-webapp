"use client";

import {
  fetchDeletedContacts,
  fetchDeletedGroups,
} from "@/lib/supabase/trash";
import type { DeletedContactRow, DeletedGroupRow } from "@/lib/types/trash";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

export function useTrashItems(
  supabase: SupabaseClient,
  userId: string | undefined,
  enabled: boolean,
) {
  const [contacts, setContacts] = useState<DeletedContactRow[]>([]);
  const [groups, setGroups] = useState<DeletedGroupRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setContacts([]);
      setGroups([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const [contactsRes, groupsRes] = await Promise.all([
      fetchDeletedContacts(supabase, userId),
      fetchDeletedGroups(supabase, userId),
    ]);
    if (contactsRes.error) {
      setError(contactsRes.error.message);
      setContacts([]);
      setGroups([]);
      setLoading(false);
      return;
    }
    if (groupsRes.error) {
      setError(groupsRes.error.message);
      setContacts([]);
      setGroups([]);
      setLoading(false);
      return;
    }
    setContacts(contactsRes.data);
    setGroups(groupsRes.data);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  return { contacts, groups, loading, error, refresh };
}
