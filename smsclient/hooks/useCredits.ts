"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  buyCreditsDummy,
  fetchCreditsSnapshot,
  type BuyCreditsInput,
} from "@/lib/supabase/credits";
import type { CreditPurchaseRowData } from "@/lib/types/credits";
import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useCredits() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const supabase = useMemo(() => createClient(), []);
  const [balance, setBalance] = useState(0);
  const [balanceLabel, setBalanceLabel] = useState("0");
  const [purchases, setPurchases] = useState<CreditPurchaseRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setBalance(0);
      setBalanceLabel("0");
      setPurchases([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchCreditsSnapshot(supabase, userId);
    if (err) {
      setError(err.message);
    }
    setBalance(data.balance);
    setBalanceLabel(data.balanceLabel);
    setPurchases(data.purchases);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  const buy = useCallback(
    async (input: BuyCreditsInput): Promise<{ invoiceRef: string | null; error: Error | null }> => {
      if (!userId) {
        return { invoiceRef: null, error: new Error("Tu dois être connecté pour acheter des crédits.") };
      }
      const result = await buyCreditsDummy(supabase, userId, input);
      if (!result.error) {
        await refresh();
      }
      return result;
    },
    [supabase, userId, refresh],
  );

  return {
    balance,
    balanceLabel,
    purchases,
    loading,
    error,
    refresh,
    buy,
  };
}
