"use client";

import { sanitizeSender } from "@/lib/proto/smsUtils";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "smsclient.smsSender";
const DEFAULT_SENDER = "BOULANGERIE";

export function usePersistedSmsSender() {
  const [sender, setSenderState] = useState(DEFAULT_SENDER);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw != null) setSenderState(sanitizeSender(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const setSender = useCallback((v: string) => {
    const s = sanitizeSender(v);
    setSenderState(s);
    try {
      localStorage.setItem(STORAGE_KEY, s);
    } catch {
      /* ignore */
    }
  }, []);

  return { sender, setSender };
}
