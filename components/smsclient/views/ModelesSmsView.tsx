"use client";

import { ConfirmSmsTemplateDeleteModal } from "@/components/smsclient/modals/ConfirmSmsTemplateDeleteModal";
import { CreateSmsTemplateModal } from "@/components/smsclient/modals/CreateSmsTemplateModal";
import { CellTruncate } from "@/components/smsclient/ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  LINK_COL,
  MODELE_SMS_COL,
  listColFixed,
} from "@/components/smsclient/listColumnSizes";
import { normalizeListFilters } from "@/lib/proto/listFilters";
import { templateColumnFilterKind } from "@/lib/proto/listFilterUi";
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
import { useI18n } from "@/lib/i18n";
import {
  countMatchingSmsTemplates,
  createUserSmsTemplate,
  deleteUserSmsTemplates,
  fetchMatchingSmsTemplateIds,
  updateUserSmsTemplate,
} from "@/lib/supabase/smsTemplates";
import type { UserSmsTemplateRow } from "@/lib/types/smsTemplate";
import type { CustomFieldDef } from "@/lib/types/customFields";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  LayoutTemplate,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "@/components/ui/sonner";
import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table";

type ModelesSmsViewProps = {
  rows: UserSmsTemplateRow[];
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
  customFieldDefs?: CustomFieldDef[];
};

