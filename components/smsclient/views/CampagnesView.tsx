"use client";

import {
  BadgeDraft,
  BadgeFailed,
  BadgeScheduled,
  BadgeSent,
  CellTruncate,
} from "@/components/smsclient/ui";
import { Button } from "@/components/ui/button";
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
import {
  LIST_VIEW_SEARCH_INPUT_CLASS,
  LIST_VIEW_STACK_CLASS,
  LIST_VIEW_TOOLBAR_CLASS,
} from "@/components/smsclient/listViewLayout";
import { DataTable } from "@/components/smsclient/DataTable";
import { DataTableColumnFilter } from "@/components/smsclient/DataTableColumnFilter";
import { ListFilterChips } from "@/components/smsclient/ListFilterChips";
import { useShellHelpActions } from "@/components/smsclient/shell/ShellHeaderTitleContext";
import {
  CAMPAIGN_COL,
  LINK_COL,
  listColFixed,
} from "@/components/smsclient/listColumnSizes";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useI18n, type MessageKey } from "@/lib/i18n";
import type { CampaignRowData, SmsCampaignStatus } from "@/lib/types/campaign";
import { normalizeListFilters } from "@/lib/proto/listFilters";
import { campaignColumnFilterKind } from "@/lib/proto/listFilterUi";
import { useCallback, useMemo, useState } from "react";
import { Eye, MoreHorizontal, Plus, Search, Send } from "lucide-react";
import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table";

const STATUS_KEYS: Record<SmsCampaignStatus, MessageKey> = {
  sent: "campaigns.status.sent",
  scheduled: "campaigns.status.scheduled",
  draft: "campaigns.status.draft",
  failed: "campaigns.status.failed",
  cancelled: "campaigns.status.cancelled",
};

function StatusBadge({ status }: { status: SmsCampaignStatus }) {
  const { t } = useI18n();
  const label = t(STATUS_KEYS[status]);
  switch (status) {
    case "sent":
      return <BadgeSent>{label}</BadgeSent>;
    case "scheduled":
      return <BadgeScheduled>{label}</BadgeScheduled>;
    case "draft":
      return <BadgeDraft>{label}</BadgeDraft>;
    case "failed":
    case "cancelled":
      return <BadgeFailed>{label}</BadgeFailed>;
    default:
      return <BadgeDraft>—</BadgeDraft>;
  }
}

type CampagnesProps = {
  rows: CampaignRowData[];
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
  onNewCampaign: () => void;
  onOpenDetails: (row: CampaignRowData) => void;
};

export function CampagnesView({
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
  onNewCampaign,
  onOpenDetails,
}: CampagnesProps) {
  const { t } = useI18n();
  const { openHelp } = useShellHelpActions();
  const [listIntroDismissed, setListIntroDismissed] = useState(false);

  const filterLabels = useMemo(
    () => ({
      createdLabel: t("campaigns.col.date"),
      name: t("campaigns.col.name"),
      recipients: t("campaigns.col.recipients"),
      status: t("campaigns.col.status"),
      creditsLabel: t("campaigns.col.credits"),
    }),
    [t],
  );

  const hasActiveFilters = normalizeListFilters(columnFilters).length > 0;

  const renderColumnFilter = useCallback(
    (columnId: string) => {
      const kind = campaignColumnFilterKind(columnId);
      if (!kind) return null;
      return (
        <DataTableColumnFilter
          columnId={columnId}
          columnLabel={
            filterLabels[columnId as keyof typeof filterLabels] ?? columnId
          }
          kind={kind}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />
      );
    },
    [columnFilters, filterLabels, setColumnFilters],
  );

  const showListIntro = shouldShowListEmptyIntro({
    loading,
    dataLength: rows.length,
    searchQuery,
    hasActiveFilters,
    dismissed: listIntroDismissed,
  });

  const emptyState = (
    <Empty className="p-0 md:p-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Send aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t("campaigns.emptyTitle")}</EmptyTitle>
        <EmptyDescription>{t("campaigns.emptyBody")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="default"
          className="rounded-full"
          onClick={onNewCampaign}
        >
          <Plus aria-hidden />
          {t("shell.newCampaign")}
        </Button>
      </EmptyContent>
    </Empty>
  );

  const footerN = typeof totalCount === "number" ? totalCount : rows.length;
  const footerLabel = useMemo(() => {
    if (loading) return "…";
    return t(footerN === 1 ? "campaigns.footerOne" : "campaigns.footerMany", {
      n: footerN,
    });
  }, [footerN, loading, t]);

  const columns: ColumnDef<CampaignRowData, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "createdLabel",
        header: t("campaigns.col.date"),
        ...listColFixed(LINK_COL.created),
        cell: ({ getValue }) => (
          <CellTruncate as="div">{getValue<string>()}</CellTruncate>
        ),
      },
      {
        accessorKey: "name",
        header: t("campaigns.col.name"),
        size: CAMPAIGN_COL.name,
        cell: ({ getValue }) => (
          <CellTruncate as="div">{getValue<string>()}</CellTruncate>
        ),
      },
      {
        accessorKey: "recipients",
        header: t("campaigns.col.recipients"),
        size: CAMPAIGN_COL.recipients,
        cell: ({ getValue }) => (
          <CellTruncate as="div">{String(getValue())}</CellTruncate>
        ),
      },
      {
        accessorKey: "status",
        header: t("campaigns.col.status"),
        size: CAMPAIGN_COL.status,
        cell: ({ getValue }) => (
          <StatusBadge status={getValue<SmsCampaignStatus>()} />
        ),
      },
      {
        accessorKey: "sendLabel",
        header: t("campaigns.col.send"),
        size: CAMPAIGN_COL.send,
        enableSorting: false,
        cell: ({ getValue }) => (
          <CellTruncate as="div">{getValue<string>()}</CellTruncate>
        ),
      },
      {
        accessorKey: "creditsLabel",
        header: t("campaigns.col.credits"),
        size: CAMPAIGN_COL.credits,
        cell: ({ getValue }) => (
          <CellTruncate as="div">{getValue<string>()}</CellTruncate>
        ),
      },
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
                  aria-label={t("campaigns.actionsAria", {
                    name: row.original.name,
                  })}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => onOpenDetails(row.original)}>
                  <Eye aria-hidden />
                  {t("campaigns.viewDetails")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onOpenDetails, t],
  );

  return (
    <div className={LIST_VIEW_STACK_CLASS}>
      {showListIntro ? (
        <ListEmptyIntroBanner
          section="campagnes"
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
            placeholder={t("campaigns.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={t("campaigns.searchAria")}
          />
        </InputGroup>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
          {error}
        </div>
      )}

      <ListFilterChips
        filters={columnFilters}
        labels={filterLabels}
        onClearId={(id) => {
          setColumnFilters((prev) => prev.filter((f) => f.id !== id));
        }}
        onClearAll={() => setColumnFilters([])}
      />

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        globalFilter={searchQuery}
        emptyMessage={emptyState}
        searchNoResultsMessage={t("campaigns.noSearchResults")}
        onRowClick={onOpenDetails}
        footer={footerLabel}
        sorting={sorting}
        onSortingChange={onSortingChange}
        manualSorting
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        manualFiltering
        hasActiveFilters={hasActiveFilters}
        renderColumnFilter={renderColumnFilter}
      />
    </div>
  );
}
