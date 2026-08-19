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
import { SelectAllExpandBanner } from "@/components/smsclient/SelectAllExpandBanner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useGmailSelectAll } from "@/hooks/useGmailSelectAll";
import { cn } from "@/lib/cn";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { groupColor } from "@/lib/proto/contactDisplay";
import type { GroupRowData } from "@/lib/types/group";
import { useCallback, useMemo, useState } from "react";
import {
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import type {
  ColumnDef,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table";

type TFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

function buildGroupColumns(t: TFn): ColumnDef<GroupRowData, unknown>[] {
  return [
    {
      id: "avatar",
      size: GROUP_COL.avatar,
      minSize: GROUP_COL.avatar,
      maxSize: GROUP_COL.avatar,
      header: "",
      cell: ({ row }) => {
        const c = groupColor(row.original.name);
        return (
          <div
            className={cn(
              "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-medium",
              c.bg,
              c.border,
              c.text
            )}
          >
            <Users className="h-3.5 w-3.5" aria-hidden />
          </div>
        );
      },
    },
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
      cell: ({ getValue }) => (
        <CellTruncate as="div">{getValue<string>()}</CellTruncate>
      ),
    },
    {
      accessorKey: "createdLabel",
      header: t("groups.col.created"),
      size: GROUP_COL.created,
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
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  error: string | null;
  onCreateGroup: () => void;
  onEditGroup: (row: GroupRowData) => void;
  onDeleteGroups: (ids: string[]) => void;
  onCreateCampaignFromGroups: (ids: string[]) => void;
  onCountSelectableMatches?: (
    search: string
  ) => Promise<{ count: number; error: Error | null }>;
  onFetchSelectableMatchIds?: (
    search: string
  ) => Promise<{ data: string[]; error: Error | null }>;
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
  sorting,
  onSortingChange,
  error,
  onCreateGroup,
  onEditGroup,
  onDeleteGroups,
  onCreateCampaignFromGroups,
  onCountSelectableMatches,
  onFetchSelectableMatchIds,
}: GroupesProps) {
  const { t } = useI18n();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadedIds = useMemo(() => rows.map((r) => r.id), [rows]);

  const setSelectedIdsList = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const countMatch = useCallback(async () => {
    if (!onCountSelectableMatches)
      return { count: loadedIds.length, error: null };
    return onCountSelectableMatches(searchQuery);
  }, [onCountSelectableMatches, searchQuery, loadedIds.length]);

  const fetchAllIds = useCallback(async () => {
    if (!onFetchSelectableMatchIds) {
      return { data: loadedIds, error: null };
    }
    return onFetchSelectableMatchIds(searchQuery);
  }, [onFetchSelectableMatchIds, searchQuery, loadedIds]);

  const {
    selectLoaded,
    clearSelection,
    showExpandBanner,
    matchTotal,
    displaySelectedCount,
    counting,
    expanding,
    expandError,
    expandToMatchAll,
    ensureSelectionReady,
  } = useGmailSelectAll({
    search: searchQuery,
    loadedIds,
    selectedIds,
    setSelectedIds: setSelectedIdsList,
    countMatch,
    fetchAllIds,
    expandCandidate:
      hasMore ||
      (typeof totalCount === "number" && totalCount > loadedIds.length),
  });

  const hasSelection = displaySelectedCount > 0;

  const emptyState = (
    <Empty className="p-0 md:p-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Users aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t("groups.emptyTitle")}</EmptyTitle>
        <EmptyDescription>{t("groups.emptyBody")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="default"
          className="rounded-full"
          onClick={onCreateGroup}
        >
          <Plus aria-hidden />
          {t("groups.create")}
        </Button>
      </EmptyContent>
    </Empty>
  );

  const allLoadedSelected =
    rows.length > 0 && rows.every((r) => selectedIds.has(r.id));

  const footerN = typeof totalCount === "number" ? totalCount : rows.length;
  const footerLabel = useMemo(
    () =>
      t(footerN === 1 ? "groups.footerOne" : "groups.footerMany", {
        n: footerN,
      }),
    [footerN, t]
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
    if (allLoadedSelected) {
      clearSelection();
      return;
    }
    selectLoaded();
  }, [allLoadedSelected, clearSelection, selectLoaded]);

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
                allLoadedSelected
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
      allLoadedSelected,
      toggleAll,
      toggleSelect,
      onEditGroup,
      onDeleteGroups,
      dataColumns,
      t,
    ]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-center gap-3">
        <InputGroup
          className="max-w-sm shrink-0 bg-transparent dark:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0"
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
        {showExpandBanner ? (
          <SelectAllExpandBanner
            matchTotal={matchTotal}
            hasSearch={searchQuery.trim().length > 0}
            entityLabel="groupes"
            counting={counting}
            expanding={expanding}
            error={expandError}
            onExpand={() => void expandToMatchAll()}
          />
        ) : (
          <div className="min-w-0 flex-1" aria-hidden />
        )}
        <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
          {hasSelection ? (
            <>
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full"
                onClick={() => {
                  void (async () => {
                    const ids = await ensureSelectionReady();
                    onDeleteGroups(ids);
                    clearSelection();
                  })();
                }}
              >
                <Trash2 aria-hidden />
                {t("groups.deleteSelected", { n: displaySelectedCount })}
              </Button>
              <Button
                variant="default"
                size="lg"
                className="rounded-full"
                onClick={() => {
                  void (async () => {
                    const ids = await ensureSelectionReady();
                    onCreateCampaignFromGroups(ids);
                    clearSelection();
                  })();
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

      {expandError && !showExpandBanner ? (
        <p className="m-0 text-xs font-semibold text-destructive">
          {expandError}
        </p>
      ) : null}

      <DataTable
        columns={selectColumns}
        data={rows}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        globalFilter={searchQuery}
        loadingMessage={t("groups.loading")}
        emptyMessage={emptyState}
        searchNoResultsMessage={t("groups.noSearchResults")}
        onRowClick={onEditGroup}
        footer={footerLabel}
        sorting={sorting}
        onSortingChange={onSortingChange}
        manualSorting
      />
    </div>
  );
}
