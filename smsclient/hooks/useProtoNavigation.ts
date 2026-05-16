"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type AppRoute,
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

  const route = useMemo(
    () => parseHash(`#${hashPath}`) as AppRoute,
    [hashPath],
  );

  useEffect(() => {
    document.title = `SMSClient.fr — ${ROUTE_TITLES[route]}`;
  }, [route]);

  return { route, go };
}
