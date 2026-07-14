"use client";

import { sanitizeSender } from "@/lib/proto/smsUtils";
import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "smsclient.smsSender";
const SENDER_EVENT = "smsclient-sender";
const DEFAULT_SENDER = "BOULANGERIE";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(SENDER_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(SENDER_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function readSender(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw != null) return sanitizeSender(raw);
  } catch {
    /* ignore */
  }
  return DEFAULT_SENDER;
}

function getServerSnapshot() {
  return DEFAULT_SENDER;
}

export function usePersistedSmsSender() {
  const sender = useSyncExternalStore(subscribe, readSender, getServerSnapshot);

  const setSender = useCallback((v: string) => {
    const s = sanitizeSender(v);
    try {
      localStorage.setItem(STORAGE_KEY, s);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(SENDER_EVENT));
  }, []);

  return { sender, setSender };
}
