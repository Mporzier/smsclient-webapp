"use client";

import { SectionGuideCard } from "@/components/smsclient/SectionGuideCard";
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
import type { CampaignRowData, SmsCampaignStatus } from "@/lib/types/campaign";
import { compareIsoTimestamps } from "@/lib/proto/compareIso";
import { useMemo, useState } from "react";
import { Megaphone, MoreHorizontal, Plus, Search } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

const statusLabel: Record<SmsCampaignStatus, string> = {
  sent: "Envoyée",
  scheduled: "Programmée",
  draft: "Brouillon",
  failed: "Échec",
  cancelled: "Annulée",
};

function StatusBadge({ status }: { status: SmsCampaignStatus }) {
  switch (status) {
    case "sent":
      return <BadgeSent>{statusLabel.sent}</BadgeSent>;
    case "scheduled":
      return <BadgeScheduled>{statusLabel.scheduled}</BadgeScheduled>;
    case "draft":
      return <BadgeDraft>{statusLabel.draft}</BadgeDraft>;
    case "failed":
    case "cancelled":
      return <BadgeFailed>{statusLabel[status]}</BadgeFailed>;
    default:
      return <BadgeDraft>—</BadgeDraft>;
  }
}

type CampagnesProps = {
  rows: CampaignRowData[];
  loading: boolean;
  error: string | null;
  onNewCampaign: () => void;
  onOpenDetails: (row: CampaignRowData) => void;
};

export function CampagnesView({
  rows,
  loading,
  error,
  onNewCampaign,
  onOpenDetails,
}: CampagnesProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const showBigEmpty = !loading && !error && rows.length === 0;

  const footerLabel = useMemo(() => {
    return `${rows.length} campagne${rows.length > 1 ? "s" : ""}`;
  }, [rows]);

  const columns: ColumnDef<CampaignRowData, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "createdLabel",
        header: "Date",
        size: CAMPAIGN_COL.created,
        sortingFn: (a, b) =>
          compareIsoTimestamps(a.original.createdAt, b.original.createdAt),
        cell: ({ getValue }) => (
          <CellTruncate as="div">{getValue<string>()}</CellTruncate>
        ),
      },
      {
        accessorKey: "name",
        header: "Campagne",
        size: CAMPAIGN_COL.name,
        cell: ({ getValue }) => (
          <CellTruncate as="div">{getValue<string>()}</CellTruncate>
        ),
      },
      {
        accessorKey: "recipients",
        header: "Destinataires",
        size: CAMPAIGN_COL.recipients,
        cell: ({ getValue }) => (
          <CellTruncate as="div">{String(getValue())}</CellTruncate>
        ),
      },
      {
        accessorKey: "status",
        header: "Statut",
        size: CAMPAIGN_COL.status,
        cell: ({ getValue }) => (
          <StatusBadge status={getValue<SmsCampaignStatus>()} />
        ),
      },
      {
        accessorKey: "sendLabel",
        header: "Envoi",
        size: CAMPAIGN_COL.send,
        sortingFn: (a, b) =>
          compareIsoTimestamps(
            a.original.sentAt ?? a.original.scheduledAt,
            b.original.sentAt ?? b.original.scheduledAt,
          ),
        cell: ({ getValue }) => (
          <CellTruncate as="div">{getValue<string>()}</CellTruncate>
        ),
      },
      {
        accessorKey: "creditsLabel",
        header: "Crédit SMS",
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
                  aria-label={`Actions pour ${row.original.name}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => onOpenDetails(row.original)}>
                  Voir détails
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onOpenDetails],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      {showBigEmpty && (
        <SectionGuideCard section="campagnes" onPrimaryAction={onNewCampaign} />
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <InputGroup
          className="max-w-sm bg-transparent dark:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0"
          role="search"
        >
          <InputGroupAddon align="inline-start">
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Rechercher une campagne…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Rechercher une campagne"
          />
        </InputGroup>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            size="lg"
            className="rounded-full"
            onClick={onNewCampaign}
          >
            <Plus aria-hidden />
            Nouvelle campagne
          </Button>
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
            <Megaphone
              className="h-14 w-14 text-slate-400"
              strokeWidth={1.25}
              aria-hidden
            />
            <p className="m-0 max-w-[360px] text-lg font-extrabold text-slate-800">
              Aucune campagne
            </p>
            <p className="m-0 max-w-[400px] text-sm font-semibold leading-relaxed text-slate-500">
              Créez une campagne avec « Nouvelle campagne ».
            </p>
          </div>
        </section>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          pageSize={25}
          globalFilter={searchQuery}
          emptyMessage="Aucune campagne."
          searchNoResultsMessage="Aucun résultat pour cette recherche."
          onRowClick={onOpenDetails}
          footer={footerLabel}
        />
      )}
    </div>
  );
}
