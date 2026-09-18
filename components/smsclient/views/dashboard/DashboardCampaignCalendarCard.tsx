"use client";

import { CreateMarketingCalendarEventModal } from "@/components/smsclient/modals/CreateMarketingCalendarEventModal";
import { DashboardCalendarDayDetailModal } from "@/components/smsclient/modals/DashboardCalendarDayDetailModal";
import {
  campaignsByDayKey,
  campaignsOnDay,
  dayKey,
  mergeDashboardCalendarItems,
  type DashboardCalendarDayItem,
} from "@/components/smsclient/views/dashboard/dashboardCampaignDates";
import "@/components/smsclient/views/dashboard/dashboardReactCalendar.css";
import { LoadingLabel } from "@/components/ui/loading-label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import {
  MARKETING_CALENDAR_EVENT_TYPE_DOT_CLASS,
  MARKETING_CALENDAR_EVENT_TYPE_LABEL_KEYS,
  MARKETING_CALENDAR_EVENT_TYPE_TILE_CLASS,
  MARKETING_CALENDAR_EVENT_TYPES,
} from "@/lib/proto/marketingCalendarEventTypes";
import { useMarketingCalendarEvents } from "@/hooks/useMarketingCalendarEvents";
import { marketingCalendarSeedAsMarketingEvents } from "@/lib/proto/marketingCalendarSeed";
import type { BusinessActivityId } from "@/lib/types/businessActivity";
import { addMonths, format, subMonths } from "date-fns";
import { fr as frLocale } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import type { CampaignRowData } from "@/lib/types/campaign";
import type { MarketingCalendarEventType } from "@/lib/types/marketingCalendarEvent";
import { useDashboardCalendarRowHeight } from "@/components/smsclient/views/dashboard/useDashboardCalendarRowHeight";

const MAX_EVENTS_IN_TILE = 3;
/** react-calendar v5 uses Intl locale string, not date-fns `Locale`. */
const DASHBOARD_CALENDAR_LOCALE = "fr-FR";

type DashboardCampaignCalendarCardProps = {
  campaignRows: CampaignRowData[];
  businessActivity?: BusinessActivityId | "";
  loading?: boolean;
  className?: string;
};

function eventTileClassName(item: DashboardCalendarDayItem): string {
  if (item.source === "marketing") {
    return MARKETING_CALENDAR_EVENT_TYPE_TILE_CLASS[item.eventType];
  }
  return cn(
    MARKETING_CALENDAR_EVENT_TYPE_TILE_CLASS.personal,
    item.kind === "past" && "opacity-80",
  );
}

function DayTileEvents({ items }: { items: DashboardCalendarDayItem[] }) {
  const { t } = useI18n();
  if (items.length === 0) return null;

  const visible = items.slice(0, MAX_EVENTS_IN_TILE);
  const extra = items.length - visible.length;

  return (
    <div className="react-calendar__tile-events">
      {visible.map((item) => (
        <span
          key={item.id}
          className={cn("react-calendar__tile-event", eventTileClassName(item))}
          title={item.name}
        >
          {item.name}
        </span>
      ))}
      {extra > 0 ? (
        <span className="react-calendar__tile-event-more">
          {t("dashboard.calendarMoreEvents", { n: extra })}
        </span>
      ) : null}
    </div>
  );
}

function DashboardCalendarMonthNav({
  activeMonth,
  onActiveMonthChange,
  dateFnsLocale,
}: {
  activeMonth: Date;
  onActiveMonthChange: (date: Date) => void;
  dateFnsLocale: typeof frLocale;
}) {
  const { t } = useI18n();
  const monthLabel = format(activeMonth, "MMMM yyyy", { locale: dateFnsLocale });

  return (
    <div
      className="flex items-center gap-0.5"
      role="group"
      aria-label={t("dashboard.calendarTitle")}
    >
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="shrink-0"
        aria-label={t("dashboard.calendarPrevMonth")}
        onClick={() => onActiveMonthChange(subMonths(activeMonth, 1))}
      >
        <ChevronLeft className="size-4" strokeWidth={2.25} aria-hidden />
      </Button>
      <span className="min-w-[7.5rem] text-center text-sm font-extrabold capitalize text-foreground">
        {monthLabel}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="shrink-0"
        aria-label={t("dashboard.calendarNextMonth")}
        onClick={() => onActiveMonthChange(addMonths(activeMonth, 1))}
      >
        <ChevronRight className="size-4" strokeWidth={2.25} aria-hidden />
      </Button>
    </div>
  );
}

