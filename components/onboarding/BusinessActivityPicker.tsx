"use client";

import { cn } from "@/lib/cn";
import {
  BUSINESS_ACTIVITIES,
  type BusinessActivityId,
} from "@/lib/types/businessActivity";

type BusinessActivityPickerProps = {
  value: BusinessActivityId | "";
  onChange: (value: BusinessActivityId) => void;
  disabled?: boolean;
};

export function BusinessActivityPicker({
  value,
  onChange,
  disabled = false,
}: BusinessActivityPickerProps) {
  return (
    <div
      className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
      role="radiogroup"
      aria-label="Secteur d'activité"
    >
      {BUSINESS_ACTIVITIES.map((activity) => {
        const selected = value === activity.id;
        return (
          <button
            key={activity.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(activity.id)}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-2xl border px-2 py-3.5 text-center transition-all",
              selected
                ? "border-2 border-[#2f6fed] bg-[#eef4ff]/50 shadow-[0_4px_16px_rgba(47,111,237,0.12)]"
                : "border-slate-200 bg-white hover:border-[#2f6fed]/30 hover:bg-[#eef4ff]/25",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <span className="text-2xl leading-none" aria-hidden>
              {activity.emoji}
            </span>
            <span className="mt-2 text-[11px] font-black leading-snug text-slate-900">
              {activity.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
