"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type AppRoute,
  parseHash,
  parseLegacyCampaignWizardStep,
  ROUTE_TITLES,
} from "@/lib/proto/routes";
import { setStoredCampaignWizardStep } from "@/lib/proto/campaignWizardSession";

function readHashPath(): string {
  return window.location.hash.replace(/^#/, "");
}

export function useProtoNavigation() {
  const [hashPath, setHashPath] = useState(readHashPath);

  useEffect(() => {
    const sync = () => setHashPath(readHashPath());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    const legacyStep = parseLegacyCampaignWizardStep(window.location.hash);
    const path = readHashPath();
    if (legacyStep !== null && path !== "nouvelle-campagne") {
      setStoredCampaignWizardStep(legacyStep);
      window.location.hash = "nouvelle-campagne";
      setHashPath("nouvelle-campagne");
    }
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
    document.title = `SMSClient.fr — ${ROUTE_TITLES[route]}`;
  }, [route]);

  return { route, go };
}
