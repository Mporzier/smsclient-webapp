"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import {
  fetchContactPickerSummariesByIds,
  fetchContactPickerSummariesPage,
  fetchGroupMemberClientIds,
  type ContactPickerSummary,
} from "@/lib/supabase/clients";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import { useCallback, useEffect, useMemo, useState } from "react";

function matchesPickerSearch(c: ContactPickerSummary, q: string): boolean {
  if (!q) return true;
  const hay = `${c.name} ${c.phone} ${c.groups.join(" ")}`.toLowerCase();
  return hay.includes(q);
}

/**
 * Contacts picker modale groupe — lazyload serveur + search.
 * En edit : charge d’abord les membres du groupe, puis le reste.
 */
export function useGroupModalContacts(
  enabled: boolean,
  editGroupId?: string | null,
) {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const ready = enabled && !authLoading && Boolean(user?.id);

  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [memberRows, setMemberRows] = useState<ContactPickerSummary[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersReady, setMembersReady] = useState(!editGroupId);
  const [trackedEditGroupId, setTrackedEditGroupId] = useState(editGroupId);

  // Sync immédiat quand editGroupId change (évite 1 frame membersReady=true + memberIds=[]).
  if (editGroupId !== trackedEditGroupId) {
    setTrackedEditGroupId(editGroupId);
    setMemberIds([]);
    setMemberRows([]);
    setMembersLoading(Boolean(editGroupId));
    setMembersReady(!editGroupId);
  }

  useEffect(() => {
    if (!ready || !editGroupId) {
      queueMicrotask(() => {
        setMemberIds([]);
        setMemberRows([]);
        setMembersLoading(false);
        setMembersReady(true);
      });
      return;
    }

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      setMembersLoading(true);
      setMembersReady(false);
      setMemberIds([]);
      setMemberRows([]);

      void (async () => {
        const { data: ids, error: idErr } = await fetchGroupMemberClientIds(
          supabase,
          editGroupId,
        );
        if (cancelled) return;
        if (idErr) {
          setMemberIds([]);
          setMemberRows([]);
          setMembersLoading(false);
          setMembersReady(true);
          return;
        }
        setMemberIds(ids);
        const { data: rows, error: rowErr } =
          await fetchContactPickerSummariesByIds(supabase, ids);
        if (cancelled) return;
        if (rowErr) {
          setMemberRows([]);
        } else {
          setMemberRows(rows);
        }
        setMembersLoading(false);
        setMembersReady(true);
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [ready, editGroupId, supabase]);

  // Liste générale seulement après membres (edit) — membres apparaissent en premier.
  const listEnabled = ready && membersReady;

  const fetchPage = useCallback(
    async ({
      offset,
      limit,
      search,
    }: {
      offset: number;
      limit: number;
      search: string;
      sort: { id: string; desc: boolean } | null;
    }) => {
      return fetchContactPickerSummariesPage(supabase, {
        offset,
        limit,
        search,
        includeTotal: offset === 0,
      });
    },
    [supabase],
  );

  const {
    rows: listRows,
    loading: listLoading,
    loadingMore,
    hasMore,
    loadMore,
    totalCount,
    searchInput,
    setSearchInput,
    error,
  } = useInfiniteList<ContactPickerSummary>({
    enabled: listEnabled,
    fetchPage,
  });

  useEffect(() => {
    if (!ready) setSearchInput("");
  }, [ready, setSearchInput]);

  const contacts = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    const members = q
      ? memberRows.filter((c) => matchesPickerSearch(c, q))
      : memberRows;
    const memberIdSet = new Set(memberRows.map((r) => r.id));
    const rest = listRows.filter((r) => !memberIdSet.has(r.id));
    return [...members, ...rest];
  }, [listRows, memberRows, searchInput]);

  return {
    contacts,
    loading: Boolean(editGroupId) ? membersLoading || listLoading : listLoading,
    loadingMore,
    hasMore,
    loadMore,
    totalCount,
    searchInput,
    setSearchInput,
    memberIds,
    memberCount: memberIds.length,
    membersReady: !editGroupId || membersReady,
    error,
  };
}
