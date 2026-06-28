"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import { cn } from "@/lib/cn";
import { Pager } from "./views/Pager";
import type { ReactNode } from "react";

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
  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const { rows: tableRows } = table.getRowModel();
  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;

  const isEmpty = !loading && data.length === 0;
  const isSearchEmpty = !loading && data.length > 0 && tableRows.length === 0 && globalFilter.trim() !== "";

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto",
          clipHorizontalOverflow ? "overflow-x-hidden" : "overflow-auto",
        )}
      >
        <table
          className={cn(
            "w-full border-separate border-spacing-0 text-[15px]",
            clipHorizontalOverflow && "table-fixed",
          )}
        >
          <thead className="sticky top-0 z-10">
            <tr>
              {table.getHeaderGroups()[0].headers.map((header) => {
                const isSelectCol = header.column.id === "select";
                return (
                  <th
                    key={header.id}
                    className={cn(
                      "whitespace-nowrap border-b border-slate-200 bg-slate-50 py-3.5 text-sm font-extrabold text-slate-900",
                      isSelectCol ? "w-10 px-3 text-center" : "px-[18px] text-left",
                    )}
                    style={header.column.getSize() !== 150 ? { width: `${header.column.getSize()}px` } : undefined}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                  className="border-b border-slate-100 px-[18px] py-12 text-center text-sm font-semibold text-slate-500"
                >
                  {loadingMessage}
                </td>
              </tr>
            )}
            {isEmpty && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="border-b border-slate-100 px-[18px] py-12 text-center text-sm font-bold text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
            {isSearchEmpty && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="border-b border-slate-100 px-[18px] py-12 text-center text-sm font-bold text-slate-500"
                >
                  {searchNoResultsMessage}
                </td>
              </tr>
            )}
            {!loading && !isEmpty && !isSearchEmpty &&
              tableRows.map((row: Row<T>) => (
                <tr
                  key={row.id}
                  className={cn(
                    onRowClick && "cursor-pointer hover:bg-indigo-50/60",
                  )}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? "button" : undefined}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
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
                          "min-w-0 border-b border-slate-100 py-3.5 align-middle text-slate-900",
                          isSelectCol ? "w-10 px-3 text-center" : "px-[18px]",
                        )}
                        onClick={
                          isSelectCol
                            ? (e) => {
                                e.stopPropagation();
                                const input = e.currentTarget.querySelector("input[type=checkbox]") as HTMLInputElement | null;
                                if (input) input.click();
                              }
                            : undefined
                        }
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-3.5 py-3 text-sm font-semibold text-slate-600">
        <span>
          {loading
            ? "…"
            : footer ?? `${table.getFilteredRowModel().rows.length} élément${table.getFilteredRowModel().rows.length > 1 ? "s" : ""}`}
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
