export type MarketingCalendarEventType =
  | "holiday"
  | "commercial"
  | "seasonal"
  | "professional"
  | "personal";

export type MarketingCalendarEvent = {
  id: string;
  title: string;
  /** ISO date `YYYY-MM-DD` */
  date: string;
  type: MarketingCalendarEventType;
  note?: string;
};
