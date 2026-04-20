"use client";

import { createClient } from "@/lib/supabase/client";
import { fetchClients } from "@/lib/supabase/clients";
import type { ContactRowData } from "@/lib/types/contact";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useContacts() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<ContactRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchClients(supabase);
    if (err) {
      setError(err.message);
      setRows([]);
    } else {
      setRows(data);
    }
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  return { rows, loading, error, refresh };
}
