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
import { Pager } from "./Pager";

type CampagnesProps = { onNewCampaign: () => void };

export function CampagnesView({ onNewCampaign }: CampagnesProps) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[34px] font-extrabold tracking-tight text-slate-900">
            Campagnes
          </h1>
          <SearchBar placeholder="Rechercher une campagne..." />
        </div>
        <div className="mt-0.5 flex flex-wrap gap-3">
          <ProtoBtn>Exporter</ProtoBtn>
          <ProtoBtn primary onClick={onNewCampaign}>
            <PlusIcon />
            Nouvelle campagne
          </ProtoBtn>
        </div>
      </div>
      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
        <div className="overflow-auto">
          <table className="w-full text-[15px]">
            <thead>
              <tr>
                {["Date", "Nom de la campagne", "Destinataires", "Statut", "Envoi", "Crédit SMS"].map(
                  (h) => (
                    <th
                      key={h}
                      className="border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  d: "28/02/2026",
                  n: "Promo fin d'hiver",
                  dest: "128",
                  st: "sent" as const,
                  env: "28/02/2026 • 10:00",
                  cr: "128",
                },
                {
                  d: "20/02/2026",
                  n: "Relance clients inactifs",
                  dest: "57",
                  st: "sched" as const,
                  env: "22/02/2026 • 09:30",
                  cr: "57",
                },
                {
                  d: "13/02/2026",
                  n: "Nouveauté boutique",
                  dest: "209",
                  st: "sent" as const,
                  env: "13/02/2026 • 18:15",
                  cr: "209",
                },
                {
                  d: "03/02/2026",
                  n: "Offre VIP",
                  dest: "32",
                  st: "sent" as const,
                  env: "03/02/2026 • 11:05",
                  cr: "32",
                },
                {
                  d: "19/01/2026",
                  n: "Message d'information",
                  dest: "43",
                  st: "draft" as const,
                  env: "—",
                  cr: "—",
                },
                {
                  d: "12/12/2025",
                  n: "Promo Noël",
                  dest: "150",
                  st: "fail" as const,
                  env: "12/12/2025 • 17:45",
                  cr: "150",
                },
              ].map((row) => (
                <tr key={row.n}>
                  <td className="border-b border-slate-100 px-[18px] py-3.5 whitespace-nowrap">
                    {row.d}
                  </td>
                  <td className="border-b border-slate-100 px-[18px] py-3.5 font-extrabold whitespace-nowrap">
                    {row.n}
                  </td>
                  <td className="border-b border-slate-100 px-[18px] py-3.5 whitespace-nowrap">
                    {row.dest}
                  </td>
                  <td className="border-b border-slate-100 px-[18px] py-3.5 whitespace-nowrap">
                    {row.st === "sent" && (
                      <BadgeSent>Envoyée</BadgeSent>
                    )}
                    {row.st === "sched" && (
                      <BadgeScheduled>Programmée</BadgeScheduled>
                    )}
                    {row.st === "draft" && <BadgeDraft>Brouillon</BadgeDraft>}
                    {row.st === "fail" && <BadgeFailed>Annulé</BadgeFailed>}
                  </td>
                  <td className="border-b border-slate-100 px-[18px] py-3.5 whitespace-nowrap">
                    {row.env}
                  </td>
                  <td className="border-b border-slate-100 px-[18px] py-3.5 whitespace-nowrap">
                    {row.cr}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-3.5 py-3 text-sm font-semibold text-slate-600">
          <span>6 campagnes affichées sur 18</span>
          <Pager />
        </div>
      </section>
    </>
  );
}
