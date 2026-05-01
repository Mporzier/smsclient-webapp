"use client";

import { cn } from "@/lib/cn";

type StepTabProps = {
  active: boolean;
  num: string;
  label: string;
  onClick?: () => void;
};

export function StepTab({ active, num, label, onClick }: StepTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-2xl border border-transparent bg-slate-100 px-3 py-2.5 text-[13px] font-extrabold text-slate-700",
        active &&
          "border-slate-200 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]",
      )}
    >
      <span
        className={cn(
          "grid h-[26px] w-[26px] place-items-center rounded-[10px] bg-slate-200 text-xs font-black text-slate-900",
          active &&
            "bg-[#2f6fed] text-white shadow-[0_10px_18px_rgba(47,111,237,0.25)]",
        )}
      >
        {num}
      </span>
      {label}
    </button>
  );
}
