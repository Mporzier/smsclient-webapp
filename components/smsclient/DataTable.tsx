"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Pager } from "./views/Pager";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

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
      minSize: col.minSize ?? (noResize ? 40 : 80),
      maxSize: col.maxSize ?? 800,
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

  const sizedColumns = useMemo(
    () => withColumnDefaults(columns),
    [columns]
  );

  const table = useReactTable({
    data,
    columns: sizedColumns,
    state: { globalFilter, sorting },
    onSortingChange: setSorting,
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
      size: 160,
      minSize: 80,
      maxSize: 800,
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
        className={cn(
          "min-h-0 w-full flex-1 overflow-y-auto",
          clipHorizontalOverflow ? "overflow-x-hidden" : "overflow-x-auto"
        )}
      >
        <table
          className="w-full table-fixed border-separate border-spacing-0 text-[15px]"
          style={{
            width: "100%",
            minWidth: totalSize,
          }}
        >
          <colgroup>
            {table.getVisibleLeafColumns().map((column) => (
              <col
                key={column.id}
                style={{ width: column.getSize(), minWidth: column.getSize() }}
              />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr>
              {table.getHeaderGroups()[0].headers.map((header) => {
                const isSelectCol = header.column.id === "select";
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
                      "relative whitespace-nowrap border-b border-border bg-muted py-3.5 text-sm font-medium text-foreground",
                      isSelectCol
                        ? "px-3 text-center"
                        : "px-[18px] text-left"
                    )}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        className={cn(
                          "inline-flex max-w-full items-center gap-1.5 rounded-md text-left",
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
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          "min-w-0 overflow-hidden border-b border-border/60 py-3.5 align-middle font-normal text-foreground",
                          isSelectCol ? "px-3 text-center" : "px-[18px]"
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