export function DashboardCampaignCalendarCard({
  campaignRows,
  businessActivity = "",
  loading = false,
  className,
}: DashboardCampaignCalendarCardProps) {
  const { t } = useI18n();
  const { events: marketingEvents, addEvent } = useMarketingCalendarEvents();
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);

  const seedMarketingEvents = useMemo(
    () => marketingCalendarSeedAsMarketingEvents(businessActivity),
    [businessActivity],
  );

  const calendarItems = useMemo(
    () =>
      mergeDashboardCalendarItems(
        campaignRows,
        marketingEvents,
        seedMarketingEvents,
      ),
    [campaignRows, marketingEvents, seedMarketingEvents],
  );
  const itemsByDay = useMemo(
    () => campaignsByDayKey(calendarItems),
    [calendarItems],
  );
  const [detailDay, setDetailDay] = useState<Date>(() => new Date());
  const [activeMonth, setActiveMonth] = useState<Date>(() => new Date());
  const calendarShellRef = useDashboardCalendarRowHeight(activeMonth);

  const defaultEventDate = format(detailDay, "yyyy-MM-dd");

  const selectedDayItems = useMemo(
    () => campaignsOnDay(calendarItems, detailDay),
    [calendarItems, detailDay],
  );

  const tileContent = useCallback(
    ({ date, view }: { date: Date; view: string }) => {
      if (view !== "month") return null;
      const dayItems = itemsByDay.get(dayKey(date));
      if (!dayItems?.length) return null;
      return <DayTileEvents items={dayItems} />;
    },
    [itemsByDay],
  );

  const handleCreateEvent = useCallback(
    async (input: {
      title: string;
      date: string;
      type: MarketingCalendarEventType;
    }) => {
      const res = await addEvent(input);
      if (res.error === "not_authenticated") {
        return { error: t("dashboard.calendarEventErrorAuth") };
      }
      if (typeof res.error === "string") {
        return { error: res.error };
      }
      return { error: null };
    },
    [addEvent, t],
  );

  return (
    <>
      <Card
        className={cn(
          "flex h-full min-h-0 flex-col gap-0 py-0 ring-border",
          className,
        )}
      >
        <CardHeader className="shrink-0 gap-0 border-b px-4 pt-2 pb-2">
          <div className="flex w-full items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <CardTitle className="text-base font-extrabold leading-tight">
                {t("dashboard.calendarTitle")}
              </CardTitle>
              <CardDescription className="m-0 text-xs leading-snug">
                {t("dashboard.calendarSubtitle")}
              </CardDescription>
            </div>
            <DashboardCalendarMonthNav
              activeMonth={activeMonth}
              onActiveMonthChange={setActiveMonth}
              dateFnsLocale={frLocale}
            />
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-2 pt-2">
          {loading ? (
            <p className="m-0 text-xs font-semibold text-muted-foreground">
              <LoadingLabel>{t("common.loading")}</LoadingLabel>
            </p>
          ) : (
            <div
              ref={calendarShellRef}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <Calendar
                className="dashboard-react-calendar h-full min-h-0 flex-1"
                locale={DASHBOARD_CALENDAR_LOCALE}
                activeStartDate={activeMonth}
                onClickDay={(day) => {
                  setDetailDay(day);
                  setDayDetailOpen(true);
                }}
                onActiveStartDateChange={({ activeStartDate }) => {
                  if (activeStartDate) setActiveMonth(activeStartDate);
                }}
                showNavigation={false}
                tileContent={tileContent}
                prev2Label={null}
                next2Label={null}
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="mt-auto shrink-0 flex-row flex-wrap items-center gap-x-3 gap-y-2 border-t bg-transparent px-4 py-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setEventModalOpen(true)}
          >
            <Plus data-icon="inline-start" className="size-3.5" aria-hidden />
            {t("dashboard.calendarAddEvent")}
          </Button>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-3 gap-y-1">
            {MARKETING_CALENDAR_EVENT_TYPES.map((typeId) => (
              <span
                key={typeId}
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground"
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    MARKETING_CALENDAR_EVENT_TYPE_DOT_CLASS[typeId],
                  )}
                  aria-hidden
                />
                {t(MARKETING_CALENDAR_EVENT_TYPE_LABEL_KEYS[typeId])}
              </span>
            ))}
          </div>
        </CardFooter>
      </Card>

      <CreateMarketingCalendarEventModal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        defaultDate={defaultEventDate}
        onCreate={handleCreateEvent}
      />

      <DashboardCalendarDayDetailModal
        open={dayDetailOpen}
        onClose={() => setDayDetailOpen(false)}
        day={detailDay}
        items={selectedDayItems}
      />
    </>
  );
}
