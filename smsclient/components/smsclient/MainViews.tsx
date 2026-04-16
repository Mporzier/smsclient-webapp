"use client";

import { cn } from "@/lib/cn";
import { SearchBar } from "@/components/smsclient/Shell";
import {
  BadgeDraft,
  BadgeFailed,
  BadgeScheduled,
  BadgeSent,
  ProtoBtn,
  PlusIcon,
} from "@/components/smsclient/ui";
import { useCallback, useEffect, useRef, useState } from "react";

const tagCls =
  "inline-flex items-center rounded-[10px] border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-[13px] font-bold text-[#1f3b77]";

export type ContactRowData = {
  created: string;
  name: string;
  phone: string;
  group: string;
  lastSms: string;
  source: string;
  tag?: string;
};

const CONTACT_ROWS: ContactRowData[] = [
  {
    created: "02/12/2025",
    name: "Sophie",
    phone: "06 45 23 78 91",
    group: "Clients VIP",
    lastSms: "28/02/2026",
    source: "Import CSV",
    tag: "VIP",
  },
  {
    created: "15/01/2026",
    name: "Julien",
    phone: "06 34 89 56 20",
    group: "Clients Fidèles",
    lastSms: "20/01/2026",
    source: "Ajout manuel",
    tag: "Fidèles",
  },
  {
    created: "10/12/2025",
    name: "Marie",
    phone: "06 78 45 32 10",
    group: "Non Classé",
    lastSms: "05/01/2026",
    source: "Import CSV",
  },
  {
    created: "05/12/2025",
    name: "Pierre",
    phone: "06 43 31 16 72",
    group: "Non Classé",
    lastSms: "12/12/2025",
    source: "Import CSV",
  },
  {
    created: "28/02/2026",
    name: "Laura",
    phone: "06 60 31 10 90",
    group: "Clients VIP",
    lastSms: "10/02/2026",
    source: "Formulaire",
    tag: "VIP",
  },
  {
    created: "09/01/2026",
    name: "Antoine",
    phone: "06 44 25 78 01",
    group: "Clients Fidèles",
    lastSms: "03/02/2026",
    source: "Formulaire",
    tag: "Fidèles",
  },
  {
    created: "12/12/2025",
    name: "Nicolas",
    phone: "06 35 29 78 83",
    group: "Non Classé",
    lastSms: "01/02/2026",
    source: "Formulaire",
  },
  {
    created: "04/12/2025",
    name: "Thomas",
    phone: "06 29 38 75 51",
    group: "Non Classé",
    lastSms: "16/12/2025",
    source: "Formulaire",
  },
];

function Pager() {
  const [page, setPage] = useState(0);
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => setPage(i)}
          className={cn(
            "grid h-[34px] w-[34px] place-items-center rounded-[10px] border border-slate-200 bg-white text-sm font-extrabold text-slate-700",
            page === i &&
              "border-[#2f6fed] bg-[#2f6fed] text-white shadow-[0_10px_18px_rgba(47,111,237,0.25)]",
          )}
        >
          {i + 1}
        </button>
      ))}
      <button
        type="button"
        className="grid h-[34px] w-[34px] place-items-center rounded-[10px] border border-slate-200 bg-white text-sm font-black text-slate-700"
      >
        ›
      </button>
    </div>
  );
}

type ContactsProps = {
  onAddContact: () => void;
  onRowClick: (row: ContactRowData) => void;
};

export function ContactsView({ onAddContact, onRowClick }: ContactsProps) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="m-0 text-[34px] font-extrabold tracking-tight text-slate-900">
            Contacts
          </h1>
          <SearchBar placeholder="Rechercher un contact..." />
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-3">
          <ProtoBtn>Importer</ProtoBtn>
          <ProtoBtn primary onClick={onAddContact}>
            <PlusIcon />
            Ajouter un contact
          </ProtoBtn>
        </div>
      </div>

      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
        <div className="min-h-0 overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-[15px]">
            <thead>
              <tr>
                <th className="w-40 whitespace-nowrap border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                  Date de création
                </th>
                <th className="w-44 whitespace-nowrap border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                  Prénom
                </th>
                <th className="w-52 whitespace-nowrap border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                  Téléphone
                </th>
                <th className="w-56 whitespace-nowrap border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                  Groupe
                </th>
                <th className="w-52 whitespace-nowrap border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                  Dernier SMS envoyé
                </th>
                <th className="w-44 whitespace-nowrap border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {CONTACT_ROWS.map((row) => (
                <tr
                  key={row.name + row.phone}
                  className="cursor-pointer hover:bg-indigo-50/60"
                  tabIndex={0}
                  role="button"
                  onClick={() => onRowClick(row)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }}
                >
                  <td className="whitespace-nowrap border-b border-slate-100 px-[18px] py-3.5 text-slate-900">
                    {row.created}
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-[18px] py-3.5 font-extrabold text-slate-900">
                    {row.name}
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-[18px] py-3.5 text-slate-900">
                    {row.phone}
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-[18px] py-3.5 text-slate-900">
                    {row.tag ? <span className={tagCls}>{row.group}</span> : row.group}
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-[18px] py-3.5 text-slate-900">
                    {row.lastSms}
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-[18px] py-3.5 text-slate-900">
                    {row.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-600">
          <span>10 contacts affichés sur 64</span>
          <Pager />
        </div>
      </section>
    </>
  );
}

