"use client";

import { CellTruncate } from "@/components/smsclient/ui";
import { ContactGroupsCell } from "@/components/smsclient/ContactGroupsCell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/smsclient/DataTable";
import { DataTableColumnFilter } from "@/components/smsclient/DataTableColumnFilter";
import { ListFilterChips } from "@/components/smsclient/ListFilterChips";
import { CONTACT_COL } from "@/components/smsclient/listColumnSizes";
import { SelectAllExpandBanner } from "@/components/smsclient/SelectAllExpandBanner";
import {
  UnsubscribedContactsModal,
  type UnsubscribedContactRow,
} from "@/components/smsclient/modals/UnsubscribedContactsModal";
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
import { avatarColor, contactInitials } from "@/lib/proto/contactDisplay";
import type { ContactRowData } from "@/lib/types/contact";
import { isCampaignEligibleContact } from "@/lib/types/contact";
import { compareIsoTimestampsStable } from "@/lib/proto/compareIso";
import {
  contactColumnFilterKind,
  customFieldTypesFromDefs,
} from "@/lib/proto/listFilterUi";
import { listFiltersKey, normalizeListFilters } from "@/lib/proto/listFilters";
import { formatCustomFieldDisplay } from "@/lib/customFields/validate";
import type { CustomFieldDef } from "@/lib/types/customFields";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table";

type ContactsProps = {
  rows: ContactRowData[];
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
  setCustomFieldFilterTypes?: (
    types: Record<string, CustomFieldDef["fieldType"]>,
  ) => void;
  loadFilterFacets?: () => Promise<{
    sources: string[];
    groups: { id: string; name: string }[];
  }>;
  error: string | null;
  customFieldDefs?: CustomFieldDef[];
  unsubscribedContacts?: UnsubscribedContactRow[];
  unsubscribedCount?: number;
  unsubscribedLoading?: boolean;
  onLoadUnsubscribed?: () => void;
  onImport: () => void;
  onAddContact: () => void;
  onRowClick: (row: ContactRowData) => void;
  onDeleteContacts: (
    ids: string[] | (() => Promise<string[]>),
    countHint?: number,
  ) => void;
  /** Suppression par filtre serveur quand toute la recherche est sélectionnée. */
  onDeleteContactsMatching?: (
    search: string,
    countHint: number,
    filters?: ColumnFiltersState,
  ) => void;
  onCreateCampaignFromContacts: (ids: string[]) => void;
  onResubscribeContacts?: (ids: string[]) => Promise<void>;
  onCountSelectableMatches?: (
    search: string,
    filters?: ColumnFiltersState,
  ) => Promise<{ count: number; error: Error | null }>;
  onFetchSelectableMatchIds?: (
    search: string,
    filters?: ColumnFiltersState,
  ) => Promise<{ data: string[]; error: Error | null }>;
};

