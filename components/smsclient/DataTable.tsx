"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnSizingState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { CellTruncate } from "@/components/smsclient/ui";
import { LIST_COLUMN_PINNED_IDS } from "@/components/smsclient/listViewTableHelpers";
import { distributeColumnWidths } from "@/components/smsclient/listColumnSizes";
import { LoadingLabel } from "@/components/ui/loading-label";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SetStateAction,
} from "react";

type DataTableProps<T> = {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  loading?: boolean;
  /** @deprecated Pagination retirée — lazyload via onLoadMore. */
  pageSize?: number;
  /** Filtre client (évité si search serveur). */
  globalFilter?: string;
  emptyMessage?: ReactNode;
  loadingMessage?: string;
  searchNoResultsMessage?: ReactNode;
  /** Liste vide avec filtres actifs (sans recherche texte). */
  filterNoResultsMessage?: ReactNode;
  /** Liste vide avec recherche + filtres. */
  searchAndFilterNoResultsMessage?: ReactNode;
  onRowClick?: (row: T) => void;
  footer?: ReactNode;
  /** Tronque le contenu au lieu de faire défiler horizontalement. */
  clipHorizontalOverflow?: boolean;
  /**
   * Largeur min du tableau (px). Si > viewport, scroll horizontal.
   * Sans ça : colonnes compressées pour remplir exactement le conteneur.
   */
  minContentWidth?: number;
  /** Tri contrôlé (ex. ContactsView) — survit au remount interne de la table. */
  sorting?: SortingState;
  onSortingChange?: (updater: SetStateAction<SortingState>) => void;
  /**
   * Données déjà triées par le parent — TanStack n’applique pas getSortedRowModel.
   * Utile liste Contacts (tris multi-colonnes d’affilée).
   */
  manualSorting?: boolean;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (updater: SetStateAction<ColumnFiltersState>) => void;
  manualFiltering?: boolean;
  hasActiveFilters?: boolean;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (updater: SetStateAction<VisibilityState>) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
  emptyRowClassName?: string;
};

const NO_SORT_IDS = new Set(["select", "actions", "avatar", "icon"]);
const NO_FILTER_IDS = NO_SORT_IDS;

function tableCellPaddingClass(colId: string): string {
  if (colId === "icon") return "px-1 text-center";
  if (colId === "select" || colId === "actions") return "px-2 text-center";
  return "px-3";
}

function isUtilityCenterColumn(colId: string): boolean {
  return colId === "select" || colId === "actions" || colId === "icon";
}

/** py-2 + icône tri h-3.5 — réf. liste Liens ; fige la hauteur avec filtres / checkbox. */
const TABLE_HEAD_ROW_CLS = "h-[1.875rem] py-0 leading-none";
const TABLE_HEAD_ROW_PX = 30;

type ColumnResizeSession = {
  columnId: string;
  startX: number;
  startSize: number;
  minSize: number;
  maxSize: number;
  leftOffset: number;
};

function columnCanManualResize(colId: string): boolean {
  return (
    colId !== "select" &&
    colId !== "actions" &&
    colId !== "avatar" &&
    colId !== "icon"
  );
}

function leftOffsetBeforeColumn(
  columnId: string,
  sizing: ColumnSizingState,
  weights: { id: string; weight: number }[]
): number {
  let offset = 0;
  for (const w of weights) {
    if (w.id === columnId) break;
    offset += sizing[w.id] ?? w.weight;
  }
  return offset;
}

function clampColumnWidth(size: number, minSize: number, maxSize: number): number {
  return Math.min(maxSize, Math.max(minSize, size));
}

function pointerClientX(e: MouseEvent | TouchEvent): number {
  if ("touches" in e) {
    const t = e.touches[0] ?? e.changedTouches[0];
    return t?.clientX ?? 0;
  }
  return e.clientX;
}

function columnId<T>(col: ColumnDef<T, unknown>): string | undefined {
  if (col.id) return col.id;
  if ("accessorKey" in col && col.accessorKey != null) {
    return String(col.accessorKey);
  }
  return undefined;
}

