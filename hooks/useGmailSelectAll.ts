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
  fetchAllIds: () => Promise<{
    data: string[];
    error: Error | null;
    usedServerFilter?: boolean;
  }>;
  clearOnSearchChange?: boolean;
  selectLoadedMode?: "replace" | "merge";
  expandMode?: "replace" | "merge";
  expandCandidate?: boolean;
  /** Total match connu (liste paginée) — évite flicker bandeau avant count RPC. */
  listMatchTotal?: number | null;
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
  /** Toutes les lignes chargées sont cochées. */
  allLoadedSelected: boolean;
};

function loadedIdsAllSelected(
  loadedIds: readonly string[],
  selectedIds: ReadonlySet<string> | readonly string[],
): boolean {
  if (loadedIds.length === 0) return false;
  if (isIdSet(selectedIds)) {
    return loadedIds.every((id) => selectedIds.has(id));
  }
  const set = new Set(selectedIds);
  return loadedIds.every((id) => set.has(id));
}

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
  listMatchTotal = null,
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
  const listMatchTotalRef = useRef(listMatchTotal);
  const fetchAllIdsRef = useRef(fetchAllIds);
  const matchTotalRef = useRef(matchTotal);
  const expandPromiseRef = useRef<Promise<string[]> | null>(null);
  const expandGenRef = useRef(0);
  const expandModeRef = useRef(expandMode);
  const matchAllActiveRef = useRef(matchAllActive);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  useEffect(() => {
    expandCandidateRef.current = expandCandidate;
  }, [expandCandidate]);

  useEffect(() => {
    matchAllActiveRef.current = matchAllActive;
  }, [matchAllActive]);

  useEffect(() => {
    listMatchTotalRef.current = listMatchTotal;
  }, [listMatchTotal]);

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
    setExpanding(false);
    expandGenRef.current += 1;
    expandPromiseRef.current = null;
    const seedTotal = listMatchTotalRef.current;
    setMatchTotal(typeof seedTotal === "number" ? seedTotal : null);
    setCountUnavailable(false);
    setCounting(typeof seedTotal !== "number");
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
      const listTotal = listMatchTotalRef.current;
      const stillExpandable =
        expandCandidateRef.current ||
        count > loadedIds.length ||
        (typeof listTotal === "number" && listTotal > loadedIds.length);
      if (!stillExpandable && count <= loadedIds.length) {
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
      try {
        const result = await fetchAllIdsRef.current();
        const { data, error, usedServerFilter } = result;
        if (gen !== expandGenRef.current) return data;

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
        if (!usedServerFilter) {
          setSelectedIds(nextIds);
        }

        if (usedServerFilter) {
          setMatchTotal(null);
          setPendingDisplayTotal(null);
        } else if (expected != null && data.length < expected) {
          setExpandError(
            `Sélection incomplète (${data.length}/${expected}). Réessaie.`,
          );
        } else {
          setMatchTotal(null);
          setPendingDisplayTotal(null);
        }
        return nextIds;
      } finally {
        if (gen === expandGenRef.current) {
          setExpanding(false);
        }
      }
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
    const current = toIdArray(selectedIdsRef.current);
    if (matchAllActiveRef.current) {
      return current;
    }
    const pending = pendingDisplayTotal;
    if (pending == null || current.length >= pending) {
      return current;
    }
    return expandToMatchAll();
  }, [pendingDisplayTotal, expandToMatchAll]);

  const exitMatchAll = useCallback(() => {
    setMatchAllActive(false);
  }, []);

  const selectedCount = selectedCountOf(selectedIds);
  const allLoadedSelected = loadedIdsAllSelected(loadedIds, selectedIds);
  // Page select = offre d’étendre au-delà de la page courante (pas le total sélectionné).
  const showExpandBanner =
    pageSelectActive &&
    (matchTotal != null
      ? matchTotal > loadedIds.length
      : Boolean(expandCandidate || counting || countUnavailable));
  const displaySelectedCount =
    pendingDisplayTotal != null && selectedCount < pendingDisplayTotal
      ? pendingDisplayTotal
      : selectedCount;

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
    allLoadedSelected,
  };
}
