"use client";

import { useUserProfile } from "@/components/auth/UserProfileProvider";
import {
  messages,
  type Locale,
  type MessageKey,
} from "@/lib/i18n/messages";
import { useCallback, useEffect, useMemo } from "react";

export function useI18n() {
  const { profile } = useUserProfile();
  const locale: Locale = profile?.language === "en" ? "en" : "fr";

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const dict = messages[locale];

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      let text = dict[key] ?? messages.fr[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [dict],
  );

  return useMemo(() => ({ locale, t }), [locale, t]);
}
