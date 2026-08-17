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
import { DataTable } from "@/components/smsclient/DataTable";
import { CAMPAIGN_COL } from "@/components/smsclient/listColumnSizes";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useI18n, type MessageKey } from "@/lib/i18n";
import type { CampaignRowData, SmsCampaignStatus } from "@/lib/types/campaign";
import { useMemo } from "react";
import { Megaphone, MoreHorizontal, Search } from "lucide-react";
import type {
  ColumnDef,
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
  error,
  onOpenDetails,
}: CampagnesProps) {
  const { t } = useI18n();

  const showBigEmpty =
    !loading && !error && rows.length === 0 && searchQuery.trim() === "";

  const footerN = typeof totalCount === "number" ? totalCount : rows.length;
  const footerLabel = useMemo(
    () =>
      t(footerN === 1 ? "campaigns.footerOne" : "campaigns.footerMany", {
        n: footerN,
      }),
    [footerN, t],
  );

  const columns: ColumnDef<CampaignRowData, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "createdLabel",
        header: t("campaigns.col.date"),
        size: CAMPAIGN_COL.created,
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
        size: CAMPAIGN_COL.actions,
        minSize: CAMPAIGN_COL.actions,
        maxSize: CAMPAIGN_COL.actions,
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

      {showBigEmpty ? (
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <Megaphone
              className="h-14 w-14 text-slate-400"
              strokeWidth={1.25}
              aria-hidden
            />
            <p className="m-0 max-w-[360px] text-lg font-extrabold text-slate-800">
              {t("campaigns.emptyTitle")}
            </p>
            <p className="m-0 max-w-[400px] text-sm font-semibold leading-relaxed text-slate-500">
              {t("campaigns.emptyBody")}
            </p>
          </div>
        </section>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          globalFilter={searchQuery}
          loadingMessage={t("campaigns.loading")}
          emptyMessage={t("campaigns.emptyTable")}
          searchNoResultsMessage={t("campaigns.noSearchResults")}
          onRowClick={onOpenDetails}
          footer={footerLabel}
          sorting={sorting}
          onSortingChange={onSortingChange}
          manualSorting
        />
      )}
    </div>
  );
}
