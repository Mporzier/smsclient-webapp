"use client";

import { useEffect, useRef } from "react";

const WEEK_ROWS = 6;
const ROW_GAP_PX = 3;
const WEEKDAYS_MARGIN_PX = 3;

/** Sync `--dashboard-day-row-h` on the month grid from the calendar card height. */
export function useDashboardCalendarRowHeight(activeMonth: Date) {
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const apply = () => {
      const calendar = shell.querySelector(
        ".dashboard-react-calendar",
      ) as HTMLElement | null;
      const days = shell.querySelector(
        ".react-calendar__month-view__days",
      ) as HTMLElement | null;
      if (!calendar || !days) return;

      const weekdays = calendar.querySelector(
        ".react-calendar__month-view__weekdays",
      ) as HTMLElement | null;

      let chrome = 0;
      if (weekdays) chrome += weekdays.offsetHeight + WEEKDAYS_MARGIN_PX;

      const rowGaps = ROW_GAP_PX * (WEEK_ROWS - 1);
      const available = calendar.clientHeight - chrome - rowGaps;
      const rowHeight = Math.max(28, Math.floor(available / WEEK_ROWS));

      calendar.style.setProperty("--dashboard-day-row-h", `${rowHeight}px`);
    };

    const observer = new ResizeObserver(() => apply());
    observer.observe(shell);
    apply();

    return () => observer.disconnect();
  }, [activeMonth]);

  return shellRef;
}