function buildContactColumns(
  customFieldDefs: CustomFieldDef[],
  t: (key: MessageKey, vars?: Record<string, string | number>) => string
): ColumnDef<ContactRowData, unknown>[] {
  const customCols: ColumnDef<ContactRowData, unknown>[] = customFieldDefs.map(
    (def) => ({
      id: `custom_${def.id}`,
      header: def.label,
      size: CONTACT_COL.customField,
      accessorFn: (row) => {
        const raw = row.customFields?.[def.id];
        if (raw == null) return undefined;
        const text = formatCustomFieldDisplay(raw, def.fieldType).trim();
        return text && text !== "—" ? text : undefined;
      },
      sortUndefined: "last",
      sortDescFirst: false,
      cell: ({ row }) => (
        <CellTruncate as="div">
          {formatCustomFieldDisplay(
            row.original.customFields?.[def.id],
            def.fieldType
          )}
        </CellTruncate>
      ),
    })
  );

  return [
    {
      id: "avatar",
      size: CONTACT_COL.avatar,
      minSize: CONTACT_COL.avatar,
      maxSize: CONTACT_COL.avatar,
      header: "",
      cell: ({ row }) => {
        const initials = contactInitials(row.original);
        const c = avatarColor(row.original.id);
        return (
          <div
            className={cn(
              "grid h-7 w-7 place-items-center rounded-full text-[11px] font-medium",
              c.bg,
              c.text
            )}
          >
            {initials}
          </div>
        );
      },
    },
    {
      accessorKey: "firstName",
      header: t("contacts.col.firstName"),
      size: CONTACT_COL.firstName,
      cell: ({ getValue }) => (
        <CellTruncate as="div" className="">
          {getValue<string>().trim() || "—"}
        </CellTruncate>
      ),
    },
    {
      accessorKey: "lastName",
      header: t("contacts.col.lastName"),
      size: CONTACT_COL.lastName,
      cell: ({ getValue }) => (
        <CellTruncate as="div" className="">
          {getValue<string>().trim() || "—"}
        </CellTruncate>
      ),
    },
    {
      accessorKey: "phone",
      header: t("contacts.col.phone"),
      size: CONTACT_COL.phone,
      cell: ({ getValue }) => (
        <div className="flex items-center gap-1.5">
          <Phone
            className="h-3.5 w-3.5 shrink-0 text-emerald-500"
            aria-hidden
          />
          <CellTruncate as="span">{getValue<string>()}</CellTruncate>
        </div>
      ),
    },
    {
      accessorKey: "groups",
      header: t("contacts.col.groups"),
      size: CONTACT_COL.groups,
      enableSorting: false,
      cell: ({ getValue }) => (
        <ContactGroupsCell groups={getValue<string[]>() ?? []} />
      ),
    },
    {
      id: "notes",
      header: t("contacts.col.notes"),
      size: CONTACT_COL.notes,
      accessorFn: (row) => {
        const n = row.notes.trim();
        return n || undefined;
      },
      sortUndefined: "last",
      sortDescFirst: false,
      cell: ({ row }) => (
        <CellTruncate as="div">{row.original.notes.trim() || "—"}</CellTruncate>
      ),
    },
    {
      id: "lastSms",
      header: t("contacts.col.lastSms"),
      size: CONTACT_COL.lastSms,
      accessorFn: (row) => row.lastSmsAt ?? undefined,
      sortingFn: (a, b) =>
        compareIsoTimestampsStable(
          a.original.lastSmsAt,
          b.original.lastSmsAt,
          a.original.id,
          b.original.id
        ),
      sortUndefined: "last",
      sortDescFirst: false,
      cell: ({ row }) => {
        const date = row.original.lastSms;
        const body = row.original.lastSmsBody;
        if (!body && date === "—")
          return <span className="text-sm text-slate-400">—</span>;
        return (
          <div className="flex flex-col gap-0.5 truncate">
            {body ? (
              <span className="truncate text-sm text-slate-700">
                &laquo;&thinsp;{body.slice(0, 50)}
                {body.length > 50 ? "…" : ""}&thinsp;&raquo;
              </span>
            ) : null}
            {date !== "—" && (
              <span className="text-xs text-slate-400">{date}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "source",
      header: t("contacts.col.source"),
      size: CONTACT_COL.source,
      cell: ({ getValue }) => (
        <CellTruncate as="div">{getValue<string>()}</CellTruncate>
      ),
    },
    {
      id: "created",
      header: t("contacts.col.created"),
      size: CONTACT_COL.created,
      accessorFn: (row) => row.createdAt,
      sortingFn: (a, b) =>
        compareIsoTimestampsStable(
          a.original.createdAt,
          b.original.createdAt,
          a.original.id,
          b.original.id
        ),
      sortDescFirst: false,
      cell: ({ row }) => (
        <CellTruncate as="div">{row.original.created}</CellTruncate>
      ),
    },
    /** Champs perso à droite (avant actions sticky). */
    ...customCols,
  ];
}

/** Largeur naturelle base + champs perso — force scroll horizontal si defs. */
function contactsTableMinWidth(customFieldCount: number): number | undefined {
  if (customFieldCount <= 0) return undefined;
  const base =
    CONTACT_COL.select +
    CONTACT_COL.avatar +
    CONTACT_COL.firstName +
    CONTACT_COL.lastName +
    CONTACT_COL.phone +
    CONTACT_COL.groups +
    CONTACT_COL.notes +
    CONTACT_COL.lastSms +
    CONTACT_COL.source +
    CONTACT_COL.created +
    CONTACT_COL.actions;
  return base + customFieldCount * CONTACT_COL.customField;
}

export function ContactsView({
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
  setCustomFieldFilterTypes,
  loadFilterFacets,
  error,
  customFieldDefs = [],
  unsubscribedContacts = [],
  unsubscribedCount,
  unsubscribedLoading = false,
  onLoadUnsubscribed,
  onImport,
  onAddContact,
  onRowClick,
  onDeleteContacts,
  onDeleteContactsMatching,
  onCreateCampaignFromContacts,
  onResubscribeContacts,
  onCountSelectableMatches,
  onFetchSelectableMatchIds,
}: ContactsProps) {
  const { t } = useI18n();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [unsubModalOpen, setUnsubModalOpen] = useState(false);
  const [sourceOptions, setSourceOptions] = useState<string[]>([]);
  const [groupOptions, setGroupOptions] = useState<
    { id: string; name: string }[]
  >([]);

  useEffect(() => {
    setCustomFieldFilterTypes?.(customFieldTypesFromDefs(customFieldDefs));
  }, [customFieldDefs, setCustomFieldFilterTypes]);

  useEffect(() => {
    if (!loadFilterFacets) return;
    let cancelled = false;
    void loadFilterFacets().then((facets) => {
      if (cancelled) return;
      setSourceOptions(facets.sources);
      setGroupOptions(facets.groups);
    });
    return () => {
      cancelled = true;
    };
  }, [loadFilterFacets]);

  const filterLabels = useMemo(() => {
    const labels: Record<string, string> = {
      firstName: t("contacts.col.firstName"),
      lastName: t("contacts.col.lastName"),
      phone: t("contacts.col.phone"),
      groups: t("contacts.col.groups"),
      notes: t("contacts.col.notes"),
      lastSms: t("contacts.col.lastSms"),
      lastSmsBody: t("listFilter.lastSms.body"),
      source: t("contacts.col.source"),
      created: t("contacts.col.created"),
    };
    for (const def of customFieldDefs) {
      labels[`custom_${def.id}`] = def.label;
    }
    return labels;
  }, [customFieldDefs, t]);

  const selectAllScopeKey = useMemo(
    () => `${searchQuery}::${listFiltersKey(columnFilters)}`,
    [searchQuery, columnFilters],
  );

  const hasActiveFilters = normalizeListFilters(columnFilters).length > 0;

  const eligibleRows = useMemo(
    () => rows.filter((r) => isCampaignEligibleContact(r)),
    [rows]
  );

  const loadedIds = useMemo(
    () => eligibleRows.map((r) => r.id),
    [eligibleRows]
  );

  const setSelectedIdsList = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const countMatch = useCallback(async () => {
    if (!onCountSelectableMatches)
      return { count: loadedIds.length, error: null };
    return onCountSelectableMatches(searchQuery, columnFilters);
  }, [onCountSelectableMatches, searchQuery, columnFilters, loadedIds.length]);

  const fetchAllIds = useCallback(async () => {
    if (!onFetchSelectableMatchIds) {
      return { data: loadedIds, error: null };
    }
    return onFetchSelectableMatchIds(searchQuery, columnFilters);
  }, [onFetchSelectableMatchIds, searchQuery, columnFilters, loadedIds]);

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
    matchAllActive,
    exitMatchAll,
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

  const onRowClickRef = useRef(onRowClick);
  const onDeleteContactsRef = useRef(onDeleteContacts);

  useEffect(() => {
    onRowClickRef.current = onRowClick;
    onDeleteContactsRef.current = onDeleteContacts;
  });

  const unsubCount = unsubscribedCount ?? unsubscribedContacts.length;

  const openUnsubModal = useCallback(() => {
    setUnsubModalOpen(true);
    onLoadUnsubscribed?.();
  }, [onLoadUnsubscribed]);

  const hasSelection = displaySelectedCount > 0;

  const emptyState = (
    <Empty className="p-0 md:p-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UserRound aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t("contacts.emptyTitle")}</EmptyTitle>
        <EmptyDescription>{t("contacts.emptyBody")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="default"
            className="rounded-full"
            onClick={onAddContact}
          >
            <Plus aria-hidden />
            {t("contacts.add")}
          </Button>
          <Button variant="outline" className="rounded-full" onClick={onImport}>
            <Download aria-hidden />
            {t("contacts.import")}
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );

  const allLoadedSelected =
    eligibleRows.length > 0 && eligibleRows.every((r) => selectedIds.has(r.id));

  const footer = useMemo(() => {
    if (loading) return "…";
    const total =
      typeof totalCount === "number" ? totalCount : eligibleRows.length;
    const contactsLabel = t(
      total === 1 ? "contacts.footerOne" : "contacts.footerMany",
      { n: total }
    );
    if (unsubCount === 0) return contactsLabel;
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-muted-foreground">
          {contactsLabel}
          <span className="mx-2.5 text-muted-foreground/50">·</span>
          <span className="text-rose-500/80">
            {t(unsubCount > 1 ? "contacts.unsubMany" : "contacts.unsubOne", {
              n: unsubCount,
            })}
          </span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 cursor-pointer border-rose-200/60 bg-rose-50/70 px-2.5 text-xs font-semibold text-rose-500/90 hover:bg-rose-50 hover:text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/25 dark:text-rose-400/80 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
          onClick={openUnsubModal}
        >
          {t("contacts.viewUnsubList")}
        </Button>
      </div>
    );
  }, [loading, eligibleRows.length, totalCount, unsubCount, openUnsubModal, t]);

  const toggleSelect = useCallback(
    (id: string) => {
      exitMatchAll();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [exitMatchAll]
  );

  const toggleAll = useCallback(() => {
    if (allLoadedSelected) {
      clearSelection();
      return;
    }
    selectLoaded();
  }, [allLoadedSelected, clearSelection, selectLoaded]);

  const renderColumnFilter = useCallback(
    (columnId: string) => {
      const kind = contactColumnFilterKind(columnId, customFieldDefs);
      if (!kind) return null;
      return (
        <DataTableColumnFilter
          columnId={columnId}
          columnLabel={filterLabels[columnId] ?? columnId}
          kind={kind}
          columnFilters={columnFilters}
          onColumnFiltersChange={(next) => {
            clearSelection();
            setColumnFilters(next);
          }}
          sourceOptions={sourceOptions}
          groupOptions={groupOptions}
        />
      );
    },
    [
      clearSelection,
      columnFilters,
      customFieldDefs,
      filterLabels,
      groupOptions,
      setColumnFilters,
      sourceOptions,
    ],
  );

  const columns = useMemo(
    () => buildContactColumns(customFieldDefs, t),
    [customFieldDefs, t]
  );

  const minContentWidth = useMemo(
    () => contactsTableMinWidth(customFieldDefs.length),
    [customFieldDefs.length]
  );

  const selectColumns: ColumnDef<ContactRowData, unknown>[] = useMemo(
    () => [
      {
        id: "select",
        size: CONTACT_COL.select,
        minSize: CONTACT_COL.select,
        maxSize: CONTACT_COL.select,
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
              aria-label={t("contacts.selectAllAria")}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={selectedIds.has(row.original.id)}
              onCheckedChange={() => toggleSelect(row.original.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={t("contacts.selectOneAria", {
                name: row.original.name,
              })}
            />
          </div>
        ),
      },
      ...columns,
      {
        id: "actions",
        size: CONTACT_COL.actions,
        minSize: CONTACT_COL.actions,
        maxSize: CONTACT_COL.actions,
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
                  aria-label={t("contacts.actionsAria", {
                    name: row.original.name,
                  })}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onSelect={() => onRowClickRef.current(row.original)}
                >
                  {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() =>
                    onDeleteContactsRef.current([row.original.id])
                  }
                >
                  {t("common.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [columns, t, toggleAll, toggleSelect, selectedIds, allLoadedSelected]
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
            placeholder={t("contacts.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={t("contacts.searchAria")}
          />
        </InputGroup>
        {showExpandBanner ? (
          <SelectAllExpandBanner
            matchTotal={matchTotal}
            hasSearch={
              searchQuery.trim().length > 0 || hasActiveFilters
            }
            entityLabel="contacts éligibles"
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
                  if (matchAllActive && onDeleteContactsMatching) {
                    onDeleteContactsMatching(
                      searchQuery,
                      displaySelectedCount,
                      columnFilters,
                    );
                    clearSelection();
                    return;
                  }
                  // Résolution des ids (expand en cours) pendant que la modale
                  // est déjà ouverte : pas d'attente au clic.
                  const idsPromise = ensureSelectionReady();
                  onDeleteContacts(() => idsPromise, displaySelectedCount);
                  void idsPromise.then(() => clearSelection());
                }}
              >
                <Trash2 aria-hidden />
                {t("contacts.deleteSelected", { n: displaySelectedCount })}
              </Button>
              <Button
                variant="default"
                size="lg"
                className="rounded-full"
                onClick={() => {
                  void (async () => {
                    const ids = await ensureSelectionReady();
                    onCreateCampaignFromContacts(ids);
                    clearSelection();
                  })();
                }}
              >
                <Send aria-hidden />
                {t("contacts.createCampaign")}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full"
                onClick={onImport}
              >
                <Download aria-hidden />
                {t("contacts.import")}
              </Button>
              <Button
                variant="default"
                size="lg"
                className="rounded-full"
                onClick={onAddContact}
              >
                <Plus aria-hidden />
                {t("contacts.add")}
              </Button>
            </>
          )}
        </div>
      </div>

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

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
          {error}
        </div>
      )}

      <DataTable
        columns={selectColumns}
        data={eligibleRows}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        globalFilter={searchQuery}
        loadingMessage={t("contacts.loading")}
        emptyMessage={emptyState}
        searchNoResultsMessage={t("contacts.noSearchResults")}
        onRowClick={onRowClick}
        footer={footer}
        minContentWidth={minContentWidth}
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


      <UnsubscribedContactsModal
        open={unsubModalOpen}
        contacts={unsubscribedContacts}
        loading={unsubscribedLoading}
        onClose={() => setUnsubModalOpen(false)}
        onResubscribe={onResubscribeContacts}
      />
    </div>
  );
}
