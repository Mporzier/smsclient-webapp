"use client";

import { ConfirmLinkDeleteModal } from "@/components/smsclient/modals/ConfirmLinkDeleteModal";
import { CreateSmsLinkModal } from "@/components/smsclient/modals/CreateSmsLinkModal";
import { CopyableLinkField } from "@/components/smsclient/CopyableLinkField";
import { CellTruncate, copyTextToClipboard } from "@/components/smsclient/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  ListEmptyIntroBanner,
  shouldShowListEmptyIntro,
} from "@/components/smsclient/ListEmptyIntroBanner";
import { useShellHelpActions } from "@/components/smsclient/shell/ShellHeaderTitleContext";
import {
  LIST_VIEW_SEARCH_INPUT_CLASS,
  LIST_VIEW_STACK_CLASS,
  LIST_VIEW_TOOLBAR_BUTTON_SIZE,
  LIST_VIEW_TOOLBAR_CLASS,
} from "@/components/smsclient/listViewLayout";
import { DataTable } from "@/components/smsclient/DataTable";
import { DataTableColumnFilter } from "@/components/smsclient/DataTableColumnFilter";
import { ListFilterChips } from "@/components/smsclient/ListFilterChips";
import { LINK_COL, listColFixed } from "@/components/smsclient/listColumnSizes";
import { listFiltersKey, normalizeListFilters } from "@/lib/proto/listFilters";
import { linkColumnFilterKind } from "@/lib/proto/listFilterUi";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useI18n } from "@/lib/i18n";
import { SmsLinkIconTile } from "@/components/smsclient/SmsLinkIconTile";
import type { SmsLinkIconId } from "@/lib/proto/smsLinkIcons";
import { linkUrlDisplayLabel } from "@/lib/proto/shortLinks";
import {
  countMatchingSmsLinks,
  createSmsShortLink,
  deleteSmsLinks,
  fetchMatchingSmsLinkIds,
} from "@/lib/supabase/links";
import type { LinkRowData } from "@/lib/types/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Copy,
  ExternalLink,
  Link2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { SelectAllExpandBanner } from "@/components/smsclient/SelectAllExpandBanner";
import { useGmailSelectAll } from "@/hooks/useGmailSelectAll";
import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table";

type LiensViewProps = {
  rows: LinkRowData[];
  loading: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  totalCount?: number | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  error: string | null;
  supabase: SupabaseClient;
  userId: string | undefined;
  onRefresh: () => Promise<void>;
};

