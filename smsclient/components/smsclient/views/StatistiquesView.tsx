"use client";

import { SearchBar } from "@/components/smsclient/Shell";
import { ProtoBtn } from "@/components/smsclient/ui";
import { cn } from "@/lib/cn";
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
  } = props;
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
          <ProtoBtn primary>Exporter</ProtoBtn>
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
          <h2 className="m-0 text-base font-black text-slate-900">Évolution des campagnes</h2>
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
                    <td className="border-b border-slate-100 px-3 py-3 font-extrabold">{g}</td>
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
