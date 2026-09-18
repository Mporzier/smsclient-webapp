"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { useI18n, type MessageKey } from "@/lib/i18n";
import {
  MARKETING_CALENDAR_EVENT_TYPE_DOT_CLASS,
  MARKETING_CALENDAR_EVENT_TYPE_LABEL_KEYS,
} from "@/lib/proto/marketingCalendarEventTypes";
import type { DashboardCalendarDayItem } from "@/components/smsclient/views/dashboard/dashboardCampaignDates";
import { format } from "date-fns";
import { fr as frLocale } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { useMemo } from "react";
import { FormDialogHeader } from "./FormDialogHeader";
import {
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";

type DashboardCalendarDayDetailModalProps = {
  open: boolean;
  onClose: () => void;
  day: Date | null;
  items: DashboardCalendarDayItem[];
};

function sourceLabelKey(item: DashboardCalendarDayItem): MessageKey {
  if (item.source === "campaign") {
    return item.kind === "scheduled"
      ? "dashboard.calendarSourceCampaignScheduled"
      : "dashboard.calendarSourceCampaignPast";
  }
  return item.origin === "seed"
    ? "dashboard.calendarSourceMarketingSeed"
    : "dashboard.calendarSourceMarketingUser";
}

function DayEventRow({ item }: { item: DashboardCalendarDayItem }) {
  const { t } = useI18n();
  const sourceLabel = t(sourceLabelKey(item));

  if (item.source === "campaign") {
    return (
      <li className="rounded-lg border bg-card px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {sourceLabel}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">{item.name}</p>
      </li>
    );
  }

  const typeLabel = t(
    MARKETING_CALENDAR_EVENT_TYPE_LABEL_KEYS[item.eventType],
  );

  return (
    <li className="rounded-lg border bg-card px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {sourceLabel}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              MARKETING_CALENDAR_EVENT_TYPE_DOT_CLASS[item.eventType],
            )}
            aria-hidden
          />
          {typeLabel}
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold text-foreground">{item.name}</p>
      {item.note ? (
        <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
          <span className="font-semibold text-foreground">
            {t("dashboard.calendarEventNoteLabel")}:
          </span>{" "}
          {item.note}
        </p>
      ) : null}
    </li>
  );
}

export function DashboardCalendarDayDetailModal({
  open,
  onClose,
  day,
  items,
}: DashboardCalendarDayDetailModalProps) {
  const { t } = useI18n();

  const dayLabel = useMemo(() => {
    if (!day) return "";
    return format(day, "EEEE d MMMM yyyy", { locale: frLocale });
  }, [day]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const rank = (item: DashboardCalendarDayItem) => {
        if (item.source === "campaign") return item.kind === "scheduled" ? 0 : 1;
        return item.origin === "seed" ? 2 : 3;
      };
      const r = rank(a) - rank(b);
      if (r !== 0) return r;
      return a.name.localeCompare(b.name, "fr");
    });
  }, [items]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton
        overlayClassName={dialogOverlayCls}
        className={cn(
          formDialogContentCls,
          "max-h-[min(86dvh,560px)] sm:max-w-[480px]",
          dialogContentZCls,
        )}
        onOpenAutoFocus={preventDialogOpenAutoFocus}
      >
        <FormDialogHeader
          icon={<CalendarDays className="size-5" strokeWidth={2.25} />}
          title={t("dashboard.calendarDayDetailTitle")}
          description={dayLabel}
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {sortedItems.length === 0 ? (
            <p className="m-0 text-sm text-muted-foreground">
              {t("dashboard.calendarEmptyDay")}
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {sortedItems.map((item) => (
                <DayEventRow key={`${item.source}-${item.id}`} item={item} />
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 shrink-0 flex-row justify-end rounded-b-xl p-2.5 px-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.ok")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
