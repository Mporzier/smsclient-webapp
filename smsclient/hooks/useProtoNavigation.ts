"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type AppRoute,
  type LandingScreen,
  parseHash,
  ROUTE_TITLES,
} from "@/lib/proto/routes";

export function useProtoNavigation() {
  const [hashPath, setHashPath] = useState("");

  useEffect(() => {
    const sync = () => setHashPath(window.location.hash.replace(/^#/, ""));
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const go = useCallback((path: string) => {
    const p = path.startsWith("#") ? path.slice(1) : path;
    window.location.hash = p;
  }, []);

  const parsed = useMemo(() => parseHash(`#${hashPath}`), [hashPath]);

  useEffect(() => {
    if (parsed.landing) {
      document.title =
        parsed.landing === "home"
          ? "SMSClient.fr — Accueil"
          : "SMSClient.fr — Features";
      return;
    }
    document.title = `SMSClient.fr — ${ROUTE_TITLES[parsed.route]}`;
  }, [parsed.landing, parsed.route]);

  return {
    hashPath,
    landing: parsed.landing as LandingScreen | null,
    route: parsed.route as AppRoute,
    go,
  };
}
