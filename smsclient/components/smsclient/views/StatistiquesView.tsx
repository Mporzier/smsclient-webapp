"use client";

import {
  UnsubscribedContactsModal,
  type UnsubscribedContactRow,
} from "@/components/smsclient/modals/UnsubscribedContactsModal";
import { ProtoBtn } from "@/components/smsclient/ui";
import { SectionGuideCard } from "@/components/smsclient/SectionGuideCard";
import { cn } from "@/lib/cn";
import { formatStatsNumber } from "@/lib/supabase/statistics";
import {
  formatStatsPeriodLabel,
  STATS_PERIOD_PRESET_LABELS,
  type StatsPeriodPreset,
} from "@/lib/statsDateRanges";
import type { StatisticsSnapshot } from "@/lib/types/statistics";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarRange,
  CheckCircle2,
  ChartNoAxesCombined,
  Clock3,
  CircleCheck,
  Coins,
  Info,
  Loader2,
  Send,
  TriangleAlert,
  UserMinus,
  X,
  type LucideIcon,
} from "lucide-react";

type KpiConfig = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

const PERIOD_PRESETS = (
  Object.entries(STATS_PERIOD_PRESET_LABELS) as [
    Exclude<StatsPeriodPreset, "custom">,
    string
  ][]
).map(([id, label]) => ({ id, label }));

const quickPresetBtnCls = (active: boolean) =>
  cn(
    "w-full cursor-pointer rounded-xl border px-3 py-2.5 text-left text-[13px] font-bold transition-colors",
    active
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50"
  );

type StatsProps = {
  statsPeriod: StatsPeriodPreset;
  appliedDateFrom: string;
  appliedDateTo: string;
  onSelectPeriod: (preset: Exclude<StatsPeriodPreset, "custom">) => void;
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
  unsubscribedContacts?: UnsubscribedContactRow[];
};

