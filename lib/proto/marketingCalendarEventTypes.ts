import type { MessageKey } from "@/lib/i18n";
import type { MarketingCalendarEventType } from "@/lib/types/marketingCalendarEvent";

export const MARKETING_CALENDAR_EVENT_TYPES: MarketingCalendarEventType[] = [
  "holiday",
  "commercial",
  "seasonal",
  "professional",
  "personal",
];

export const MARKETING_CALENDAR_EVENT_TYPE_LABEL_KEYS: Record<
  MarketingCalendarEventType,
  MessageKey
> = {
  holiday: "dashboard.calendarType.holiday",
  commercial: "dashboard.calendarType.commercial",
  seasonal: "dashboard.calendarType.seasonal",
  professional: "dashboard.calendarType.professional",
  personal: "dashboard.calendarType.personal",
};

export const MARKETING_CALENDAR_EVENT_TYPE_DOT_CLASS: Record<
  MarketingCalendarEventType,
  string
> = {
  holiday: "bg-violet-500",
  commercial: "bg-orange-500",
  seasonal: "bg-teal-500",
  professional: "bg-blue-500",
  personal: "bg-rose-500",
};

export const MARKETING_CALENDAR_EVENT_TYPE_TILE_CLASS: Record<
  MarketingCalendarEventType,
  string
> = {
  holiday: "react-calendar__tile-event--type-holiday",
  commercial: "react-calendar__tile-event--type-commercial",
  seasonal: "react-calendar__tile-event--type-seasonal",
  professional: "react-calendar__tile-event--type-professional",
  personal: "react-calendar__tile-event--type-personal",
};
