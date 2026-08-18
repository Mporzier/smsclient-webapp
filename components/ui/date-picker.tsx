"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, isValid, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

const ISO_DATE = "yyyy-MM-dd";

function parseIsoDate(value: string): Date | undefined {
  const t = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return undefined;
  const d = parse(t, ISO_DATE, new Date());
  return isValid(d) ? d : undefined;
}

type DatePickerProps = {
  id?: string;
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Au-dessus des Dialog smsclient (z-9999). */
  contentClassName?: string;
  /** ISO `YYYY-MM-DD` — jours après cette date désactivés (ex. anniversaire). */
  max?: string;
};

/** DatePicker shadcn — valeur stockée `YYYY-MM-DD` (vide = aucune). */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Choisir une date",
  disabled = false,
  className,
  contentClassName,
  max,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseIsoDate(value);
  const maxDate = max ? parseIsoDate(max) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-8 w-full min-w-0 justify-start px-2.5 font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {selected
              ? format(selected, "dd/MM/yyyy", { locale: fr })
              : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "z-[10050] w-auto overflow-hidden p-0",
          contentClassName,
        )}
        align="start"
        sideOffset={6}
      >
        <Calendar
          mode="single"
          locale={fr}
          selected={selected}
          defaultMonth={selected}
          endMonth={maxDate}
          fixedWeeks
          disabled={maxDate ? { after: maxDate } : undefined}
          onSelect={(date) => {
            if (date && maxDate && date > maxDate) return;
            onChange(date ? format(date, ISO_DATE) : "");
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
