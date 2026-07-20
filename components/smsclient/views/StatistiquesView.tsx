"use client";

import {
  UnsubscribedContactsModal,
  type UnsubscribedContactRow,
} from "@/components/smsclient/modals/UnsubscribedContactsModal";
import {
  brandBtnCls,
  brandBtnPrimaryCls,
} from "@/components/smsclient/modals/modalChrome";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import { formatStatsNumber } from "@/lib/supabase/statistics";
import {
  formatStatsPeriodLabel,
  type StatsPeriodPreset,
} from "@/lib/statsDateRanges";
import type { StatisticsSnapshot } from "@/lib/types/statistics";
import { useEffect, useMemo, useRef, useState } from "react";
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
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";

type KpiConfig = {
  id: "smsSent" | "delivery" | "signups" | "unsub" | "credits";
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

const PERIOD_PRESET_IDS = ["today", "week", "month", "year"] as const;

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
  const { t, locale } = useI18n();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [unsubModalOpen, setUnsubModalOpen] = useState(false);
  const [chartWidth, setChartWidth] = useState(1000);

  const periodLabels = useMemo(
    () => ({
      today: t("stats.period.today"),
      week: t("stats.period.week"),
      month: t("stats.period.month"),
      year: t("stats.period.year"),
    }),
    [t],
  );

  const periodLabel = formatStatsPeriodLabel(
    statsPeriod,
    appliedDateFrom,
    appliedDateTo,
    periodLabels,
  );

  const numberLocale = locale === "en" ? "en-US" : "fr-FR";

  const kpis: KpiConfig[] = [
    {
      id: "smsSent",
      label: t("stats.kpi.smsSent"),
      value: formatStatsNumber(data.kpis.smsSent),
      hint: t("stats.kpi.smsSentHint"),
      icon: Send,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      id: "delivery",
      label: t("stats.kpi.delivery"),
      value:
        data.kpis.deliveryRate === null
          ? "—"
          : `${new Intl.NumberFormat(numberLocale, {
              maximumFractionDigits: 1,
            }).format(data.kpis.deliveryRate)}%`,
      hint: t("stats.kpi.deliveryHint"),
      icon: CircleCheck,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      id: "signups",
      label: t("stats.kpi.signups"),
      value: formatStatsNumber(data.kpis.inscriptionCount),
      hint: t("stats.kpi.signupsHint"),
      icon: UserPlus,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      id: "unsub",
      label: t("stats.kpi.unsub"),
      value: formatStatsNumber(data.kpis.stopCount),
      hint: t("stats.kpi.unsubHint"),
      icon: UserMinus,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
    },
    {
      id: "credits",
      label: t("stats.kpi.credits"),
      value: formatStatsNumber(data.kpis.creditsConsumed),
      hint: t("stats.kpi.creditsHint"),
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

  return (
    <div className="relative -m-4 flex min-h-[calc(100dvh-60px)] w-full flex-col p-3 md:-m-5 md:p-4">
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-4 transition-opacity duration-200",
          loading && "pointer-events-none select-none opacity-45"
        )}
        aria-hidden={loading}
      >
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2.5">
          <Popover open={statsOpen} onOpenChange={setStatsOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className={cn(
                  "h-11 gap-2 rounded-[14px] border-slate-200 bg-white px-4 text-[14px] font-bold text-slate-700 shadow-[0_10px_22px_rgba(15,23,42,0.08)] hover:border-slate-300 hover:bg-slate-50",
                  statsOpen && "border-blue-200 bg-blue-50/50 text-blue-700",
                  statsPeriod === "custom" &&
                    !statsOpen &&
                    "border-blue-200 bg-blue-50/50"
                )}
              >
                <CalendarRange
                  className="h-[18px] w-[18px] shrink-0 text-blue-600"
                  aria-hidden
                />
                {periodLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={12}
              className="w-[min(560px,calc(100vw-20px))] gap-0 overflow-hidden rounded-[18px] p-0"
              aria-label={t("stats.periodAria")}
            >
              <PopoverHeader className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3">
                <PopoverTitle className="text-base font-black text-slate-900">
                  {t("stats.periodTitle")}
                </PopoverTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-xl"
                  aria-label={t("common.cancel")}
                  onClick={() => setStatsOpen(false)}
                >
                  <X className="h-5 w-5" aria-hidden />
                </Button>
              </PopoverHeader>
              <div className="flex flex-col sm:flex-row">
                <div className="min-w-0 flex-1 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5 rounded-2xl border border-slate-300/40 bg-slate-50/90 p-3">
                      <Label
                        htmlFor="stats-date-from"
                        className="text-sm font-black text-slate-600"
                      >
                        {t("stats.from")}
                      </Label>
                      <DatePicker
                        id="stats-date-from"
                        value={dateFrom}
                        onChange={setDateFrom}
                        className="h-[46px] rounded-[14px] text-base font-black"
                        contentClassName="z-[10050]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 rounded-2xl border border-slate-300/40 bg-slate-50/90 p-3">
                      <Label
                        htmlFor="stats-date-to"
                        className="text-sm font-black text-slate-600"
                      >
                        {t("stats.to")}
                      </Label>
                      <DatePicker
                        id="stats-date-to"
                        value={dateTo}
                        onChange={setDateTo}
                        className="h-[46px] rounded-[14px] text-base font-black"
                        contentClassName="z-[10050]"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="lg"
                      className={brandBtnCls}
                      onClick={() => setStatsOpen(false)}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      variant="default"
                      size="lg"
                      className={brandBtnPrimaryCls}
                      onClick={() => {
                        applyRange();
                        setStatsOpen(false);
                      }}
                    >
                      {t("stats.apply")}
                    </Button>
                  </div>
                </div>
                <div className="border-t border-slate-200 bg-slate-50/60 p-3 sm:w-[188px] sm:border-t-0 sm:border-l">
                  <p className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                    {t("stats.shortcuts")}
                  </p>
                  <div className="flex flex-col gap-1">
                    {PERIOD_PRESET_IDS.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onSelectPeriod(id)}
                        className={quickPresetBtnCls(statsPeriod === id)}
                      >
                        {periodLabels[id]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="default"
            size="lg"
            className={brandBtnPrimaryCls}
            onClick={onExport}
          >
            {t("stats.export")}
          </Button>
        </div>

        <div className="grid shrink-0 grid-cols-5 gap-3 max-[1400px]:grid-cols-3 max-[900px]:grid-cols-2">
          {kpis.map((kpi) => {
            const isUnsub = kpi.id === "unsub";
            const Icon = kpi.icon;
            return (
              <Card
                key={kpi.id}
                className="min-h-[108px] py-0 shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
              >
                <CardContent className="flex min-h-[108px] items-center gap-3.5 py-4">
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
                    <Button
                      type="button"
                      size="sm"
                      className="h-auto shrink-0 rounded-[18px] border border-blue-400/30 bg-gradient-to-b from-blue-500 to-blue-600 px-3 py-3.5 text-center text-[11px] font-black leading-tight text-white shadow-[0_10px_24px_rgba(37,99,235,0.38)] hover:from-blue-600 hover:to-blue-700 hover:shadow-[0_12px_28px_rgba(37,99,235,0.48)] active:scale-[0.97]"
                      onClick={() => setUnsubModalOpen(true)}
                    >
                      {t("stats.viewList")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.9fr)]">
          <Card className="flex min-h-[min(520px,calc(100dvh-300px))] min-w-0 flex-col shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <CardHeader>
              <CardTitle className="text-lg font-black text-slate-900">
                {t("stats.chartTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col">
              <div className="mt-0 flex min-h-0 flex-1 flex-col rounded-[14px] border border-slate-200 bg-slate-50 p-3 md:p-4">
                {data.campaignSeries.length === 0 && (
                  <div className="flex min-h-[min(380px,calc(100dvh-340px))] flex-1 flex-col items-center justify-center gap-3.5 rounded-xl border border-dashed border-slate-200 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/80 px-6 text-center">
                    <ChartNoAxesCombined
                      className="h-16 w-16 text-blue-400/70"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    <div className="max-w-[300px]">
                      <p className="text-m font-bold text-slate-500">
                        {t("stats.chartEmpty")}
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
                        aria-label={t("stats.chartAria")}
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
                              strokeDasharray={
                                i === ticks.length - 1 ? undefined : "4 4"
                              }
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
                          stroke="var(--chart-1)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <polyline
                          fill="none"
                          points={failedPath}
                          stroke="var(--destructive)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <polyline
                          fill="none"
                          points={scheduledPath}
                          stroke="var(--chart-2)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {data.campaignSeries.map((point, idx) => (
                          <g key={point.label}>
                            <circle
                              cx={xFor(idx)}
                              cy={yFor(point.sent)}
                              r="4"
                              fill="var(--chart-1)"
                            />
                            <circle
                              cx={xFor(idx)}
                              cy={yFor(point.failed)}
                              r="4"
                              fill="var(--destructive)"
                            />
                            <circle
                              cx={xFor(idx)}
                              cy={yFor(point.scheduled)}
                              r="4"
                              fill="var(--chart-2)"
                            />
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
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="h-auto gap-1.5 border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-slate-600"
                      >
                        <CheckCircle2
                          className="h-3.5 w-3.5 text-emerald-600"
                          aria-hidden
                        />
                        {t("stats.legend.sent")}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="h-auto gap-1.5 border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-slate-600"
                      >
                        <TriangleAlert
                          className="h-3.5 w-3.5 text-rose-600"
                          aria-hidden
                        />
                        {t("stats.legend.failed")}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="h-auto gap-1.5 border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-slate-600"
                      >
                        <Clock3
                          className="h-3.5 w-3.5 text-blue-600"
                          aria-hidden
                        />
                        {t("stats.legend.scheduled")}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="flex min-h-[min(520px,calc(100dvh-300px))] min-w-0 flex-col shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <CardHeader>
              <CardTitle className="text-lg font-black text-slate-900">
                {t("stats.topGroups")}
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-auto">
              <table className="w-full text-[15px]">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-extrabold">
                      {t("stats.col.group")}
                    </th>
                    <th className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-extrabold">
                      {t("stats.col.contacts")}
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
                        {t("stats.topGroupsEmpty")}
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
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-3">
            <TriangleAlert aria-hidden />
            <AlertDescription className="font-bold">{error}</AlertDescription>
          </Alert>
        )}

        <Alert className="mt-auto shrink-0 border-slate-200/80 bg-slate-100/70">
          <Info
            className="text-slate-500"
            strokeWidth={2.25}
            aria-hidden
          />
          <AlertDescription className="text-xs font-semibold leading-relaxed text-slate-500">
            {t("stats.disclaimer")}
          </AlertDescription>
        </Alert>
      </div>

      {loading && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/[0.06] backdrop-blur-[1px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label={t("stats.loadingAria")}
        >
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
            <Loader2
              className="h-5 w-5 shrink-0 animate-spin text-blue-600"
              aria-hidden
            />
            <span className="text-sm font-bold text-slate-700">
              {t("stats.loading")}
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
