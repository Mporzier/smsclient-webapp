"use client";

import { SearchBar } from "@/components/smsclient/Shell";
import { ProtoBtn } from "@/components/smsclient/ui";
import { cn } from "@/lib/cn";
import { formatStatsNumber } from "@/lib/supabase/statistics";
import type { StatisticsSnapshot } from "@/lib/types/statistics";
import { useCallback, useEffect, useRef } from "react";

type StatsProps = {
  chipLabel: string;
  statsOpen: boolean;
  setStatsOpen: (v: boolean) => void;
  dateFrom: string;
  dateTo: string;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
  applyRange: () => void;
  loading: boolean;
  error: string | null;
  data: StatisticsSnapshot;
  onExport: () => void;
};

export function StatistiquesView(props: StatsProps) {
  const {
    chipLabel,
    statsOpen,
    setStatsOpen,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    applyRange,
    loading,
    error,
    data,
    onExport,
  } = props;
  const chipRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const kpis = [
    {
      label: "SMS envoyés",
      value: formatStatsNumber(data.kpis.smsSent),
      hint: "campagnes envoyées sur la période",
    },
    {
      label: "Taux délivré",
      value:
        data.kpis.deliveryRate === null
          ? "—"
          : `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(data.kpis.deliveryRate)}%`,
      hint: "ratio envoyé / (envoyé + échec)",
    },
    {
      label: "Désinscriptions",
      value: formatStatsNumber(data.kpis.stopCount),
      hint: "contacts en statut STOP",
    },
    {
      label: "Crédits consommés",
      value: formatStatsNumber(data.kpis.creditsConsumed),
      hint: "sur la période sélectionnée",
    },
  ] as const;

  const maxSeriesValue =
    data.campaignSeries.reduce(
      (max, p) => Math.max(max, p.sent + p.failed + p.scheduled),
      0,
    ) || 1;

  const positionPop = useCallback(() => {
    const chip = chipRef.current;
    const pop = popRef.current;
    if (!chip || !pop) return;
    const r = chip.getBoundingClientRect();
    const popW = pop.offsetWidth || 360;
    const margin = 10;
    let left = Math.min(window.innerWidth - popW - margin, r.right - popW);
    left = Math.max(margin, left);
    pop.style.left = `${left}px`;
    pop.style.top = `${r.bottom + 12}px`;
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
      if (popRef.current?.contains(t) || chipRef.current?.contains(t)) return;
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
          <ProtoBtn primary onClick={onExport}>
            Exporter
          </ProtoBtn>
        </div>
      </div>

      {statsOpen && (
        <div
          ref={popRef}
          role="dialog"
          className="fixed z-50 w-[360px] rounded-[18px] border border-slate-300/40 bg-white p-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.20)]"
        >
          <div className="mb-2.5 flex items-center justify-between">
            <div className="text-xl font-black text-slate-900">Choisir une période</div>
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
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="min-h-[92px] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
          >
            <div className="text-[13px] font-bold text-slate-500">{kpi.label}</div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {loading ? "…" : kpi.value}
            </div>
            <div className="mt-1.5 text-xs font-semibold text-slate-600">
              {kpi.hint}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3.5 grid grid-cols-[1.2fr_0.8fr] gap-3.5 max-[1100px]:grid-cols-1">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <h2 className="m-0 text-base font-black text-slate-900">Évolution des campagnes</h2>
          <div className="mt-2.5 rounded-[14px] border border-slate-200 bg-slate-50 p-3">
            {loading && (
              <div className="grid h-[200px] place-items-center text-sm font-bold text-slate-500">
                Chargement des statistiques…
              </div>
            )}
            {!loading && data.campaignSeries.length === 0 && (
              <div className="grid h-[200px] place-items-center text-sm font-bold text-slate-500">
                Aucune campagne sur cette période.
              </div>
            )}
            {!loading && data.campaignSeries.length > 0 && (
              <div className="space-y-2">
                {data.campaignSeries.map((point) => {
                  const total = point.sent + point.failed + point.scheduled;
                  const sentWidth = `${(point.sent / maxSeriesValue) * 100}%`;
                  const failedWidth = `${(point.failed / maxSeriesValue) * 100}%`;
                  const scheduledWidth = `${(point.scheduled / maxSeriesValue) * 100}%`;
                  return (
                    <div key={point.label} className="grid grid-cols-[52px_1fr_60px] items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">{point.label}</span>
                      <div className="flex h-3 overflow-hidden rounded-full bg-slate-200">
                        <div className="bg-emerald-500/90" style={{ width: sentWidth }} />
                        <div className="bg-rose-500/90" style={{ width: failedWidth }} />
                        <div className="bg-blue-500/80" style={{ width: scheduledWidth }} />
                      </div>
                      <span className="text-right text-xs font-black text-slate-600">
                        {formatStatsNumber(total)}
                      </span>
                    </div>
                  );
                })}
                <div className="pt-1 text-[11px] font-bold text-slate-500">
                  Vert: envoyés · Rouge: échecs · Bleu: programmés
                </div>
              </div>
            )}
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
                    Contacts
                  </th>
                </tr>
              </thead>
              <tbody>
                {!loading && data.topGroups.length === 0 && (
                  <tr>
                    <td
                      className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-500"
                      colSpan={2}
                    >
                      Aucun groupe disponible.
                    </td>
                  </tr>
                )}
                {data.topGroups.map((group) => (
                  <tr key={group.groupName}>
                    <td className="border-b border-slate-100 px-3 py-3 font-extrabold">
                      {group.groupName}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {formatStatsNumber(group.contacts)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {error && (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
          {error}
        </p>
      )}
    </div>
  );
}