export function LiensView({
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
  columnFilters,
  onColumnFiltersChange: setColumnFilters,
  error,
  supabase,
  userId,
  onRefresh,
}: LiensViewProps) {
  const { t } = useI18n();
  const { openHelp } = useShellHelpActions();
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    ids: string[];
    shortUrl?: string;
    originalUrl?: string;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [listIntroDismissed, setListIntroDismissed] = useState(false);

  const filterLabels = useMemo(
    () => ({
      createdLabel: t("links.col.created"),
      label: t("links.col.label"),
      description: t("links.col.description"),
      originalUrl: t("links.col.originalUrl"),
      clickCount: t("links.col.clicks"),
    }),
    [t]
  );

  const selectAllScopeKey = useMemo(
    () => `${searchQuery}::${listFiltersKey(columnFilters)}`,
    [searchQuery, columnFilters]
  );

  const hasActiveFilters = normalizeListFilters(columnFilters).length > 0;

  const loadedIds = useMemo(() => rows.map((r) => r.id), [rows]);

  const setSelectedIdsList = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const countMatch = useCallback(async () => {
    if (!userId) return { count: loadedIds.length, error: null };
    return countMatchingSmsLinks(supabase, userId, {
      search: searchQuery,
      filters: columnFilters,
    });
  }, [userId, supabase, searchQuery, columnFilters, loadedIds.length]);

  const fetchAllIds = useCallback(async () => {
    if (!userId) {
      return { data: loadedIds, error: null };
    }
    return fetchMatchingSmsLinkIds(supabase, userId, {
      search: searchQuery,
      filters: columnFilters,
    });
  }, [userId, supabase, searchQuery, columnFilters, loadedIds]);

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
    search: selectAllScopeKey,
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

  const renderColumnFilter = useCallback(
    (columnId: string) => {
      const kind = linkColumnFilterKind(columnId);
      if (!kind) return null;
      return (
        <DataTableColumnFilter
          columnId={columnId}
          columnLabel={
            filterLabels[columnId as keyof typeof filterLabels] ?? columnId
          }
          kind={kind}
          columnFilters={columnFilters}
          onColumnFiltersChange={(next) => {
            clearSelection();
            setColumnFilters(next);
          }}
        />
      );
    },
    [clearSelection, columnFilters, filterLabels, setColumnFilters]
  );

  const showListIntro = shouldShowListEmptyIntro({
    loading,
    dataLength: rows.length,
    searchQuery,
    dismissed: listIntroDismissed,
  });

  const emptyState = (
    <Empty className="p-0 md:p-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Link2 aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t("links.emptyTitle")}</EmptyTitle>
        <EmptyDescription>{t("links.emptyBody")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="default"
          className="rounded-full"
          onClick={() => setCreateOpen(true)}
        >
          <Plus aria-hidden />
          {t("links.create")}
        </Button>
      </EmptyContent>
    </Empty>
  );

  const footerN = typeof totalCount === "number" ? totalCount : rows.length;
  const footerLabel = useMemo(
    () =>
      t(footerN === 1 ? "links.footerOne" : "links.footerMany", {
        n: footerN,
      }),
    [footerN, t]
  );

  const copyToClipboard = useCallback(
    async (text: string) => {
      const ok = await copyTextToClipboard(text);
      if (ok) toast(t("links.copied"));
      else toast.error(t("links.copyFailed"));
    },
    [t]
  );

  const handleCreate = useCallback(
    async (args: {
      originalUrl: string;
      label: string;
      description: string;
      icon: SmsLinkIconId;
    }) => {
      if (!userId) {
        return { data: null, error: t("links.loginRequired") };
      }
      const { data, error: createError } = await createSmsShortLink(supabase, {
        originalUrl: args.originalUrl,
        label: args.label,
        description: args.description,
        icon: args.icon,
      });
      if (createError || !data) {
        return {
          data: null,
          error: createError?.message ?? t("links.createFailed"),
        };
      }
      return { data, error: null };
    },
    [userId, supabase, t]
  );

  const handleCreated = useCallback(async () => {
    await onRefresh();
    toast(t("links.createdToast"));
  }, [onRefresh, t]);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete || !userId) return;
    const { error: delError } = await deleteSmsLinks(
      supabase,
      userId,
      pendingDelete.ids
    );
    if (delError) throw delError;
    const n = pendingDelete.ids.length;
    setPendingDelete(null);
    clearSelection();
    await onRefresh();
    toast(n > 1 ? t("links.deletedManyToast", { n }) : t("links.deletedToast"));
  }, [pendingDelete, userId, supabase, onRefresh, t, clearSelection]);

  const allLoadedSelected =
    rows.length > 0 && rows.every((r) => selectedIds.has(r.id));

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

  const openDeleteOne = useCallback((row: LinkRowData) => {
    setPendingDelete({
      ids: [row.id],
      shortUrl: row.shortUrl,
      originalUrl: row.originalUrl,
    });
  }, []);

  const dataColumns: ColumnDef<LinkRowData, unknown>[] = useMemo(
    () => [
      {
        id: "icon",
        ...listColFixed(LINK_COL.icon),
        header: () => null,
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <div className="flex w-full items-center justify-center">
            <SmsLinkIconTile iconId={row.original.icon} size="sm" />
          </div>
        ),
      },
      {
        accessorKey: "label",
        header: t("links.col.label"),
        ...listColFixed(LINK_COL.label),
        cell: ({ getValue }) => (
          <CellTruncate as="div">{getValue<string>() || "—"}</CellTruncate>
        ),
      },
      {
        accessorKey: "description",
        header: t("links.col.description"),
        size: LINK_COL.description,
        cell: ({ getValue }) => (
          <CellTruncate as="div" className="text-muted-foreground">
            {getValue<string>()?.trim() || "—"}
          </CellTruncate>
        ),
      },
      {
        accessorKey: "originalUrl",
        header: t("links.col.originalUrl"),
        size: LINK_COL.originalUrl,
        cell: ({ getValue }) => {
          const url = getValue<string>();
          const label = linkUrlDisplayLabel(url);
          return (
            <CellTruncate as="div" className="min-w-0">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                title={url}
                className="inline-flex min-w-0 max-w-full items-center gap-1 text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
              </a>
            </CellTruncate>
          );
        },
      },
      {
        accessorKey: "shortUrl",
        header: t("links.col.shortUrl"),
        ...listColFixed(LINK_COL.shortUrl),
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ getValue }) => {
          const shortUrl = getValue<string>();
          return (
            <CopyableLinkField
              value={shortUrl}
              displayValue={linkUrlDisplayLabel(shortUrl)}
              size="dense"
              copiedToast={t("links.copied")}
              copyFailedToast={t("links.copyFailed")}
            />
          );
        },
      },
      {
        accessorKey: "clickCount",
        header: t("links.col.clicks"),
        ...listColFixed(LINK_COL.clickCount),
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: "createdLabel",
        header: t("links.col.created"),
        ...listColFixed(LINK_COL.created),
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-foreground">
              {row.original.createdDateLabel}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {row.original.createdTimeLabel}
            </div>
          </div>
        ),
      },
    ],
    [t]
  );

  const columns: ColumnDef<LinkRowData, unknown>[] = useMemo(
    () => [
      {
        id: "select",
        ...listColFixed(LINK_COL.actions),
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
              aria-label={t("links.selectAllAria")}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={selectedIds.has(row.original.id)}
              onCheckedChange={() => toggleSelect(row.original.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={t("links.selectOneAria", {
                name: row.original.label || row.original.shortUrl,
              })}
            />
          </div>
        ),
      },
      ...dataColumns,
      {
        id: "actions",
        ...listColFixed(LINK_COL.actions),
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
                  aria-label={t("links.actionsAria", {
                    name: row.original.label || row.original.shortUrl,
                  })}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onSelect={() => void copyToClipboard(row.original.shortUrl)}
                >
                  <Copy aria-hidden />
                  {t("links.copyShort")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => openDeleteOne(row.original)}
                >
                  <Trash2 aria-hidden />
                  {t("common.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [
      allLoadedSelected,
      copyToClipboard,
      dataColumns,
      openDeleteOne,
      selectedIds,
      t,
      toggleAll,
      toggleSelect,
    ]
  );

  const deleteCount = pendingDelete?.ids.length ?? 0;

  return (
    <div className={LIST_VIEW_STACK_CLASS}>
      {showListIntro ? (
        <ListEmptyIntroBanner
          section="liens"
          onLearnMore={openHelp}
          onDismiss={() => setListIntroDismissed(true)}
        />
      ) : null}

      <div className={LIST_VIEW_TOOLBAR_CLASS}>
        <InputGroup className={LIST_VIEW_SEARCH_INPUT_CLASS} role="search">
          <InputGroupAddon align="inline-start">
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={t("links.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={t("links.searchAria")}
          />
        </InputGroup>
        {showExpandBanner ? (
          <SelectAllExpandBanner
            matchTotal={matchTotal}
            hasSearch={searchQuery.trim().length > 0}
            entityLabel="liens"
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
            <Button
              variant="destructive"
              size={LIST_VIEW_TOOLBAR_BUTTON_SIZE}
              className="rounded-full"
              onClick={() => {
                void (async () => {
                  const ids = await ensureSelectionReady();
                  if (ids.length === 0) return;
                  setPendingDelete({ ids });
                })();
              }}
            >
              <Trash2 aria-hidden />
              {t("links.deleteSelected", { n: displaySelectedCount })}
            </Button>
          ) : (
            <Button
              variant="default"
              size={LIST_VIEW_TOOLBAR_BUTTON_SIZE}
              className="rounded-full"
              onClick={() => setCreateOpen(true)}
            >
              <Plus aria-hidden />
              {t("links.create")}
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
          {error}
        </div>
      ) : null}

      {expandError && !showExpandBanner ? (
        <p className="m-0 text-xs font-semibold text-destructive">
          {expandError}
        </p>
      ) : null}

      <ListFilterChips
        filters={columnFilters}
        labels={filterLabels}
        onClearId={(id) => {
          clearSelection();
          setColumnFilters((prev) => prev.filter((f) => f.id !== id));
        }}
        onClearAll={() => {
          clearSelection();
          setColumnFilters([]);
        }}
      />

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        globalFilter={searchQuery}
        loadingMessage={t("links.loading")}
        emptyMessage={emptyState}
        searchNoResultsMessage={t("links.noSearchResults")}
        footer={footerLabel}
        sorting={sorting}
        onSortingChange={onSortingChange}
        manualSorting
        columnFilters={columnFilters}
        onColumnFiltersChange={(updater) => {
          clearSelection();
          setColumnFilters(updater);
        }}
        manualFiltering
        hasActiveFilters={hasActiveFilters}
        renderColumnFilter={renderColumnFilter}
      />

      <CreateSmsLinkModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
        onCreated={() => void handleCreated()}
      />

      <ConfirmLinkDeleteModal
        open={pendingDelete !== null}
        count={deleteCount}
        shortUrl={pendingDelete?.shortUrl}
        originalUrl={pendingDelete?.originalUrl}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
