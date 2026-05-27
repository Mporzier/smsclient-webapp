"use client";

import { SearchBar } from "@/components/smsclient/Shell";
import {
  BadgeDraft,
  BadgeFailed,
  BadgeScheduled,
  BadgeSent,
  ProtoBtn,
  PlusIcon,
} from "@/components/smsclient/ui";
import { DataTable } from "@/components/smsclient/DataTable";
import type { CampaignRowData, SmsCampaignStatus } from "@/lib/types/campaign";
import { useMemo, useState } from "react";
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

const columns: ColumnDef<CampaignRowData, unknown>[] = [
  { accessorKey: "createdLabel", header: "Date", size: 120 },
  {
    accessorKey: "name",
    header: "Campagne",
    cell: ({ getValue }) => <span className="font-extrabold">{getValue<string>()}</span>,
  },
  { accessorKey: "recipients", header: "Destinataires", size: 110 },
  {
    accessorKey: "status",
    header: "Statut",
    size: 120,
    cell: ({ getValue }) => <StatusBadge status={getValue<SmsCampaignStatus>()} />,
  },
  { accessorKey: "sendLabel", header: "Envoi", size: 160 },
  { accessorKey: "creditsLabel", header: "Crédit SMS", size: 100 },
];

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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <SearchBar
            placeholder="Rechercher une campagne…"
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <div className="mt-0.5 flex flex-wrap gap-3">
          <ProtoBtn primary onClick={onNewCampaign}>
            <PlusIcon />
            Nouvelle campagne
          </ProtoBtn>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
          {error}
        </div>
      )}

      {showBigEmpty ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center">
          <p className="m-0 text-base font-extrabold text-slate-800">
            Aucune campagne
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Crée une campagne avec « Nouvelle campagne ».
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          pageSize={20}
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