export function ModelesSmsView({
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
  customFieldDefs = [],
}: ModelesSmsViewProps) {
  const { t } = useI18n();
  const { openHelp } = useShellHelpActions();
  const [listIntroDismissed, setListIntroDismissed] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [modalRow, setModalRow] = useState<UserSmsTemplateRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    ids: string[];
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filterLabels = useMemo(
    () => ({
      createdLabel: t("templates.col.created"),
      title: t("templates.col.title"),
      description: t("templates.col.description"),
      body: t("templates.col.message"),
    }),
    [t],
  );

  const hasActiveFilters = normalizeListFilters(columnFilters).length > 0;

  const loadedIds = useMemo(() => rows.map((r) => r.id), [rows]);

  const setSelectedIdsList = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const countMatch = useCallback(async () => {
    if (!userId) return { count: loadedIds.length, error: null };
    return countMatchingSmsTemplates(supabase, userId, {
      search: searchQuery,
    });
  }, [userId, supabase, searchQuery, loadedIds.length]);

  const fetchAllIds = useCallback(async () => {
    if (!userId) {
      return { data: loadedIds, error: null };
    }
    return fetchMatchingSmsTemplateIds(supabase, userId, {
      search: searchQuery,
    });
  }, [userId, supabase, searchQuery, loadedIds]);

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

  const renderColumnFilter = useCallback(
    (columnId: string) => {
      const kind = templateColumnFilterKind(columnId);
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
    [clearSelection, columnFilters, filterLabels, setColumnFilters],
  );

  const hasSelection = displaySelectedCount > 0;

  const showListIntro = shouldShowListEmptyIntro({
    loading,
    dataLength: rows.length,
    searchQuery,
    dismissed: listIntroDismissed,
  });

  const footerN = typeof totalCount === "number" ? totalCount : rows.length;
  const footerLabel = useMemo(
    () =>
      t(footerN === 1 ? "templates.footerOne" : "templates.footerMany", {
        n: footerN,
      }),
    [footerN, t],
  );

  const handleCreate = useCallback(
    async (args: { title: string; description: string; body: string }) => {
      if (!userId) {
        return { data: null, error: t("templates.loginRequired") };
      }
      const { data, error: createError } = await createUserSmsTemplate(
        supabase,
        userId,
        args,
      );
      if (createError || !data) {
        return {
          data: null,
          error: createError?.message ?? t("templates.createFailed"),
        };
      }
      return { data, error: null };
    },
    [userId, supabase, t],
  );

  const handleUpdate = useCallback(
    async (
      id: string,
      args: { title: string; description: string; body: string },
    ) => {
      if (!userId) {
        return { data: null, error: t("templates.loginRequired") };
      }
      const { data, error: updateError } = await updateUserSmsTemplate(
        supabase,
        userId,
        id,
        args,
      );
      if (updateError || !data) {
        return {
          data: null,
          error: updateError?.message ?? t("templates.updateFailed"),
        };
      }
      return { data, error: null };
    },
    [userId, supabase, t],
  );

  const handleSaved = useCallback(async () => {
    const wasEdit = Boolean(modalRow);
    await onRefresh();
    toast(wasEdit ? t("templates.updatedToast") : t("templates.createdToast"));
  }, [modalRow, onRefresh, t]);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete || !userId) return;
    const { error: delError } = await deleteUserSmsTemplates(
      supabase,
      userId,
      pendingDelete.ids,
    );
    if (delError) throw delError;
    const n = pendingDelete.ids.length;
    setPendingDelete(null);
    setFormOpen(false);
    setModalRow(null);
    clearSelection();
    await onRefresh();
    toast(
      n > 1
        ? t("templates.deletedManyToast", { n })
        : t("templates.deletedToast"),
    );
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

  const openCreate = useCallback(() => {
    setModalRow(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((row: UserSmsTemplateRow) => {
    setModalRow(row);
    setFormOpen(true);
  }, []);

  const emptyState = (
    <Empty className="p-0 md:p-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LayoutTemplate aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t("templates.emptyTitle")}</EmptyTitle>
        <EmptyDescription>{t("templates.emptyBody")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="default" className="rounded-full" onClick={openCreate}>
          <Plus aria-hidden />
          {t("templates.create")}
        </Button>
      </EmptyContent>
    </Empty>
  );

  const dataColumns: ColumnDef<UserSmsTemplateRow, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "createdLabel",
        header: t("templates.col.created"),
        ...listColFixed(LINK_COL.created),
      },
      {
        accessorKey: "title",
        header: t("templates.col.title"),
        ...listColFixed(LINK_COL.label),
        cell: ({ getValue }) => (
          <CellTruncate as="div" className="text-foreground">
            {getValue<string>()}
          </CellTruncate>
        ),
      },
      {
        accessorKey: "description",
        header: t("templates.col.description"),
        size: MODELE_SMS_COL.description,
        cell: ({ getValue }) => (
          <CellTruncate as="div" className="text-muted-foreground">
            {getValue<string>() || "—"}
          </CellTruncate>
        ),
      },
      {
        accessorKey: "body",
        header: t("templates.col.message"),
        size: MODELE_SMS_COL.body,
        cell: ({ getValue }) => (
          <CellTruncate as="div" className="text-muted-foreground">
            {getValue<string>()}
          </CellTruncate>
        ),
      },
    ],
    [t],
  );

  const columns: ColumnDef<UserSmsTemplateRow, unknown>[] = useMemo(
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
              aria-label={t("templates.selectAllAria")}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={selectedIds.has(row.original.id)}
              onCheckedChange={() => toggleSelect(row.original.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={t("templates.selectOneAria", {
                name: row.original.title,
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
                  aria-label={t("templates.actionsAria", {
                    name: row.original.title,
                  })}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => openEdit(row.original)}>
                  <Pencil aria-hidden />
                  {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() =>
                    setPendingDelete({ ids: [row.original.id] })
                  }
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
      selectedIds,
      allLoadedSelected,
      toggleAll,
      toggleSelect,
      openEdit,
      dataColumns,
      t,
    ],
  );

  const deleteCount = pendingDelete?.ids.length ?? 0;

  return (
    <div className={LIST_VIEW_STACK_CLASS}>
      {showListIntro ? (
        <ListEmptyIntroBanner
          section="modeles-sms"
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
            placeholder={t("templates.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={t("templates.searchAria")}
          />
        </InputGroup>
        {showExpandBanner ? (
          <SelectAllExpandBanner
            matchTotal={matchTotal}
            hasSearch={searchQuery.trim().length > 0}
            entityLabel="modèles"
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
              {t("templates.deleteSelected", { n: displaySelectedCount })}
            </Button>
          ) : (
            <Button
              variant="default"
              size={LIST_VIEW_TOOLBAR_BUTTON_SIZE}
              className="rounded-full"
              onClick={openCreate}
            >
              <Plus aria-hidden />
              {t("templates.create")}
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
        loadingMessage={t("templates.loading")}
        emptyMessage={emptyState}
        searchNoResultsMessage={t("templates.noSearchResults")}
        footer={footerLabel}
        sorting={sorting}
        onSortingChange={onSortingChange}
        manualSorting
        onRowClick={openEdit}
        columnFilters={columnFilters}
        onColumnFiltersChange={(updater) => {
          clearSelection();
          setColumnFilters(updater);
        }}
        manualFiltering
        hasActiveFilters={hasActiveFilters}
        renderColumnFilter={renderColumnFilter}
      />

      <CreateSmsTemplateModal
        open={formOpen}
        editRow={modalRow}
        onClose={() => {
          setFormOpen(false);
          setModalRow(null);
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onCreated={() => void handleSaved()}
        onDelete={
          modalRow
            ? () => setPendingDelete({ ids: [modalRow.id] })
            : undefined
        }
        customFieldDefs={customFieldDefs}
      />

      <ConfirmSmsTemplateDeleteModal
        open={pendingDelete !== null}
        count={deleteCount}
        stacked={formOpen && pendingDelete !== null}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
