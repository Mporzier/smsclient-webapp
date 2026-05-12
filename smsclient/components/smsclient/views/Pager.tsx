"use client";

import { cn } from "@/lib/cn";

type PagerProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pager({ page, totalPages, onPageChange }: PagerProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
        className={cn(
          "grid h-7 w-7 place-items-center rounded-lg border border-slate-200 bg-white text-sm font-black leading-none text-slate-700",
          page === 0 && "cursor-not-allowed opacity-40",
        )}
      >
        ‹
      </button>
      {pages.map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPageChange(i)}
          className={cn(
            "grid h-7 w-7 place-items-center rounded-lg border border-slate-200 bg-white text-sm font-extrabold leading-none text-slate-700",
            page === i &&
              "border-[#2f6fed] bg-[#2f6fed] text-white shadow-[0_6px_12px_rgba(47,111,237,0.25)]",
          )}
        >
          {i + 1}
        </button>
      ))}
      <button
        type="button"
        disabled={page === totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        className={cn(
          "grid h-7 w-7 place-items-center rounded-lg border border-slate-200 bg-white text-sm font-black leading-none text-slate-700",
          page === totalPages - 1 && "cursor-not-allowed opacity-40",
        )}
      >
        ›
      </button>
    </div>
  );
}
