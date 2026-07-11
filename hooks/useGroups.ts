"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { fetchGroupsWithStats } from "@/lib/supabase/groups";
import type { GroupRowData } from "@/lib/types/group";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useGroups() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<GroupRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchGroupsWithStats(supabase, user.id);
    if (err) {
      setError(err.message);
      setRows([]);
    } else {
      setRows(data);
    }
    setLoading(false);
  }, [user?.id, supabase]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  return { rows, loading, error, refresh };
}
