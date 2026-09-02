"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function shouldShowExpandBanner(args: {
  pageSelectActive: boolean;
  matchTotal: number | null;
  selectedCount: number;
  /** true = encore des matchs hors page (hasMore) — bandeau avant count. */
  expandCandidate?: boolean;
  counting?: boolean;
  /** true = count en erreur ou expiré — bandeau reste, expand possible sans total. */
  countUnavailable?: boolean;
}): boolean {
  if (!args.pageSelectActive) return false;
  if (args.matchTotal != null) return args.matchTotal > args.selectedCount;
  return Boolean(
    args.expandCandidate || args.counting || args.countUnavailable,
  );
}

/** Requête count sans réponse (verrou auth, socket morte) : pas de spinner infini. */
const COUNT_TIMEOUT_MS = 10_000;

type CountResult = { count: number; error: Error | null };

async function countWithTimeout(
  countMatch: () => Promise<CountResult>,
): Promise<CountResult | "timeout"> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), COUNT_TIMEOUT_MS);
  });
  try {
    return await Promise.race([countMatch(), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function isIdSet(
  selectedIds: ReadonlySet<string> | readonly string[],
): selectedIds is ReadonlySet<string> {
  return (
    typeof selectedIds === "object" &&
    selectedIds !== null &&
    "size" in selectedIds &&
    typeof (selectedIds as ReadonlySet<string>).size === "number" &&
    typeof (selectedIds as ReadonlySet<string>).has === "function"
  );
}

function selectedCountOf(
  selectedIds: ReadonlySet<string> | readonly string[],
): number {
  return isIdSet(selectedIds) ? selectedIds.size : selectedIds.length;
}

export type UseGmailSelectAllArgs = {
  search: string;
  loadedIds: string[];
  selectedIds: ReadonlySet<string> | readonly string[];
  setSelectedIds: (ids: string[]) => void;
  countMatch: () => Promise<{ count: number; error: Error | null }>;
  fetchAllIds: () => Promise<{ data: string[]; error: Error | null }>;
  clearOnSearchChange?: boolean;
  selectLoadedMode?: "replace" | "merge";
  expandMode?: "replace" | "merge";
  expandCandidate?: boolean;
};

function toIdArray(
  selectedIds: ReadonlySet<string> | readonly string[],
): string[] {
  return isIdSet(selectedIds) ? Array.from(selectedIds) : [...selectedIds];
}

export type UseGmailSelectAllResult = {
  selectLoaded: () => void;
  deselectLoaded: () => void;
  clearSelection: () => void;
  showExpandBanner: boolean;
  matchTotal: number | null;
  /** Compteur CTA : optimiste pendant/après expand si ids pas encore à jour. */
  displaySelectedCount: number;
  counting: boolean;
  /** true = total inconnu (count en erreur ou expiré) — expand reste possible. */
  countUnavailable: boolean;
  expanding: boolean;
  expandError: string | null;
  expandToMatchAll: () => Promise<string[]>;
  /** Attend la fin du fetch ids (si expand en cours) puis renvoie la sélection complète. */
  ensureSelectionReady: () => Promise<string[]>;
  /** true = sélection « tous les matchs » intacte → actions par filtre serveur possibles. */
  matchAllActive: boolean;
  /** À appeler dès qu'une case est cochée/décochée à la main. */
  exitMatchAll: () => void;
};

export function useGmailSelectAll({
  search,
  loadedIds,
  selectedIds,
  setSelectedIds,
  countMatch,
  fetchAllIds,
  clearOnSearchChange = true,
  selectLoadedMode = "replace",
  expandMode = "replace",
  expandCandidate = false,
}: UseGmailSelectAllArgs): UseGmailSelectAllResult {
  const [pageSelectActive, setPageSelectActive] = useState(false);
  const [matchTotal, setMatchTotal] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);
  const [countUnavailable, setCountUnavailable] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [expandError, setExpandError] = useState<string | null>(null);
  /** Total affiché CTA juste après clic expand (avant fin fetch). */
  const [pendingDisplayTotal, setPendingDisplayTotal] = useState<number | null>(
    null,
  );
  const [matchAllActive, setMatchAllActive] = useState(false);

  const countGenRef = useRef(0);
  const prevSearchRef = useRef(search);
  const skipFirstSearchEffect = useRef(true);
  const selectedIdsRef = useRef(selectedIds);
  const expandCandidateRef = useRef(expandCandidate);
  const fetchAllIdsRef = useRef(fetchAllIds);
  const matchTotalRef = useRef(matchTotal);
  const expandPromiseRef = useRef<Promise<string[]> | null>(null);
  const expandGenRef = useRef(0);
  const expandModeRef = useRef(expandMode);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  useEffect(() => {
    expandCandidateRef.current = expandCandidate;
  }, [expandCandidate]);

  useEffect(() => {
    fetchAllIdsRef.current = fetchAllIds;
  }, [fetchAllIds]);

  useEffect(() => {
    matchTotalRef.current = matchTotal;
  }, [matchTotal]);

  useEffect(() => {
    expandModeRef.current = expandMode;
  }, [expandMode]);

  const resetBanner = useCallback(() => {
    setPageSelectActive(false);
    setMatchTotal(null);
    setCounting(false);
    setCountUnavailable(false);
    setExpandError(null);
    setExpanding(false);
    setPendingDisplayTotal(null);
    setMatchAllActive(false);
    countGenRef.current += 1;
    expandGenRef.current += 1;
    expandPromiseRef.current = null;
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    resetBanner();
  }, [resetBanner, setSelectedIds]);

  const deselectLoaded = useCallback(() => {
    const loaded = new Set(loadedIds);
    setSelectedIds(
      toIdArray(selectedIdsRef.current).filter((id) => !loaded.has(id)),
    );
    resetBanner();
  }, [loadedIds, resetBanner, setSelectedIds]);

  useEffect(() => {
    if (!clearOnSearchChange) return;
    if (skipFirstSearchEffect.current) {
      skipFirstSearchEffect.current = false;
      prevSearchRef.current = search;
      return;
    }
    if (prevSearchRef.current === search) return;
    prevSearchRef.current = search;
    setSelectedIds([]);
    resetBanner();
  }, [search, clearOnSearchChange, setSelectedIds, resetBanner]);

  const selectLoaded = useCallback(() => {
    if (selectLoadedMode === "merge") {
      const next = new Set(toIdArray(selectedIdsRef.current));
      for (const id of loadedIds) next.add(id);
      setSelectedIds(Array.from(next));
    } else {
      setSelectedIds([...loadedIds]);
    }
    setPendingDisplayTotal(null);
    setPageSelectActive(true);
    setMatchAllActive(false);
    setExpandError(null);
    setMatchTotal(null);
    setCountUnavailable(false);
    setCounting(true);
    const gen = ++countGenRef.current;
    void (async () => {
      const result = await countWithTimeout(countMatch);
      if (gen !== countGenRef.current) return;
      setCounting(false);
      if (result === "timeout") {
        setCountUnavailable(true);
        setMatchTotal(null);
        setExpandError(
          "Comptage indisponible. « Tout sélectionner » marche quand même.",
        );
        return;
      }
      const { count, error } = result;
      if (error) {
        setCountUnavailable(true);
        setExpandError(error.message);
        setMatchTotal(null);
        return;
      }
      setMatchTotal(count);
      if (count <= loadedIds.length && !expandCandidateRef.current) {
        setPageSelectActive(false);
      }
    })();
  }, [loadedIds, setSelectedIds, countMatch, selectLoadedMode]);

  const expandToMatchAll = useCallback(async () => {
    const expected = matchTotalRef.current;
    // Annule count en vol + compteur CTA immédiat.
    countGenRef.current += 1;
    setCounting(false);
    setPageSelectActive(false);
    setExpandError(null);
    setCountUnavailable(false);
    setMatchAllActive(expandModeRef.current === "replace");
    if (expected != null && expected > 0) {
      setPendingDisplayTotal(expected);
    }

    if (expandPromiseRef.current) {
      return expandPromiseRef.current;
    }

    const run = async (): Promise<string[]> => {
      const gen = ++expandGenRef.current;
      setExpanding(true);
      const { data, error } = await fetchAllIdsRef.current();
      // Expand annulé (clear / delete global / nouvelle recherche) : on jette.
      if (gen !== expandGenRef.current) return data;
      setExpanding(false);

      if (error && data.length === 0) {
        setExpandError(error.message);
        setPendingDisplayTotal(null);
        setPageSelectActive(true);
        setMatchAllActive(false);
        if (expected != null) setMatchTotal(expected);
        else setCountUnavailable(true);
        return toIdArray(selectedIdsRef.current);
      }

      let nextIds: string[];
      if (expandModeRef.current === "merge") {
        const next = new Set(toIdArray(selectedIdsRef.current));
        for (const id of data) next.add(id);
        nextIds = Array.from(next);
      } else {
        nextIds = data;
      }
      setSelectedIds(nextIds);

      if (expected != null && data.length < expected) {
        setExpandError(
          `Sélection incomplète (${data.length}/${expected}). Réessaie.`,
        );
      } else {
        setMatchTotal(null);
      }
      return nextIds;
    };

    const promise = run();
    expandPromiseRef.current = promise;
    try {
      return await promise;
    } finally {
      if (expandPromiseRef.current === promise) {
        expandPromiseRef.current = null;
      }
    }
  }, [setSelectedIds]);

  const ensureSelectionReady = useCallback(async () => {
    if (expandPromiseRef.current) {
      return expandPromiseRef.current;
    }
    const pending = pendingDisplayTotal;
    const current = toIdArray(selectedIdsRef.current);
    if (pending != null && current.length < pending) {
      return expandToMatchAll();
    }
    return current;
  }, [pendingDisplayTotal, expandToMatchAll]);

  const exitMatchAll = useCallback(() => {
    setMatchAllActive(false);
  }, []);

  const selectedCount = selectedCountOf(selectedIds);
  // Optimiste tant que les ids n’ont pas rattrapé le total expand (pas d’effect setState).
  const displaySelectedCount =
    pendingDisplayTotal != null && selectedCount < pendingDisplayTotal
      ? pendingDisplayTotal
      : selectedCount;
  const showExpandBanner = shouldShowExpandBanner({
    pageSelectActive,
    matchTotal,
    selectedCount,
    expandCandidate,
    counting,
    countUnavailable,
  });

  return {
    selectLoaded,
    deselectLoaded,
    clearSelection,
    showExpandBanner,
    matchTotal,
    displaySelectedCount,
    counting,
    countUnavailable,
    expanding,
    expandError,
    expandToMatchAll,
    ensureSelectionReady,
    matchAllActive,
    exitMatchAll,
  };
}