export function StatistiquesView(props: StatsProps) {
  const {
    statsPeriod,
    appliedDateFrom,
    appliedDateTo,
    onSelectPeriod,
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
    unsubscribedContacts = [],
  } = props;
  const periodPickerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [unsubModalOpen, setUnsubModalOpen] = useState(false);
  const [chartWidth, setChartWidth] = useState(1000);

  const periodLabel = formatStatsPeriodLabel(
    statsPeriod,
    appliedDateFrom,
    appliedDateTo
  );

  const showGuide =
    !loading &&
    !error &&
    data.kpis.smsSent === 0 &&
    data.campaignSeries.length === 0;

  const kpis: KpiConfig[] = [
    {
      label: "SMS envoyés",
      value: formatStatsNumber(data.kpis.smsSent),
      hint: "campagnes envoyées sur la période",
      icon: Send,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Taux délivré",
      value:
        data.kpis.deliveryRate === null
          ? "—"
          : `${new Intl.NumberFormat("fr-FR", {
              maximumFractionDigits: 1,
            }).format(data.kpis.deliveryRate)}%`,
      hint: "ratio envoyé / (envoyé + échec)",
      icon: CircleCheck,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Désinscriptions",
      value: formatStatsNumber(data.kpis.stopCount),
      hint: "contacts en statut STOP",
      icon: UserMinus,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
    },
    {
      label: "Crédits consommés",
      value: formatStatsNumber(data.kpis.creditsConsumed),
      hint: "sur la période sélectionnée",
      icon: Coins,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ];

  const chartMaxValue =
    data.campaignSeries.reduce(
      (max, p) => Math.max(max, p.sent, p.failed, p.scheduled),
      0
    ) || 1;
  const chartHeight = 380;
  const chartPadding = { top: 18, right: 14, bottom: 34, left: 38 };
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const pointCount = data.campaignSeries.length;
  const xFor = (idx: number) =>
    pointCount <= 1
      ? chartPadding.left + plotWidth / 2
      : chartPadding.left + (idx / (pointCount - 1)) * plotWidth;
  const yFor = (value: number) =>
    chartPadding.top + (1 - value / chartMaxValue) * plotHeight;
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((ratio) => {
    const value = Math.round(chartMaxValue * ratio);
    return { value, y: yFor(value) };
  });
  const sentPath = data.campaignSeries
    .map((point, idx) => `${xFor(idx)},${yFor(point.sent)}`)
    .join(" ");
  const failedPath = data.campaignSeries
    .map((point, idx) => `${xFor(idx)},${yFor(point.failed)}`)
    .join(" ");
  const scheduledPath = data.campaignSeries
    .map((point, idx) => `${xFor(idx)},${yFor(point.scheduled)}`)
    .join(" ");

  const positionPop = useCallback(() => {
    const anchor = periodPickerRef.current;
    const pop = popRef.current;
    if (!anchor || !pop) return;
    const r = anchor.getBoundingClientRect();
    const popW = pop.offsetWidth || 560;
    const margin = 10;
    let left = Math.min(window.innerWidth - popW - margin, r.right - popW);
    left = Math.max(margin, left);
    pop.style.left = `${left}px`;
    pop.style.top = `${r.bottom + 12}px`;
  }, []);

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    const updateWidth = () => {
      setChartWidth(Math.max(520, Math.floor(el.clientWidth)));
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [data.campaignSeries.length]);

  useEffect(() => {
    if (!statsOpen) return;
    setDateFrom(appliedDateFrom);
    setDateTo(appliedDateTo);
  }, [statsOpen, appliedDateFrom, appliedDateTo, setDateFrom, setDateTo]);

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
      if (popRef.current?.contains(t) || periodPickerRef.current?.contains(t)) {
        return;
      }
      setStatsOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [statsOpen, setStatsOpen]);

  return (
    <div className="relative -m-4 flex min-h-[calc(100dvh-60px)] w-full flex-col p-3 md:-m-5 md:p-4">
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-4 transition-opacity duration-200",
          loading && "pointer-events-none select-none opacity-45"
        )}
        aria-hidden={loading}
      >
        {showGuide && (
          <SectionGuideCard section="statistiques" className="shrink-0" />
        )}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2.5">
            <button
              ref={periodPickerRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setStatsOpen(!statsOpen);
              }}
              className={cn(
                "flex h-11 cursor-pointer items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 text-[14px] font-bold text-slate-700 shadow-[0_10px_22px_rgba(15,23,42,0.08)] transition-colors hover:border-slate-300 hover:bg-slate-50",
                statsOpen && "border-blue-200 bg-blue-50/50 text-blue-700",
                statsPeriod === "custom" &&
                  !statsOpen &&
                  "border-blue-200 bg-blue-50/50"
              )}
              aria-expanded={statsOpen}
              aria-haspopup="dialog"
            >
              <CalendarRange
                className="h-[18px] w-[18px] shrink-0 text-blue-600"
                aria-hidden
              />
              {periodLabel}
            </button>
            <ProtoBtn primary onClick={onExport}>
              Exporter
            </ProtoBtn>
        </div>

        <div className="grid shrink-0 grid-cols-4 gap-3 max-[1200px]:grid-cols-2">
          {kpis.map((kpi) => {
            const isUnsub = kpi.label === "Désinscriptions";
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="flex min-h-[108px] items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
              >
                <span
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-full",
                    kpi.iconBg,
                    kpi.iconColor
                  )}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-500">
                    {kpi.label}
                  </div>
                  <div className="mt-1.5 text-3xl font-black text-slate-900">
                    {kpi.value}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-600">
                    {kpi.hint}
                  </div>
                </div>
                {isUnsub && (
                  <button
                    type="button"
                    onClick={() => setUnsubModalOpen(true)}
                    className="shrink-0 cursor-pointer rounded-[18px] border border-blue-400/30 bg-gradient-to-b from-blue-500 to-blue-600 px-3 py-3.5 text-center text-[11px] font-black leading-tight text-white shadow-[0_10px_24px_rgba(37,99,235,0.38)] transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-[0_12px_28px_rgba(37,99,235,0.48)] active:scale-[0.97]"
                  >
                    Voir la liste
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.9fr)]">
          <div className="flex min-h-[min(520px,calc(100dvh-300px))] min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)] md:p-5">
            <h2 className="m-0 shrink-0 text-lg font-black text-slate-900">
              Évolution des campagnes
            </h2>
            <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-[14px] border border-slate-200 bg-slate-50 p-3 md:p-4">
              {data.campaignSeries.length === 0 && (
                <div className="flex min-h-[min(380px,calc(100dvh-340px))] flex-1 flex-col items-center justify-center gap-3.5 rounded-xl border border-dashed border-slate-200 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/80 px-6 text-center">
                  <ChartNoAxesCombined
                    className="h-16 w-16 text-blue-400/70"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <div className="max-w-[300px]">
                    <p className="text-m font-bold text-slate-500">
                      Aucune campagne sur cette période
                    </p>
                  </div>
                </div>
              )}
              {data.campaignSeries.length > 0 && (
                <div className="flex min-h-0 flex-1 flex-col gap-3">
                  <div
                    ref={chartContainerRef}
                    className="min-h-[min(380px,calc(100dvh-340px))] flex-1 rounded-xl border border-slate-200 bg-white p-2 md:p-3"
                  >
                    <svg
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      className="h-full min-h-[320px] w-full"
                      aria-label="Graphique de l'évolution des campagnes"
                      role="img"
                    >
                      {ticks.map((tick, i) => (
                        <g key={`${tick.value}-${i}`}>
                          <line
                            x1={chartPadding.left}
                            y1={tick.y}
                            x2={chartWidth - chartPadding.right}
                            y2={tick.y}
                            className="stroke-slate-200"
                            strokeDasharray={i === ticks.length - 1 ? undefined : "4 4"}
                          />
                          <text
                            x={chartPadding.left - 8}
                            y={tick.y + 3}
                            textAnchor="end"
                            className="fill-slate-400 text-[11px] font-bold"
                          >
                            {formatStatsNumber(tick.value)}
                          </text>
                        </g>
                      ))}

                      <polyline
                        fill="none"
                        points={sentPath}
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        fill="none"
                        points={failedPath}
                        stroke="#f43f5e"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        fill="none"
                        points={scheduledPath}
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {data.campaignSeries.map((point, idx) => (
                        <g key={point.label}>
                          <circle cx={xFor(idx)} cy={yFor(point.sent)} r="4" fill="#10b981" />
                          <circle cx={xFor(idx)} cy={yFor(point.failed)} r="4" fill="#f43f5e" />
                          <circle cx={xFor(idx)} cy={yFor(point.scheduled)} r="4" fill="#3b82f6" />
                          <text
                            x={xFor(idx)}
                            y={chartHeight - 12}
                            textAnchor="middle"
                            className="fill-slate-500 text-[11px] font-bold"
                          >
                            {point.label}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] font-bold text-slate-600">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                      Envoyés
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1">
                      <TriangleAlert className="h-3.5 w-3.5 text-rose-600" aria-hidden />
                      Échecs
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1">
                      <Clock3 className="h-3.5 w-3.5 text-blue-600" aria-hidden />
                      Programmés
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex min-h-[min(520px,calc(100dvh-300px))] min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)] md:p-5">
            <h2 className="m-0 shrink-0 text-lg font-black text-slate-900">
              Top groupes
            </h2>
            <div className="mt-3 min-h-0 flex-1 overflow-auto">
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
                  {data.topGroups.length === 0 && (
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

        <div className="mt-auto flex shrink-0 items-start gap-2.5 rounded-xl border border-slate-200/80 bg-slate-100/70 px-3.5 py-3">
          <Info
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
            strokeWidth={2.25}
            aria-hidden
          />
          <p className="text-xs font-semibold leading-relaxed text-slate-500">
            Les statistiques sont mises à jour en temps réel. Les données
            peuvent légèrement varier.
          </p>
        </div>
      </div>

      {statsOpen && (
        <div
          ref={popRef}
          role="dialog"
          aria-label="Choisir une période"
          className="fixed z-50 w-[min(560px,calc(100vw-20px))] overflow-hidden rounded-[18px] border border-slate-300/40 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.20)]"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="text-base font-black text-slate-900">Période</div>
            <button
              type="button"
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-slate-300/40 bg-white transition-colors hover:bg-slate-50"
              aria-label="Fermer"
              onClick={() => setStatsOpen(false)}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row">
            <div className="min-w-0 flex-1 p-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 rounded-2xl border border-slate-300/40 bg-slate-50/90 p-3">
                  <span className="text-sm font-black text-slate-600">Du</span>
                  <input
                    type="date"
                    className="h-[46px] rounded-[14px] border border-slate-300/40 bg-white px-3 text-base font-black"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1.5 rounded-2xl border border-slate-300/40 bg-slate-50/90 p-3">
                  <span className="text-sm font-black text-slate-600">Au</span>
                  <input
                    type="date"
                    className="h-[46px] rounded-[14px] border border-slate-300/40 bg-white px-3 text-base font-black"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </label>
              </div>
              <div className="mt-3 flex justify-end gap-2">
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
            <div className="border-t border-slate-200 bg-slate-50/60 p-3 sm:w-[188px] sm:border-t-0 sm:border-l">
              <p className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                Raccourcis
              </p>
              <div className="flex flex-col gap-1">
                {PERIOD_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectPeriod(preset.id)}
                    className={quickPresetBtnCls(statsPeriod === preset.id)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/[0.06] backdrop-blur-[1px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label="Chargement des statistiques"
        >
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
            <Loader2
              className="h-5 w-5 shrink-0 animate-spin text-blue-600"
              aria-hidden
            />
            <span className="text-sm font-bold text-slate-700">
              Chargement des statistiques…
            </span>
          </div>
        </div>
      )}

      <UnsubscribedContactsModal
        open={unsubModalOpen}
        contacts={unsubscribedContacts}
        onClose={() => setUnsubModalOpen(false)}
      />
    </div>
  );
}
