"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnSizingState,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
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
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
  emptyRowClassName?: string;
};

const NO_SORT_IDS = new Set(["select", "actions", "avatar"]);

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
    const noResize = id === "select" || id === "actions";
    const noSort = id != null && NO_SORT_IDS.has(id);
    return {
      ...col,
      enableResizing: noResize ? false : (col.enableResizing ?? true),
      enableSorting: noSort ? false : (col.enableSorting ?? true),
      minSize: col.minSize ?? (noResize ? 36 : 64),
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
  onRowClick,
  footer,
  clipHorizontalOverflow = false,
  minContentWidth,
  sorting: sortingProp,
  onSortingChange: onSortingChangeProp,
  manualSorting = false,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  className,
  emptyRowClassName,
}: DataTableProps<T>) {
  void _pageSize;
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const sorting = sortingProp ?? internalSorting;
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const userResizedRef = useRef(false);
  const fillKeyRef = useRef("");
  const lastAvailRef = useRef(0);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  const sizedColumns = useMemo(
    () => withColumnDefaults(columns),
    [columns]
  );

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

  /** Somme des largeurs ≥ clientWidth — sinon blanc + pas de scroll. */
  const clampSizingToContainer = useCallback(
    (
      sizing: ColumnSizingState,
      avail: number,
      preferGrowId?: string
    ): ColumnSizingState => {
      if (avail <= 0 || sizingWeights.length === 0) return sizing;

      let sum = 0;
      const resolved: ColumnSizingState = {};
      for (const w of sizingWeights) {
        const size = sizing[w.id] ?? w.weight;
        resolved[w.id] = size;
        sum += size;
      }
      if (sum >= avail) return sizing;

      const deficit = avail - sum;
      const growId =
        preferGrowId && resolved[preferGrowId] != null
          ? preferGrowId
          : [...sizingWeights]
              .reverse()
              .find((w) => w.id !== "select" && w.id !== "actions")?.id ??
            sizingWeights[sizingWeights.length - 1]!.id;

      return {
        ...resolved,
        [growId]: (resolved[growId] ?? 0) + deficit,
      };
    },
    [sizingWeights]
  );

  const applyContainerFill = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const avail = el.clientWidth;
    if (avail <= 0) return;
    const target = Math.max(avail, minContentWidth ?? 0);
    const colsKey = sizingWeights
      .map((w) => `${w.id}:${w.weight}:${w.minSize}:${w.maxSize}`)
      .join(",");
    if (!userResizedRef.current) {
      const prevAvail = lastAvailRef.current;
      // Ignore ~scrollbar gutter flicker when lazyload adds rows.
      if (
        fillKeyRef.current === colsKey &&
        prevAvail > 0 &&
        Math.abs(avail - prevAvail) <= 20
      ) {
        return;
      }
      lastAvailRef.current = avail;
      fillKeyRef.current = colsKey;
      setColumnSizing(distributeColumnWidths(sizingWeights, target));
      return;
    }
    const prevAvail = lastAvailRef.current;
    if (prevAvail > 0 && Math.abs(avail - prevAvail) <= 20) {
      return;
    }
    lastAvailRef.current = avail;
    setColumnSizing((prev) => clampSizingToContainer(prev, target));
  }, [sizingWeights, clampSizingToContainer, minContentWidth]);

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
        const proposed =
          typeof updater === "function" ? updater(prev) : updater;
        const avail = scrollRef.current?.clientWidth ?? 0;
        if (avail <= 0) return proposed;
        const target = Math.max(avail, minContentWidth ?? 0);

        let shrunkId: string | undefined;
        for (const w of sizingWeights) {
          const before = prev[w.id] ?? w.weight;
          const after = proposed[w.id] ?? prev[w.id] ?? w.weight;
          if (after < before) {
            shrunkId = w.id;
            break;
          }
        }

        return clampSizingToContainer(proposed, target, shrunkId);
      });
    },
    [sizingWeights, clampSizingToContainer, minContentWidth]
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

  // TanStack Table returns unstable function identities — React Compiler skips this hook on purpose.
  // eslint-disable-next-line react-hooks/incompatible-library -- useReactTable
  const table = useReactTable({
    data,
    columns: sizedColumns,
    state: { sorting, columnSizing },
    onSortingChange: handleSortingChange,
    onColumnSizingChange: handleColumnSizingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting: true,
    enableMultiSort: false,
    /** Sinon 3e clic (ou clic rapide multi-detail) vide le tri → paraît « cassé ». */
    enableSortingRemoval: false,
    /** Évite 1er clic en desc sur dates / colonnes à sortUndefined. */
    sortDescFirst: false,
    manualSorting,
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
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    defaultColumn: {
      size: 120,
      minSize: 64,
      maxSize: 600,
      sortDescFirst: false,
    },
  });

  const { rows: tableRows } = table.getRowModel();
  const totalSize = table.getTotalSize();

  const isEmpty = !loading && data.length === 0 && globalFilter.trim() === "";
  const isSearchEmpty =
    !loading &&
    data.length === 0 &&
    globalFilter.trim() !== "";

  // Largeur visible du scroller : garde le message vide centré même quand les
  // colonnes (champs perso) rendent le tableau plus large que l'écran.
  const [viewportWidth, setViewportWidth] = useState(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setViewportWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const emptyRowContent = (node: ReactNode) => (
    <td colSpan={columns.length} className="border-b border-border/60 p-0">
      <div
        className={cn(
          "sticky left-0 flex items-center justify-center px-[18px] py-12 text-center text-sm font-medium text-muted-foreground",
          emptyRowClassName,
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
      { root, rootMargin: "120px", threshold: 0 },
    );
    obs.observe(target);
    // Remplit le viewport si 1ère page trop courte.
    maybeLoad();
    return () => obs.disconnect();
  }, [onLoadMore, hasMore, data.length, loading, loadingMore]);

  return (
    <section className={cn("flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm", className)}>
      <div
        ref={scrollRef}
        className={cn(
          "min-h-0 w-full flex-1 overflow-y-auto [scrollbar-gutter:stable]",
          clipHorizontalOverflow ? "overflow-x-hidden" : "overflow-x-auto"
        )}
      >
        {loading ? (
          <div
            className="flex min-h-[240px] w-full flex-1 items-center justify-center px-[18px] py-12 text-sm font-medium text-muted-foreground"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <LoadingLabel>{loadingMessage}</LoadingLabel>
          </div>
        ) : null}
        {!loading ? (
        <table
          className="table-fixed border-separate border-spacing-0 text-sm"
          style={{
            width: totalSize,
            minWidth: totalSize,
          }}
        >
          <colgroup>
            {table.getVisibleLeafColumns().map((column) => (
              <col
                key={column.id}
                style={{
                  width: column.getSize(),
                  minWidth: column.getSize(),
                  maxWidth: column.getSize(),
                }}
              />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr>
              {table.getHeaderGroups()[0].headers.map((header) => {
                const isSelectCol = header.column.id === "select";
                const isActionsCol = header.column.id === "actions";
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
                      "relative whitespace-nowrap border-b border-border bg-muted py-2 text-xs font-medium text-foreground",
                      isSelectCol || isActionsCol
                        ? "px-2 text-center"
                        : "px-3 text-left",
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
                              "[data-slot=checkbox]",
                            ) as HTMLElement | null;
                            if (box && e.target !== box && !box.contains(e.target as Node)) {
                              box.click();
                            }
                          }
                        : undefined
                    }
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        className={cn(
                          "-mx-3 -my-2 inline-flex w-[calc(100%+1.5rem)] min-w-0 cursor-pointer select-none items-center gap-1.5 px-3 py-2 text-left",
                          "hover:text-foreground focus-visible:outline-none focus-visible:ring-0"
                        )}
                        onClick={() => {
                          const columnId = header.column.id;
                          // Toggle explicite : nouvelle colonne → asc ; déjà active → inverse.
                          handleSortingChange((prev) => {
                            const current = prev.find((s) => s.id === columnId);
                            if (!current) return [{ id: columnId, desc: false }];
                            return [{ id: columnId, desc: !current.desc }];
                          });
                        }}
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
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
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                    {header.column.getCanResize() ? (
                      <div
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Redimensionner la colonne"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          header.getResizeHandler()(e);
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          header.getResizeHandler()(e);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          header.column.resetSize();
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          "absolute top-0 right-0 z-30 h-full w-1.5 cursor-col-resize touch-none select-none",
                          "after:absolute after:inset-y-2 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-muted-foreground/45",
                          "hover:after:bg-primary",
                          header.column.getIsResizing() && "after:bg-primary"
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
            {isSearchEmpty && <tr>{emptyRowContent(searchNoResultsMessage)}</tr>}
            {!isEmpty &&
              !isSearchEmpty &&
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
                          isSelectCol || isActionsCol
                            ? "px-2 text-center"
                            : "px-3",
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
                                  "[data-slot=checkbox]",
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
        ) : null}
        {!loading && onLoadMore && hasMore ? (
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
          {loading
            ? "…"
            : footer ??
              `${data.length} élément${data.length > 1 ? "s" : ""}`}
        </span>
      </div>
    </section>
  );
}
