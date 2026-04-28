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
import type { CampaignRowData, SmsCampaignStatus } from "@/lib/types/campaign";
import { useMemo, useState } from "react";

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

function statusFr(s: SmsCampaignStatus) {
  return statusLabel[s] ?? s;
}

function downloadCampaignsCsv(rows: CampaignRowData[], filename: string) {
  const head = [
    "Date création",
    "Nom",
    "Destinataires",
    "Statut",
    "Envoi",
    "Crédit SMS",
  ];
  const esc = (v: string) => `"${v.replaceAll('"', '""')}"`;
  const lines = [
    head.join(";"),
    ...rows.map((r) =>
      [
        r.createdLabel,
        r.name,
        String(r.recipients),
        statusFr(r.status),
        r.sendLabel,
        r.creditsLabel,
      ]
        .map(esc)
        .join(";")
    ),
  ];
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
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

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const hay = [
        row.name,
        String(row.recipients),
        row.status,
        statusFr(row.status),
        row.sendLabel,
        row.creditsLabel,
        row.createdLabel,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, searchQuery]);

  const showBigEmpty = !loading && !error && rows.length === 0;
  const searchNoResults =
    !loading &&
    !error &&
    rows.length > 0 &&
    filtered.length === 0 &&
    Boolean(searchQuery.trim());

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="m-0 text-[34px] font-extrabold tracking-tight text-slate-900">
            Campagnes
          </h1>
          <SearchBar
            placeholder="Rechercher une campagne…"
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <div className="mt-0.5 flex flex-wrap gap-3">
          <ProtoBtn
            onClick={() =>
              downloadCampaignsCsv(
                filtered,
                `campagnes-sms-${new Date().toISOString().slice(0, 10)}.csv`
              )
            }
            disabled={loading || filtered.length === 0}
          >
            Exporter
          </ProtoBtn>
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

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm font-bold text-slate-600">
          Chargement des campagnes…
        </div>
      )}

      {showBigEmpty && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center">
          <p className="m-0 text-base font-extrabold text-slate-800">
            Aucune campagne
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Crée une campagne avec « Nouvelle campagne ». Les envois enregistrés
            apparaissent ici (migration Supabase `sms_campaigns` requise).
          </p>
        </div>
      )}

      {!loading && !showBigEmpty && (
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <div className="min-h-0 overflow-auto">
            <table className="w-full border-separate border-spacing-0 text-[15px]">
              <thead>
                <tr>
                  {(
                    [
                      "Date de création",
                      "Nom de la campagne",
                      "Destinataires",
                      "Statut",
                      "Envoi",
                      "Crédit SMS",
                    ] as const
                  ).map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {searchNoResults ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="border-b border-slate-100 px-[18px] py-10 text-center text-sm font-bold text-slate-500"
                    >
                      Aucun résultat pour cette recherche.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr
                      key={row.id}
                      className="cursor-pointer hover:bg-slate-50/60"
                      onClick={() => onOpenDetails(row)}
                    >
                      <td className="whitespace-nowrap border-b border-slate-100 px-[18px] py-3.5 text-slate-900">
                        {row.createdLabel}
                      </td>
                      <td className="border-b border-slate-100 px-[18px] py-3.5 font-extrabold text-slate-900">
                        {row.name}
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-[18px] py-3.5 text-slate-900">
                        {row.recipients}
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-[18px] py-3.5 text-slate-900">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="min-w-[10rem] border-b border-slate-100 px-[18px] py-3.5 text-slate-900">
                        {row.sendLabel}
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-[18px] py-3.5 text-slate-900">
                        {row.creditsLabel}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-3.5 py-3 text-sm font-semibold text-slate-600">
            <span>
              {rows.length === 0
                ? "0 campagne"
                : filtered.length === rows.length
                ? `${rows.length} campagne${rows.length > 1 ? "s" : ""}`
                : `${filtered.length} sur ${rows.length} campagne${
                    rows.length > 1 ? "s" : ""
                  }`}
            </span>
          </div>
        </section>
      )}
    </>
  );
}
