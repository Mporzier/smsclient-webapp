"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnSizingState,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import { distributeColumnWidths } from "@/components/smsclient/listColumnSizes";
import { cn } from "@/lib/utils";
import { Pager } from "./views/Pager";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  useCallback,
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
  pageSize?: number;
  globalFilter?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  searchNoResultsMessage?: string;
  onRowClick?: (row: T) => void;
  footer?: ReactNode;
  /** Tronque le contenu au lieu de faire défiler horizontalement. */
  clipHorizontalOverflow?: boolean;
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
      /** Plafond haut pour autoriser agrandissement après le fill % initial. */
      maxSize: col.maxSize ?? 2400,
    };
  });
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  pageSize = 20,
  globalFilter = "",
  emptyMessage = "Aucun élément.",
  loadingMessage = "Chargement…",
  searchNoResultsMessage = "Aucun résultat pour cette recherche.",
  onRowClick,
  footer,
  clipHorizontalOverflow = false,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const userResizedRef = useRef(false);

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
          maxSize: col.maxSize ?? 2400,
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
    if (!userResizedRef.current) {
      setColumnSizing(distributeColumnWidths(sizingWeights, avail));
      return;
    }
    setColumnSizing((prev) => clampSizingToContainer(prev, avail));
  }, [sizingWeights, clampSizingToContainer]);

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

        let shrunkId: string | undefined;
        for (const w of sizingWeights) {
          const before = prev[w.id] ?? w.weight;
          const after = proposed[w.id] ?? prev[w.id] ?? w.weight;
          if (after < before) {
            shrunkId = w.id;
            break;
          }
        }

        return clampSizingToContainer(proposed, avail, shrunkId);
      });
    },
    [sizingWeights, clampSizingToContainer]
  );

  const table = useReactTable({
    data,
    columns: sizedColumns,
    state: { globalFilter, sorting, columnSizing },
    onSortingChange: setSorting,
    onColumnSizingChange: handleColumnSizingChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSorting: true,
    enableMultiSort: false,
    enableSortingRemoval: true,
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    defaultColumn: {
      size: 120,
      minSize: 64,
      maxSize: 2400,
    },
    initialState: { pagination: { pageSize } },
  });

  const { rows: tableRows } = table.getRowModel();
  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;
  const totalSize = table.getTotalSize();

  const isEmpty = !loading && data.length === 0;
  const isSearchEmpty =
    !loading &&
    data.length > 0 &&
    tableRows.length === 0 &&
    globalFilter.trim() !== "";

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div
        ref={scrollRef}
        className={cn(
          "min-h-0 w-full flex-1 overflow-y-auto",
          clipHorizontalOverflow ? "overflow-x-hidden" : "overflow-x-auto"
        )}
      >
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
                        "sticky left-0 z-20 shadow-[1px_0_0_0_var(--border)]",
                      isActionsCol &&
                        "sticky right-0 z-20 shadow-[-1px_0_0_0_var(--border)]",
                      canSort && "cursor-pointer"
                    )}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        className={cn(
                          "inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-md text-left",
                          "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span className="min-w-0 truncate">
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
                          "absolute top-0 right-0 z-30 h-full w-3 translate-x-1/2 cursor-col-resize touch-none select-none",
                          "after:absolute after:inset-y-2 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-border",
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
            {loading && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="border-b border-border/60 px-[18px] py-12 text-center text-sm font-medium text-muted-foreground"
                >
                  {loadingMessage}
                </td>
              </tr>
            )}
            {isEmpty && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="border-b border-border/60 px-[18px] py-12 text-center text-sm font-medium text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
            {isSearchEmpty && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="border-b border-border/60 px-[18px] py-12 text-center text-sm font-medium text-muted-foreground"
                >
                  {searchNoResultsMessage}
                </td>
              </tr>
            )}
            {!loading &&
              !isEmpty &&
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
                            "sticky left-0 z-[1] shadow-[1px_0_0_0_var(--border)]",
                          isActionsCol &&
                            "sticky right-0 z-[1] shadow-[-1px_0_0_0_var(--border)]"
                        )}
                        onClick={
                          isSelectCol
                            ? (e) => {
                                e.stopPropagation();
                                const input = e.currentTarget.querySelector(
                                  "input[type=checkbox]"
                                ) as HTMLInputElement | null;
                                if (input) input.click();
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
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border px-3.5 py-3 text-sm font-medium text-muted-foreground">
        <span>
          {loading
            ? "…"
            : footer ??
              `${table.getFilteredRowModel().rows.length} élément${
                table.getFilteredRowModel().rows.length > 1 ? "s" : ""
              }`}
        </span>
        {pageCount > 1 && (
          <Pager
            page={pageIndex}
            totalPages={pageCount}
            onPageChange={(p) => table.setPageIndex(p)}
          />
        )}
      </div>
    </section>
  );
}
