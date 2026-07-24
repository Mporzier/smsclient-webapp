"use client";

import {
  THEME_EVENT,
  THEME_STORAGE_KEY,
  applyTheme,
  getStoredTheme,
  parseTheme,
  type ThemeMode,
} from "@/lib/theme/theme";
import { useEffect, useState } from "react";

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());

  useEffect(() => {
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<ThemeMode>).detail;
      setThemeState(parseTheme(detail));
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY) return;
      const next = parseTheme(e.newValue);
      applyTheme(next);
      setThemeState(next);
    };

    window.addEventListener(THEME_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(THEME_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setTheme = (next: ThemeMode) => {
    applyTheme(next);
    setThemeState(next);
  };

  return { theme, setTheme };
}
