"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type AppRoute,
  parseHash,
  parseLegacyCampaignWizardStep,
} from "@/lib/proto/routes";
import { setStoredCampaignWizardStep } from "@/lib/proto/campaignWizardSession";
import { routeTitleKey, useI18n } from "@/lib/i18n";

function readHashPath(): string {
  return window.location.hash.replace(/^#/, "");
}

export function useProtoNavigation() {
  const [hashPath, setHashPath] = useState(readHashPath);
  const { t } = useI18n();

  useEffect(() => {
    const sync = () => setHashPath(readHashPath());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  // Migration hash legacy → externe only ; state via hashchange.
  useEffect(() => {
    const legacyStep = parseLegacyCampaignWizardStep(window.location.hash);
    const path = readHashPath();
    if (legacyStep === null || path === "nouvelle-campagne") return;
    setStoredCampaignWizardStep(legacyStep);
    window.location.hash = "nouvelle-campagne";
  }, []);

  const go = useCallback((path: string) => {
    const p = path.startsWith("#") ? path.slice(1) : path;
    setHashPath(p);
    if (readHashPath() !== p) {
      window.location.hash = p;
    }
  }, []);

  const route = useMemo(
    () => parseHash(`#${hashPath}`) as AppRoute,
    [hashPath],
  );

  useEffect(() => {
    document.title = `SMSClient.fr — ${t(routeTitleKey(route))}`;
  }, [route, t]);

  return { route, go, hashPath };
}
