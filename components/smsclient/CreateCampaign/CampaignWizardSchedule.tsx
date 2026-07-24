"use client";

import { cn } from "@/lib/cn";
import { Calendar, ChevronDown } from "lucide-react";
import { useCallback, useRef, useState, type ReactNode } from "react";

export function parseScheduleValue(val: string): {
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
} {
  if (!val) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);
    return {
      day: String(now.getDate()).padStart(2, "0"),
      month: String(now.getMonth() + 1).padStart(2, "0"),
      year: String(now.getFullYear()),
      hour: String(now.getHours()).padStart(2, "0"),
      minute: String(now.getMinutes()).padStart(2, "0"),
    };
  }
  const [datePart, timePart] = val.split("T");
  const [y, m, d] = datePart.split("-");
  const [h, min] = (timePart ?? "00:00").split(":");
  return { day: d, month: m, year: y, hour: h, minute: min };
}

export function buildScheduleValue(parts: {
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
}): string {
  const d = parts.day.padStart(2, "0");
  const m = parts.month.padStart(2, "0");
  const y = parts.year.padStart(4, "0");
  const h = parts.hour.padStart(2, "0");
  const min = parts.minute.padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}

export function SchedulePicker({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
}) {
  const initial = parseScheduleValue(value);
  const [day, setDay] = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const nativeRef = useRef<HTMLInputElement>(null);

  const flush = useCallback(() => {
    onChange(buildScheduleValue({ day, month, year, hour, minute }));
  }, [day, month, year, hour, minute, onChange]);

  const handleNativePick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (!v) return;
      const parsed = parseScheduleValue(v);
      setDay(parsed.day);
      setMonth(parsed.month);
      setYear(parsed.year);
      setHour(parsed.hour);
      setMinute(parsed.minute);
      onChange(buildScheduleValue(parsed));
    },
    [onChange]
  );

  const numInput =
    "h-10 rounded-lg border bg-card px-2 text-center text-sm font-bold text-foreground outline-none focus:border-border focus:ring-0";
  const sep = "text-sm font-black text-muted-foreground self-center";
  const borderCls = hasError ? "border-rose-300" : "border-border";

  return (
    <div className="mt-1 flex flex-wrap items-end gap-3">
      <div>
        <span className="mb-1 block text-[11px] font-bold text-muted-foreground">
          Date
        </span>
        <div className="flex items-center gap-1">
          <input
            className={cn(numInput, borderCls, "w-11")}
            maxLength={2}
            placeholder="JJ"
            value={day}
            onChange={(e) =>
              setDay(e.target.value.replace(/\D/g, "").slice(0, 2))
            }
            onBlur={flush}
          />
          <span className={sep}>/</span>
          <input
            className={cn(numInput, borderCls, "w-11")}
            maxLength={2}
            placeholder="MM"
            value={month}
            onChange={(e) =>
              setMonth(e.target.value.replace(/\D/g, "").slice(0, 2))
            }
            onBlur={flush}
          />
          <span className={sep}>/</span>
          <input
            className={cn(numInput, borderCls, "w-16")}
            maxLength={4}
            placeholder="AAAA"
            value={year}
            onChange={(e) =>
              setYear(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            onBlur={flush}
          />
        </div>
      </div>
      <div>
        <span className="mb-1 block text-[11px] font-bold text-muted-foreground">
          Heure
        </span>
        <div className="flex items-center gap-1">
          <input
            className={cn(numInput, borderCls, "w-11")}
            maxLength={2}
            placeholder="HH"
            value={hour}
            onChange={(e) =>
              setHour(e.target.value.replace(/\D/g, "").slice(0, 2))
            }
            onBlur={flush}
          />
          <span className={sep}>:</span>
          <input
            className={cn(numInput, borderCls, "w-11")}
            maxLength={2}
            placeholder="MM"
            value={minute}
            onChange={(e) =>
              setMinute(e.target.value.replace(/\D/g, "").slice(0, 2))
            }
            onBlur={flush}
          />
        </div>
      </div>
      <div className="self-end">
        <span className="mb-1 block text-[11px] font-bold text-muted-foreground">
          &nbsp;
        </span>
        <button
          type="button"
          title="Ouvrir le calendrier"
          onClick={() => nativeRef.current?.showPicker()}
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-ring hover:bg-accent hover:text-ring"
        >
          <Calendar className="h-4 w-4" />
        </button>
        <input
          ref={nativeRef}
          type="datetime-local"
          className="invisible absolute h-0 w-0"
          tabIndex={-1}
          value={buildScheduleValue({ day, month, year, hour, minute })}
          onChange={handleNativePick}
        />
      </div>
    </div>
  );
}

export function AdvancedOptionsCollapsible({
  open,
  onToggle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="shrink-0 border-t border-border/50 pt-2.5">
      <button
        type="button"
        onClick={onToggle}
        className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
        Détails de l&apos;envoi
      </button>
      {open && <div className="mt-2.5 space-y-2.5">{children}</div>}
    </div>
  );
}