type GroupesProps = { onCreateGroup: () => void };

export function GroupesView({ onCreateGroup }: GroupesProps) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[34px] font-extrabold tracking-tight text-slate-900">
            Groupes
          </h1>
          <SearchBar placeholder="Rechercher un groupe..." />
        </div>
        <div className="mt-0.5 flex flex-wrap gap-3">
          <ProtoBtn>Importer</ProtoBtn>
          <ProtoBtn primary onClick={onCreateGroup}>
            <PlusIcon />
            Créer un groupe
          </ProtoBtn>
        </div>
      </div>
      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
        <div className="overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-[15px]">
            <thead>
              <tr>
                <th className="border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold">
                  Nom du groupe
                </th>
                <th className="border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold">
                  Contacts
                </th>
                <th className="border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold">
                  Dernière campagne
                </th>
                <th className="border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold">
                  Date de création
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Clients VIP", "32", "28/02/2026", "02/12/2025"],
                ["Clients Fidèles", "48", "03/02/2026", "15/01/2026"],
                ["Nouveaux inscrits", "29", "—", "19/01/2026"],
                ["Prospects", "57", "20/02/2026", "05/12/2025"],
                ["Abonnés newsletter", "43", "13/12/2025", "12/12/2025"],
              ].map(([name, c, camp, d]) => (
                <tr key={name}>
                  <td className="border-b border-slate-100 px-[18px] py-3.5 font-extrabold text-slate-900">
                    {name}
                  </td>
                  <td className="border-b border-slate-100 px-[18px] py-3.5">{c}</td>
                  <td className="border-b border-slate-100 px-[18px] py-3.5">{camp}</td>
                  <td className="border-b border-slate-100 px-[18px] py-3.5">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-3.5 py-3 text-sm font-semibold text-slate-600">
          <span>5 groupes affichés sur 18</span>
          <Pager />
        </div>
      </section>
    </>
  );
}

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

type CreditsProps = { onBuyCredits: () => void; onInvoiceClick: (id: string) => void };

