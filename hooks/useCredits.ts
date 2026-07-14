"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  buyCreditsDummy,
  fetchCreditsSnapshot,
  type BuyCreditsInput,
} from "@/lib/supabase/credits";
import type { CreditPurchaseRowData } from "@/lib/types/credits";
import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useCredits() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const supabase = useMemo(() => createClient(), []);
  const [balance, setBalance] = useState(0);
  const [balanceLabel, setBalanceLabel] = useState("0");
  const [purchases, setPurchases] = useState<CreditPurchaseRowData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [settled, setSettled] = useState<{
    nonce: number;
    userId: string | null;
  } | null>(null);
  const waitersRef = useRef<Array<() => void>>([]);

  const flushWaiters = useCallback(() => {
    const waiters = waitersRef.current.splice(0);
    for (const resolve of waiters) resolve();
  }, []);

  if (!userId && settled !== null) {
    setSettled(null);
    setBalance(0);
    setBalanceLabel("0");
    setPurchases([]);
    setError(null);
  }

  const loading =
    authLoading ||
    (userId != null &&
      (settled == null ||
        settled.nonce !== nonce ||
        settled.userId !== userId));

  useEffect(() => {
    if (userId) return;
    flushWaiters();
  }, [userId, flushWaiters]);

  useEffect(() => {
    if (authLoading || !userId) return;
    let cancelled = false;
    const requestNonce = nonce;
    const requestUserId = userId;

    void fetchCreditsSnapshot(supabase, requestUserId).then(
      ({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
        } else {
          setError(null);
        }
        setBalance(data.balance);
        setBalanceLabel(data.balanceLabel);
        setPurchases(data.purchases);
        setSettled({ nonce: requestNonce, userId: requestUserId });
        flushWaiters();
      },
    );

    return () => {
      cancelled = true;
    };
  }, [authLoading, userId, supabase, nonce, flushWaiters]);

  const refresh = useCallback(() => {
    return new Promise<void>((resolve) => {
      waitersRef.current.push(resolve);
      setNonce((n) => n + 1);
    });
  }, []);

  const buy = useCallback(
    async (
      input: BuyCreditsInput,
    ): Promise<{ invoiceRef: string | null; error: Error | null }> => {
      if (!userId) {
        return {
          invoiceRef: null,
          error: new Error(
            "Vous devez être connecté pour acheter des crédits.",
          ),
        };
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
