"use client";

import { CellTruncate } from "@/components/smsclient/ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/smsclient/DataTable";
import { GROUP_COL } from "@/components/smsclient/listColumnSizes";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useI18n, type MessageKey } from "@/lib/i18n";
import type { GroupRowData } from "@/lib/types/group";
import { compareIsoTimestamps } from "@/lib/proto/compareIso";
import { useCallback, useMemo, useState } from "react";
import { MoreHorizontal, Plus, Search, Send, Trash2, Users } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

type TFn = (
  key: MessageKey,
  vars?: Record<string, string | number>,
) => string;

function buildGroupColumns(t: TFn): ColumnDef<GroupRowData, unknown>[] {
  return [
    {
      accessorKey: "name",
      header: t("groups.col.name"),
      size: GROUP_COL.name,
      cell: ({ getValue }) => (
        <CellTruncate as="div">{getValue<string>()}</CellTruncate>
      ),
    },
    {
      accessorKey: "description",
      header: t("groups.col.description"),
      size: GROUP_COL.description,
      cell: ({ getValue }) => (
        <CellTruncate as="div">{getValue<string>().trim() || "—"}</CellTruncate>
      ),
    },
    {
      accessorKey: "contactCount",
      header: t("groups.col.contacts"),
      size: GROUP_COL.contactCount,
    },
    {
      accessorKey: "lastCampaignLabel",
      header: t("groups.col.lastCampaign"),
      size: GROUP_COL.lastCampaign,
      sortingFn: (a, b) =>
        compareIsoTimestamps(
          a.original.lastCampaignAt,
          b.original.lastCampaignAt,
        ),
      cell: ({ getValue }) => (
        <CellTruncate as="div">{getValue<string>()}</CellTruncate>
      ),
    },
    {
      accessorKey: "createdLabel",
      header: t("groups.col.created"),
      size: GROUP_COL.created,
      sortingFn: (a, b) =>
        compareIsoTimestamps(a.original.createdAt, b.original.createdAt),
      cell: ({ getValue }) => (
        <CellTruncate as="div">{getValue<string>()}</CellTruncate>
      ),
    },
  ];
}

type GroupesProps = {
  rows: GroupRowData[];
  loading: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  totalCount?: number | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  error: string | null;
  onCreateGroup: () => void;
  onEditGroup: (row: GroupRowData) => void;
  onDeleteGroups: (ids: string[]) => void;
  onCreateCampaignFromGroups: (ids: string[]) => void;
};

export function GroupesView({
  rows,
  loading,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  totalCount = null,
  searchQuery,
  onSearchChange,
  error,
  onCreateGroup,
  onEditGroup,
  onDeleteGroups,
  onCreateCampaignFromGroups,
}: GroupesProps) {
  const { t } = useI18n();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const hasSelection = selectedIds.size > 0;
  const showBigEmpty =
    !loading && !error && rows.length === 0 && searchQuery.trim() === "";

  const footerN = typeof totalCount === "number" ? totalCount : rows.length;
  const footerLabel = useMemo(
    () =>
      t(footerN === 1 ? "groups.footerOne" : "groups.footerMany", {
        n: footerN,
      }),
    [footerN, t],
  );

  const dataColumns = useMemo(() => buildGroupColumns(t), [t]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === rows.length) return new Set();
      return new Set(rows.map((r) => r.id));
    });
  }, [rows]);

  const selectColumns: ColumnDef<GroupRowData, unknown>[] = useMemo(
    () => [
      {
        id: "select",
        size: GROUP_COL.select,
        minSize: GROUP_COL.select,
        maxSize: GROUP_COL.select,
        enableResizing: false,
        header: () => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                selectedIds.size > 0 && selectedIds.size === rows.length
                  ? true
                  : selectedIds.size > 0
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={() => toggleAll()}
              aria-label={t("groups.selectAllAria")}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={selectedIds.has(row.original.id)}
              onCheckedChange={() => toggleSelect(row.original.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={t("groups.selectOneAria", {
                name: row.original.name,
              })}
            />
          </div>
        ),
      },
      ...dataColumns,
      {
        id: "actions",
        size: GROUP_COL.actions,
        minSize: GROUP_COL.actions,
        maxSize: GROUP_COL.actions,
        enableResizing: false,
        header: () => null,
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 rounded-full text-muted-foreground"
                  aria-label={t("groups.actionsAria", {
                    name: row.original.name,
                  })}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => onEditGroup(row.original)}>
                  {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onDeleteGroups([row.original.id])}
                >
                  {t("common.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [
      selectedIds,
      rows.length,
      toggleAll,
      toggleSelect,
      onEditGroup,
      onDeleteGroups,
      dataColumns,
      t,
    ],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <InputGroup
          className="max-w-sm bg-transparent dark:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0"
          role="search"
        >
          <InputGroupAddon align="inline-start">
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={t("groups.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={t("groups.searchAria")}
          />
        </InputGroup>
        <div className="flex flex-wrap items-center gap-2">
          {hasSelection ? (
            <>
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full"
                onClick={() => {
                  onDeleteGroups(Array.from(selectedIds));
                  setSelectedIds(new Set());
                }}
              >
                <Trash2 aria-hidden />
                {t("groups.deleteSelected", { n: selectedIds.size })}
              </Button>
              <Button
                variant="default"
                size="lg"
                className="rounded-full"
                onClick={() => {
                  onCreateCampaignFromGroups(Array.from(selectedIds));
                  setSelectedIds(new Set());
                }}
              >
                <Send aria-hidden />
                {t("groups.createCampaign")}
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="lg"
              className="rounded-full"
              onClick={onCreateGroup}
            >
              <Plus aria-hidden />
              {t("groups.create")}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
          {error}
        </div>
      )}

      {showBigEmpty ? (
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <Users
              className="h-14 w-14 text-slate-400"
              strokeWidth={1.25}
              aria-hidden
            />
            <p className="m-0 max-w-[360px] text-lg font-extrabold text-slate-800">
              {t("groups.emptyTitle")}
            </p>
            <p className="m-0 max-w-[400px] text-sm font-semibold leading-relaxed text-slate-500">
              {t("groups.emptyBody")}
            </p>
          </div>
        </section>
      ) : (
        <DataTable
          columns={selectColumns}
          data={rows}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          globalFilter={searchQuery}
          emptyMessage={t("groups.emptyTable")}
          searchNoResultsMessage={t("groups.noSearchResults")}
          onRowClick={onEditGroup}
          footer={footerLabel}
        />
      )}
    </div>
  );
}