function withColumnDefaults<T>(
  columns: ColumnDef<T, unknown>[]
): ColumnDef<T, unknown>[] {
  return columns.map((col) => {
    const id = columnId(col);
    const noResize = id === "select" || id === "actions" || id === "icon";
    const noSort = id != null && NO_SORT_IDS.has(id);
    const noFilter = id != null && NO_FILTER_IDS.has(id);
    return {
      ...col,
      enableResizing: noResize ? false : col.enableResizing ?? true,
      enableSorting: noSort ? false : col.enableSorting ?? true,
      enableColumnFilter: noFilter ? false : col.enableColumnFilter ?? true,
      enableHiding:
        id != null && LIST_COLUMN_PINNED_IDS.has(id)
          ? false
          : col.enableHiding ?? true,
      minSize: col.minSize ?? col.size ?? (noResize ? 36 : 64),
      /** Plafond resize manuel (évite colonnes trop larges). */
      maxSize: col.maxSize ?? 600,
    };
  });
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  pageSize: _pageSize = 20,
  globalFilter = "",
  emptyMessage = "Aucun élément.",
  loadingMessage = "Chargement…",
  searchNoResultsMessage = "Aucun résultat pour cette recherche.",
  filterNoResultsMessage,
  searchAndFilterNoResultsMessage,
  onRowClick,
  footer,
  clipHorizontalOverflow = false,
  minContentWidth,
  sorting: sortingProp,
  onSortingChange: onSortingChangeProp,
  manualSorting = false,
  columnFilters: columnFiltersProp,
  onColumnFiltersChange: onColumnFiltersChangeProp,
  manualFiltering = false,
  hasActiveFilters = false,
  columnVisibility: columnVisibilityProp,
  onColumnVisibilityChange: onColumnVisibilityChangeProp,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  className,
  emptyRowClassName,
}: DataTableProps<T>) {
  void _pageSize;
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const sorting = sortingProp ?? internalSorting;
  const [internalColumnFilters, setInternalColumnFilters] =
    useState<ColumnFiltersState>([]);
  const columnFilters = columnFiltersProp ?? internalColumnFilters;
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [internalColumnVisibility, setInternalColumnVisibility] =
    useState<VisibilityState>({});
  const columnVisibility = columnVisibilityProp ?? internalColumnVisibility;
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const userResizedRef = useRef(false);
  const fillKeyRef = useRef("");
  const lastAvailRef = useRef(0);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;
  const columnSizingRef = useRef(columnSizing);
  columnSizingRef.current = columnSizing;
  const resizePreviewRef = useRef<HTMLDivElement>(null);
  const resizeSessionRef = useRef<ColumnResizeSession | null>(null);
  const resizeListenersRef = useRef<{
    move: (e: MouseEvent | TouchEvent) => void;
    up: (e: MouseEvent | TouchEvent) => void;
  } | null>(null);
  const handleColumnSizingChangeRef = useRef<
    (updater: SetStateAction<ColumnSizingState>) => void
  >(() => {});

  const sizedColumns = useMemo(() => withColumnDefaults(columns), [columns]);

  const sizingWeights = useMemo(
    () =>
      sizedColumns.map((col) => {
        const id = columnId(col) ?? "col";
        return {
          id,
          weight: col.size ?? 120,
          minSize: col.minSize ?? 64,
          maxSize: col.maxSize ?? 600,
        };
      }),
    [sizedColumns]
  );

  const visibleSizingWeights = useMemo(
    () =>
      sizingWeights.filter((w) => {
        if (LIST_COLUMN_PINNED_IDS.has(w.id)) return true;
        return columnVisibility[w.id] !== false;
      }),
    [sizingWeights, columnVisibility]
  );
  const visibleSizingWeightsRef = useRef(visibleSizingWeights);
  visibleSizingWeightsRef.current = visibleSizingWeights;

  /** Somme des largeurs ≥ clientWidth — sinon blanc + pas de scroll. */
  const clampSizingToContainer = useCallback(
    (
      sizing: ColumnSizingState,
      avail: number,
      preferGrowId?: string
    ): ColumnSizingState => {
      if (avail <= 0 || visibleSizingWeights.length === 0) return sizing;

      let sum = 0;
      const resolved: ColumnSizingState = {};
      for (const w of visibleSizingWeights) {
        const size = sizing[w.id] ?? w.weight;
        resolved[w.id] = size;
        sum += size;
      }
      if (sum >= avail) return sizing;

      const deficit = avail - sum;
      const growId =
        preferGrowId && resolved[preferGrowId] != null
          ? preferGrowId
          : [...visibleSizingWeights]
              .reverse()
              .find((w) => w.id !== "select" && w.id !== "actions")?.id ??
            visibleSizingWeights[visibleSizingWeights.length - 1]!.id;

      return {
        ...resolved,
        [growId]: (resolved[growId] ?? 0) + deficit,
      };
    },
    [visibleSizingWeights]
  );

  const applyContainerFill = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const avail = el.clientWidth;
    if (avail <= 0) return;
    const target = Math.max(avail, minContentWidth ?? 0);
    const colsKey = visibleSizingWeights
      .map((w) => `${w.id}:${w.weight}:${w.minSize}:${w.maxSize}`)
      .join("|");
    const visKey = Object.entries(columnVisibility)
      .filter(([, v]) => v === false)
      .map(([k]) => k)
      .sort()
      .join(",");
    const layoutKey = `${colsKey}::${visKey}`;
    if (!userResizedRef.current) {
      const prevAvail = lastAvailRef.current;
      // L'apparition de la scrollbar verticale (lazyload) doit relancer la
      // répartition, sinon les colonnes dépassent ou laissent du blanc.
      if (
        fillKeyRef.current === layoutKey &&
        prevAvail > 0 &&
        avail === prevAvail
      ) {
        return;
      }
      lastAvailRef.current = avail;
      fillKeyRef.current = layoutKey;
      setColumnSizing(distributeColumnWidths(visibleSizingWeights, target));
      return;
    }
    const prevAvail = lastAvailRef.current;
    if (prevAvail > 0 && Math.abs(avail - prevAvail) <= 20) {
      return;
    }
    lastAvailRef.current = avail;
    setColumnSizing((prev) => clampSizingToContainer(prev, target));
  }, [
    visibleSizingWeights,
    columnVisibility,
    clampSizingToContainer,
    minContentWidth,
  ]);

  useLayoutEffect(() => {
    userResizedRef.current = false;
    fillKeyRef.current = "";
  }, [columnVisibility]);

  useLayoutEffect(() => {
    applyContainerFill();
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => applyContainerFill());
    ro.observe(el);
    return () => ro.disconnect();
  }, [applyContainerFill]);

  const handleColumnSizingChange = useCallback(
    (updater: SetStateAction<ColumnSizingState>) => {
      userResizedRef.current = true;
      setColumnSizing((prev) => {
        const raw =
          typeof updater === "function" ? updater(prev) : updater;
        const proposed: ColumnSizingState = { ...raw };
        for (const w of visibleSizingWeights) {
          const v = proposed[w.id];
          if (v != null) {
            proposed[w.id] = clampColumnWidth(v, w.minSize, w.maxSize);
          }
        }
        const avail = scrollRef.current?.clientWidth ?? 0;
        if (avail <= 0) return proposed;
        const target = Math.max(avail, minContentWidth ?? 0);

        let shrunkId: string | undefined;
        let prevSum = 0;
        let newSum = 0;
        for (const w of visibleSizingWeights) {
          const before = prev[w.id] ?? w.weight;
          const after = proposed[w.id] ?? prev[w.id] ?? w.weight;
          prevSum += before;
          newSum += after;
          if (after < before && shrunkId == null) {
            shrunkId = w.id;
          }
        }
        // Agrandissement manuel : ne pas réallouer le surplus (bloquait la dernière colonne).
        if (newSum > prevSum || newSum >= target) {
          return proposed;
        }

        return clampSizingToContainer(proposed, target, shrunkId);
      });
    },
    [visibleSizingWeights, clampSizingToContainer, minContentWidth]
  );

  handleColumnSizingChangeRef.current = handleColumnSizingChange;

  const endColumnResizeSession = useCallback(() => {
    const listeners = resizeListenersRef.current;
    if (listeners) {
      document.removeEventListener("mousemove", listeners.move);
      document.removeEventListener("mouseup", listeners.up);
      document.removeEventListener("touchmove", listeners.move);
      document.removeEventListener("touchend", listeners.up);
      document.removeEventListener("touchcancel", listeners.up);
      resizeListenersRef.current = null;
    }
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
    const preview = resizePreviewRef.current;
    if (preview) preview.style.display = "none";
    resizeSessionRef.current = null;
  }, []);

  const updateResizePreview = useCallback((leftPx: number) => {
    const preview = resizePreviewRef.current;
    if (!preview) return;
    preview.style.display = "block";
    preview.style.left = `${leftPx}px`;
  }, []);

  const startColumnResize = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent,
      columnId: string,
      startSize: number,
      minSize: number,
      maxSize: number
    ) => {
      e.preventDefault();
      e.stopPropagation();
      endColumnResizeSession();

      const startX = pointerClientX(
        e.nativeEvent as MouseEvent | TouchEvent
      );
      const leftOffset = leftOffsetBeforeColumn(
        columnId,
        columnSizingRef.current,
        visibleSizingWeightsRef.current
      );
      resizeSessionRef.current = {
        columnId,
        startX,
        startSize,
        minSize,
        maxSize,
        leftOffset,
      };
      updateResizePreview(
        leftOffset + clampColumnWidth(startSize, minSize, maxSize)
      );
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMove = (ev: MouseEvent | TouchEvent) => {
        const session = resizeSessionRef.current;
        if (!session) return;
        if ("cancelable" in ev && ev.cancelable) ev.preventDefault();
        const delta = pointerClientX(ev) - session.startX;
        const nextSize = clampColumnWidth(
          session.startSize + delta,
          session.minSize,
          session.maxSize
        );
        updateResizePreview(session.leftOffset + nextSize);
      };

      const onUp = (ev: MouseEvent | TouchEvent) => {
        const session = resizeSessionRef.current;
        endColumnResizeSession();
        if (!session) return;
        const delta = pointerClientX(ev) - session.startX;
        const nextSize = clampColumnWidth(
          session.startSize + delta,
          session.minSize,
          session.maxSize
        );
        if (nextSize === session.startSize) return;
        userResizedRef.current = true;
        handleColumnSizingChangeRef.current((prev) => ({
          ...prev,
          [session.columnId]: nextSize,
        }));
      };

      resizeListenersRef.current = { move: onMove, up: onUp };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onUp);
      document.addEventListener("touchcancel", onUp);
    },
    [endColumnResizeSession, updateResizePreview]
  );

  useEffect(() => () => endColumnResizeSession(), [endColumnResizeSession]);

  const handleColumnVisibilityChange = useCallback(
    (updater: SetStateAction<VisibilityState>) => {
      if (onColumnVisibilityChangeProp) {
        onColumnVisibilityChangeProp(updater);
      } else {
        setInternalColumnVisibility(updater);
      }
    },
    [onColumnVisibilityChangeProp]
  );

  const handleSortingChange = useCallback(
    (updater: SetStateAction<SortingState>) => {
      if (onSortingChangeProp) {
        onSortingChangeProp(updater);
      } else {
        setInternalSorting(updater);
      }
    },
    [onSortingChangeProp]
  );

  const handleColumnFiltersChange = useCallback(
    (updater: SetStateAction<ColumnFiltersState>) => {
      if (onColumnFiltersChangeProp) {
        onColumnFiltersChangeProp(updater);
      } else {
        setInternalColumnFilters(updater);
      }
    },
    [onColumnFiltersChangeProp]
  );

  // TanStack Table returns unstable function identities — React Compiler skips this hook on purpose.
  // eslint-disable-next-line react-hooks/incompatible-library -- useReactTable
  const table = useReactTable({
    data,
    columns: sizedColumns,
    state: { sorting, columnSizing, columnFilters, columnVisibility },
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnSizingChange: handleColumnSizingChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting: true,
    enableMultiSort: false,
    /** Reset au 3e clic géré dans le header (asc → desc → aucun). */
    enableSortingRemoval: true,
    /** Évite 1er clic en desc sur dates / colonnes à sortUndefined. */
    sortDescFirst: false,
    manualSorting,
    manualFiltering,
    getRowId: (row, index) => {
      if (
        row &&
        typeof row === "object" &&
        "id" in row &&
        typeof (row as { id: unknown }).id === "string"
      ) {
        return (row as { id: string }).id;
      }
      return String(index);
    },
    enableColumnResizing: false,
    defaultColumn: {
      size: 120,
      minSize: 64,
      maxSize: 600,
      sortDescFirst: false,
    },
  });

  const { rows: tableRows } = table.getRowModel();
  const totalSize = table.getTotalSize();

  const initialLoad = loading && data.length === 0;

  const hasSearchText = globalFilter.trim() !== "";
  const hasFilters =
    hasActiveFilters || (!manualFiltering && columnFilters.length > 0);

  const isEmpty =
    !loading && tableRows.length === 0 && !hasSearchText && !hasFilters;

  const isNoMatch =
    !loading && tableRows.length === 0 && (hasSearchText || hasFilters);

  const noMatchMessage =
    hasFilters && hasSearchText
      ? searchAndFilterNoResultsMessage ?? searchNoResultsMessage
      : hasFilters
      ? filterNoResultsMessage ?? searchNoResultsMessage
      : searchNoResultsMessage;

  // Largeur visible du scroller : garde le message vide centré même quand les
  // colonnes (champs perso) rendent le tableau plus large que l'écran.
  const [viewportWidth, setViewportWidth] = useState(0);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setViewportWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const emptyRowContent = (node: ReactNode) => (
    <td colSpan={columns.length} className="border-b-0 p-0">
      <div
        className={cn(
          "sticky left-0 flex items-center justify-center px-[18px] py-12 text-center text-sm font-medium text-muted-foreground",
          emptyRowClassName
        )}
        style={viewportWidth ? { width: viewportWidth } : undefined}
      >
        {node}
      </div>
    </td>
  );

  useEffect(() => {
    if (!onLoadMore || !hasMore || loading || loadingMore) return;
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target) return;

    const maybeLoad = () => {
      const rootRect = root.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      if (targetRect.top <= rootRect.bottom + 120) {
        onLoadMoreRef.current?.();
      }
    };

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          onLoadMoreRef.current?.();
        }
      },
      { root, rootMargin: "120px", threshold: 0 }
    );
    obs.observe(target);
    // Remplit le viewport si 1ère page trop courte.
    maybeLoad();
    return () => obs.disconnect();
  }, [onLoadMore, hasMore, data.length, loading, loadingMore]);

  return (
    <section
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card",
        className
      )}
    >
      <div
        ref={scrollRef}
        className={cn(
          "min-h-0 w-full flex-1 overflow-y-auto",
          clipHorizontalOverflow ? "overflow-x-hidden" : "overflow-x-scroll"
        )}
      >
        <div
          className="relative min-w-full"
          style={{
            width: "100%",
            minWidth: Math.max(totalSize, viewportWidth),
          }}
        >
          <div
            ref={resizePreviewRef}
            aria-hidden
            className="pointer-events-none absolute top-0 z-40 w-0.5 -translate-x-1/2 bg-primary"
            style={{ height: TABLE_HEAD_ROW_PX, display: "none" }}
          />
          <table
            aria-busy={initialLoad}
            className={cn(
              "table-fixed border-separate border-spacing-0 text-[15px] leading-snug transition-opacity",
              initialLoad && "opacity-60"
            )}
            style={{
              width: "100%",
              minWidth: Math.max(totalSize, viewportWidth),
            }}
          >
          <colgroup>
            {table.getVisibleLeafColumns().map((column) => {
              // Colonnes utilitaires : largeur figée. Les autres peuvent absorber
              // le reliquat (scrollbar globale) sinon blanc à droite de la liste.
              const min = column.columnDef.minSize;
              const max = column.columnDef.maxSize;
              const isFixed =
                column.id === "select" ||
                column.id === "actions" ||
                column.id === "avatar" ||
                (min != null && max != null && min === max);
              const colMin = min ?? column.getSize();
              return (
                <col
                  key={column.id}
                  style={{
                    width: column.getSize(),
                    minWidth: colMin,
                    maxWidth: isFixed ? column.getSize() : undefined,
                  }}
                />
              );
            })}
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr>
              {table
                .getHeaderGroups()[0]
                .headers.map((header, index, headers) => {
                  const isSelectCol = header.column.id === "select";
                  const isActionsCol = header.column.id === "actions";
                  // La colonne actions sticky pose déjà un liseré à gauche : le
                  // trait de la poignée de resize ferait doublon.
                  const nextIsActions =
                    headers[index + 1]?.column.id === "actions";
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const ariaSort =
                    sorted === "asc"
                      ? "ascending"
                      : sorted === "desc"
                      ? "descending"
                      : canSort
                      ? "none"
                      : undefined;
                  return (
                    <th
                      key={header.id}
                      aria-sort={ariaSort}
                      className={cn(
                        "relative whitespace-nowrap border-b border-border bg-muted font-medium text-foreground",
                        TABLE_HEAD_ROW_CLS,
                        tableCellPaddingClass(header.column.id),
                        !isUtilityCenterColumn(header.column.id) && "text-left",
                        isUtilityCenterColumn(header.column.id) &&
                          "text-center",
                        isSelectCol &&
                          "sticky left-0 z-20 cursor-pointer shadow-[1px_0_0_0_var(--border)]",
                        isActionsCol &&
                          "sticky right-0 z-20 shadow-[-1px_0_0_0_var(--border)]",
                        canSort && "cursor-pointer"
                      )}
                      onClick={
                        isSelectCol
                          ? (e) => {
                              const box = e.currentTarget.querySelector(
                                "[data-slot=checkbox]"
                              ) as HTMLElement | null;
                              if (
                                box &&
                                e.target !== box &&
                                !box.contains(e.target as Node)
                              ) {
                                box.click();
                              }
                            }
                          : undefined
                      }
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <div className="-mx-3 flex h-full min-w-0 items-center gap-0.5 px-3">
                          <button
                            type="button"
                            className={cn(
                              "inline-flex h-full min-w-0 flex-1 cursor-pointer select-none items-center gap-1.5 text-left",
                              "hover:text-foreground focus-visible:outline-none focus-visible:ring-0"
                            )}
                            onClick={() => {
                              const columnId = header.column.id;
                              handleSortingChange((prev) => {
                                const current = prev.find(
                                  (s) => s.id === columnId
                                );
                                if (!current)
                                  return [{ id: columnId, desc: false }];
                                if (!current.desc) {
                                  return [{ id: columnId, desc: true }];
                                }
                                return [];
                              });
                            }}
                          >
                            <CellTruncate
                              as="span"
                              className={cn(
                                "min-w-0 flex-1",
                                sorted && "font-semibold"
                              )}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </CellTruncate>
                            {sorted === "asc" ? (
                              <ArrowUp
                                className="h-3.5 w-3.5 shrink-0 text-foreground"
                                aria-hidden
                              />
                            ) : sorted === "desc" ? (
                              <ArrowDown
                                className="h-3.5 w-3.5 shrink-0 text-foreground"
                                aria-hidden
                              />
                            ) : (
                              <ArrowUpDown
                                className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70"
                                aria-hidden
                              />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "min-w-0",
                            isUtilityCenterColumn(header.column.id)
                              ? "flex h-full items-center justify-center"
                              : "-mx-3 flex h-full min-w-0 items-center truncate px-3"
                          )}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </div>
                      )}
                      {columnCanManualResize(header.column.id) ? (
                        <div
                          role="separator"
                          aria-orientation="vertical"
                          aria-label="Redimensionner la colonne"
                          onMouseDown={(e) => {
                            const minSize =
                              header.column.columnDef.minSize ?? 64;
                            const maxSize =
                              header.column.columnDef.maxSize ?? 600;
                            startColumnResize(
                              e,
                              header.column.id,
                              columnSizing[header.column.id] ??
                                header.getSize(),
                              minSize,
                              maxSize
                            );
                          }}
                          onTouchStart={(e) => {
                            const minSize =
                              header.column.columnDef.minSize ?? 64;
                            const maxSize =
                              header.column.columnDef.maxSize ?? 600;
                            startColumnResize(
                              e,
                              header.column.id,
                              columnSizing[header.column.id] ??
                                header.getSize(),
                              minSize,
                              maxSize
                            );
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            const w = sizingWeights.find(
                              (x) => x.id === header.column.id
                            );
                            if (!w) return;
                            userResizedRef.current = true;
                            handleColumnSizingChange((prev) => ({
                              ...prev,
                              [header.column.id]: w.weight,
                            }));
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "absolute top-0 right-0 z-30 h-full w-1.5 cursor-col-resize touch-none select-none",
                            "after:absolute after:inset-y-2 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-muted-foreground/45",
                            "hover:after:bg-primary active:after:bg-primary",
                            nextIsActions &&
                              "after:bg-transparent hover:after:bg-primary"
                          )}
                        />
                      ) : null}
                    </th>
                  );
                })}
            </tr>
          </thead>
          <tbody>
            {isEmpty && <tr>{emptyRowContent(emptyMessage)}</tr>}
            {isNoMatch && <tr>{emptyRowContent(noMatchMessage)}</tr>}
            {!isEmpty &&
              !isNoMatch &&
              tableRows.map((row: Row<T>) => (
                <tr
                  key={row.id}
                  className={cn(
                    "group",
                    onRowClick && "cursor-pointer hover:bg-accent/60"
                  )}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? "button" : undefined}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(row.original);
                          }
                        }
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => {
                    const isSelectCol = cell.column.id === "select";
                    const isActionsCol = cell.column.id === "actions";
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          "min-w-0 overflow-hidden border-b border-border/60 bg-card py-1.5 align-middle font-normal text-foreground group-hover:bg-accent/60",
                          tableCellPaddingClass(cell.column.id),
                          isUtilityCenterColumn(cell.column.id) &&
                            "text-center",
                          isSelectCol &&
                            "sticky left-0 z-[1] cursor-pointer shadow-[1px_0_0_0_var(--border)]",
                          isActionsCol &&
                            "sticky right-0 z-[1] shadow-[-1px_0_0_0_var(--border)]"
                        )}
                        onClick={
                          isSelectCol
                            ? (e) => {
                                e.stopPropagation();
                                const box = e.currentTarget.querySelector(
                                  "[data-slot=checkbox]"
                                ) as HTMLElement | null;
                                if (
                                  box &&
                                  e.target !== box &&
                                  !box.contains(e.target as Node)
                                ) {
                                  box.click();
                                }
                              }
                            : isActionsCol
                            ? (e) => e.stopPropagation()
                            : undefined
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
        </div>
        {onLoadMore && hasMore ? (
          <div
            ref={sentinelRef}
            className="flex h-10 items-center justify-center text-xs text-muted-foreground"
            aria-hidden
          >
            {loadingMore ? (
              <LoadingLabel className="text-xs" spinnerClassName="size-3.5">
                Chargement…
              </LoadingLabel>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="flex min-h-9 shrink-0 items-center gap-2 border-t border-border px-3.5 py-1 text-sm font-medium text-muted-foreground">
        <span className="min-w-0">
          {initialLoad
            ? loadingMessage
            : footer ?? `${data.length} élément${data.length > 1 ? "s" : ""}`}
        </span>
      </div>
    </section>
  );
}