export function CreditsView({ onBuyCredits, onInvoiceClick }: CreditsProps) {
  return (
    <div className="relative flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-[40px] font-black tracking-tight text-slate-900">
          Crédit SMS
        </div>
        <ProtoBtn primary onClick={onBuyCredits}>
          <PlusIcon />
          Ajouter des crédits
        </ProtoBtn>
      </div>

      <div className="grid grid-cols-3 gap-3.5 max-[1100px]:grid-cols-1">
        <div className="rounded-2xl border border-slate-300/40 bg-white px-4 py-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)] max-w-[320px]">
          <div className="text-sm font-extrabold text-slate-500">Crédits restants</div>
          <div className="mt-1 text-[34px] font-black text-slate-900">490</div>
        </div>
        <div className="rounded-2xl border border-slate-300/40 bg-white px-4 py-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-500/90">
            Informations de facturation
          </div>
          <div className="mt-2.5 text-base font-black">BONNE MONTMARTRE SARL</div>
          <div className="mt-2.5 text-sm font-semibold leading-relaxed text-slate-600">
            56 RUE LABAT
            <br />
            75018 PARIS
          </div>
          <ProtoBtn green className="mt-3 text-sm">
            Modifier
          </ProtoBtn>
        </div>
        <div className="rounded-2xl border border-slate-300/40 bg-white px-4 py-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <div className="text-[11px] font-black text-transparent">.</div>
          <div className="mt-2.5 text-[28px] font-black tracking-wide text-slate-800">
            VISA
          </div>
          <div className="mt-2.5 text-sm font-semibold leading-relaxed text-slate-600">
            <strong>Visa :</strong> 8003
            <br />
            <strong>Date d&apos;expiration :</strong> 12/28
          </div>
          <ProtoBtn green className="mt-3 text-sm">
            Modifier
          </ProtoBtn>
        </div>
      </div>

      <div className="mt-2 text-base font-black text-slate-900">Historique d&apos;achats</div>
      <p className="-mt-1 text-[13px] font-bold text-slate-500">
        Retrouve ici tes achats et télécharge les factures.
      </p>

      <div className="mt-1 overflow-hidden rounded-2xl border border-slate-300/40 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-400/10">
              <th className="px-4 py-3.5 text-left font-extrabold">Date</th>
              <th className="px-4 py-3.5 text-left font-extrabold">Pack(s) acheté(s)</th>
              <th className="w-[110px] px-4 py-3.5 text-left font-extrabold">Prix</th>
              <th className="w-[140px] px-4 py-3.5 text-left font-extrabold">Statut</th>
              <th className="w-[110px] px-4 py-3.5 text-left font-extrabold">Crédit SMS</th>
              <th className="w-[170px] px-4 py-3.5 text-right font-extrabold">PDF</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["28/02/2026", "Starter", "15 €", "pay", "150", "FAC-2026-0006"],
              ["12/02/2026", "Business", "65 €", "pay", "5 000", "FAC-2026-0005"],
              ["02/01/2026", "Pro", "120 €", "pay", "10 000", "FAC-2026-0004"],
              ["15/12/2025", "Business", "65 €", "ref", "5 000", "FAC-2025-0019"],
            ].map(([date, pack, price, st, cred, fac]) => (
              <tr key={fac} className="border-t border-slate-300/25 text-[14px]">
                <td className="px-4 py-3.5">{date}</td>
                <td className="px-4 py-3.5 font-bold">{pack}</td>
                <td className="px-4 py-3.5">{price}</td>
                <td className="px-4 py-3.5">
                  {st === "pay" ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-500/12 px-2.5 py-1 text-[13px] font-black text-emerald-800">
                      Payée
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-400/15 px-2.5 py-1 text-[13px] font-black text-slate-700">
                      Remboursée
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5">{cred}</td>
                <td className="px-4 py-3.5 text-right">
                  <ProtoBtn
                    className="h-9 px-3 text-sm"
                    onClick={() => onInvoiceClick(fac)}
                    data-dl={fac}
                  >
                    Télécharger facture
                  </ProtoBtn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-300/25 px-3.5 py-3">
          <span className="text-sm font-extrabold text-slate-500">
            6 factures disponibles
          </span>
          <Pager />
        </div>
      </div>
    </div>
  );
}

type StatsProps = {
  chipLabel: string;
  statsOpen: boolean;
  setStatsOpen: (v: boolean) => void;
  dateFrom: string;
  dateTo: string;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
  applyRange: () => void;
};

export function StatistiquesView({
  chipLabel,
  statsOpen,
  setStatsOpen,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  applyRange,
}: StatsProps) {
  const chipRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const positionPop = useCallback(() => {
    const chip = chipRef.current;
    const pop = popRef.current;
    if (!chip || !pop) return;
    const r = chip.getBoundingClientRect();
    const popW = pop.offsetWidth || 360;
    const margin = 10;
    let left = Math.min(window.innerWidth - popW - margin, r.right - popW);
    left = Math.max(margin, left);
    const top = r.bottom + 12;
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  }, []);

  useEffect(() => {
    if (!statsOpen) return;
    positionPop();
    const onResize = () => positionPop();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [statsOpen, positionPop]);

  useEffect(() => {
    if (!statsOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        popRef.current?.contains(t) ||
        chipRef.current?.contains(t)
      ) {
        return;
      }
      setStatsOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [statsOpen, setStatsOpen]);

  return (
    <div className="relative">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[34px] font-extrabold tracking-tight text-slate-900">
            Statistiques
          </h1>
          <SearchBar placeholder="Filtrer (ex : Février 2026)..." />
        </div>
        <div className="mt-0.5 flex flex-wrap gap-3">
          <button
            ref={chipRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setStatsOpen(!statsOpen);
            }}
            className={cn(
              "h-11 cursor-pointer rounded-[14px] border border-slate-200 bg-white px-4 text-[15px] font-bold text-slate-700 shadow-[0_10px_22px_rgba(15,23,42,0.08)]",
              chipLabel !== "Ce mois" && "border-blue-200 bg-blue-50/50",
            )}
          >
            {chipLabel}
          </button>
          <ProtoBtn primary>Exporter</ProtoBtn>
        </div>
      </div>

      {statsOpen && (
        <div
          ref={popRef}
          role="dialog"
          aria-hidden={false}
          className="fixed z-50 w-[360px] rounded-[18px] border border-slate-300/40 bg-white p-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.20)]"
        >
          <div className="mb-2.5 flex items-center justify-between">
            <div className="text-xl font-black text-slate-900">
              Choisir une période
            </div>
            <button
              type="button"
              className="grid h-[42px] w-[42px] place-items-center rounded-[14px] border border-slate-300/40 bg-white text-lg font-black"
              onClick={() => setStatsOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 rounded-2xl border border-slate-300/40 bg-slate-50/90 p-3">
              <span className="text-base font-black text-slate-600">Du</span>
              <input
                type="date"
                className="h-[46px] rounded-[14px] border border-slate-300/40 bg-white px-3 text-base font-black"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5 rounded-2xl border border-slate-300/40 bg-slate-50/90 p-3">
              <span className="text-base font-black text-slate-600">Au</span>
              <input
                type="date"
                className="h-[46px] rounded-[14px] border border-slate-300/40 bg-white px-3 text-base font-black"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </label>
          </div>
          <div className="mt-3 flex justify-end gap-2.5">
            <ProtoBtn onClick={() => setStatsOpen(false)}>Annuler</ProtoBtn>
            <ProtoBtn
              primary
              onClick={() => {
                applyRange();
                setStatsOpen(false);
              }}
            >
              Appliquer
            </ProtoBtn>
          </div>
        </div>
      )}

      <div className="mt-3.5 grid grid-cols-4 gap-3.5 max-[1100px]:grid-cols-2">
        {[
          ["SMS envoyés", "1 240", "sur 30 jours"],
          ["Taux délivré", "97%", "moyenne"],
          ["Désinscriptions", "14", "STOP"],
          ["Crédits consommés", "1 240", "équivalent SMS"],
        ].map(([label, val, hint]) => (
          <div
            key={label}
            className="min-h-[92px] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
          >
            <div className="text-[13px] font-bold text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-black text-slate-900">{val}</div>
            <div className="mt-1.5 text-xs font-semibold text-slate-600">{hint}</div>
          </div>
        ))}
      </div>

      <div className="mt-3.5 grid grid-cols-[1.2fr_0.8fr] gap-3.5 max-[1100px]:grid-cols-1">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <h2 className="m-0 text-base font-black text-slate-900">
            Évolution des campagnes
          </h2>
          <div className="mt-2.5 grid h-[220px] place-items-center rounded-[14px] border border-dashed border-slate-200 bg-slate-50 text-sm font-bold text-slate-500">
            Graphique (mock)
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <h2 className="m-0 text-base font-black text-slate-900">Top groupes</h2>
          <div className="mt-2 overflow-auto">
            <table className="w-full text-[15px]">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-extrabold">
                    Groupe
                  </th>
                  <th className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-extrabold">
                    SMS
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Clients Fidèles", "520"],
                  ["Prospects", "410"],
                  ["Clients VIP", "310"],
                ].map(([g, n]) => (
                  <tr key={g}>
                    <td className="border-b border-slate-100 px-3 py-3 font-extrabold">
                      {g}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ParametresView() {
  const inp =
    "h-11 w-full rounded-[14px] border border-slate-300/50 bg-white px-3.5 text-[15px] font-bold text-slate-900 outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]";
  const lbl = "mb-1.5 block text-xs font-black text-slate-600";
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[34px] font-extrabold text-slate-900">Paramètres</h1>
          <p className="mt-1.5 text-slate-600">
            Gère les informations de ton compte et ta facturation.
          </p>
        </div>
        <div className="flex gap-3">
          <ProtoBtn>Annuler</ProtoBtn>
          <ProtoBtn primary>Enregistrer</ProtoBtn>
        </div>
      </div>

      <div className="grid grid-cols-[1.2fr_0.8fr] items-start gap-4 max-[1100px]:grid-cols-1">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <h2 className="m-0 text-base font-black text-slate-900">Compte</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
            <div>
              <label className={lbl}>Prénom</label>
              <input className={inp} defaultValue="Sophie" placeholder="Ex : Patrick" />
            </div>
            <div>
              <label className={lbl}>Nom</label>
              <input className={inp} defaultValue="Durand" placeholder="Ex : Azevedo" />
            </div>
            <div className="col-span-2 max-[600px]:col-span-1">
              <label className={lbl}>Email</label>
              <input
                className={inp}
                defaultValue="Sophie.durand@gmail.com"
                placeholder="email@domaine.fr"
              />
            </div>
            <div className="col-span-2 max-[600px]:col-span-1">
              <label className={lbl}>Téléphone</label>
              <input
                className={inp}
                defaultValue="06 12 34 56 78"
                placeholder="06 00 00 00 00"
              />
            </div>
          </div>

          <div className="my-4 h-px bg-slate-300/40" />

          <h2 className="m-0 text-base font-black text-slate-900">Entreprise</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
            <div className="col-span-2">
              <label className={lbl}>Nom de l&apos;entreprise</label>
              <input className={inp} defaultValue="SMSClient" />
            </div>
            <div>
              <label className={lbl}>SIRET</label>
              <input className={inp} defaultValue="912 345 678 00019" />
            </div>
            <div>
              <label className={lbl}>TVA</label>
              <input className={inp} defaultValue="FRXX123456789" />
            </div>
          </div>

          <div className="my-4 h-px bg-slate-300/40" />

          <h2 className="m-0 text-base font-black text-slate-900">
            Adresse de facturation
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
            <div className="col-span-2">
              <label className={lbl}>Adresse</label>
              <input className={inp} defaultValue="56 Rue Labat" />
            </div>
            <div>
              <label className={lbl}>Code postal</label>
              <input className={inp} defaultValue="75018" />
            </div>
            <div>
              <label className={lbl}>Ville</label>
              <input className={inp} defaultValue="Paris" />
            </div>
            <div>
              <label className={lbl}>Pays</label>
              <input className={inp} defaultValue="France" />
            </div>
            <div>
              <label className={lbl}>Contact facturation</label>
              <input className={inp} defaultValue="facturation@smsclient.fr" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <h2 className="m-0 text-base font-black text-slate-900">Plan & sécurité</h2>
            <div className="mt-3 grid gap-2.5">
              <div className="flex justify-between gap-3 text-sm font-extrabold">
                <span className="text-slate-600">Abonnement</span>
                <strong>Pay-as-you-go</strong>
              </div>
              <div className="flex justify-between gap-3 text-sm font-extrabold">
                <span className="text-slate-600">Mode de paiement</span>
                <strong>Carte (VISA •••• 8003)</strong>
              </div>
              <div className="flex justify-between gap-3 text-sm font-extrabold">
                <span className="text-slate-600">2FA</span>
                <BadgeSent>Activé</BadgeSent>
              </div>
            </div>
            <div className="mt-3.5 flex flex-wrap gap-2.5">
              <ProtoBtn>Modifier la carte</ProtoBtn>
              <ProtoBtn>Gérer la sécurité</ProtoBtn>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <h2 className="m-0 text-base font-black text-slate-900">Préférences</h2>
            <div className="mt-3 grid gap-2.5">
              <label className="flex items-center gap-2.5 text-sm font-extrabold text-slate-600">
                <input type="checkbox" defaultChecked className="h-[18px] w-[18px]" />
                Recevoir les notifications email (factures, alertes)
              </label>
              <label className="flex items-center gap-2.5 text-sm font-extrabold text-slate-600">
                <input type="checkbox" defaultChecked className="h-[18px] w-[18px]" />
                Résumé mensuel des campagnes
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <h2 className="m-0 text-base font-black text-slate-900">Zone sensible</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              <ProtoBtn>Exporter mes données</ProtoBtn>
              <ProtoBtn className="border-rose-200 text-rose-700">Supprimer le compte</ProtoBtn>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

type DecoProps = { onBackContacts: () => void };

export function DeconnexionView({ onBackContacts }: DecoProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
      <h2 className="m-0 text-base font-black text-slate-900">Déconnexion</h2>
      <p className="m-0 mt-2 font-semibold leading-relaxed text-slate-600">
        Ceci est un prototype. Clique sur <strong>Contacts</strong> pour revenir.
      </p>
      <div className="mt-3">
        <ProtoBtn primary onClick={onBackContacts}>
          Retour
        </ProtoBtn>
      </div>
    </div>
  );
}
