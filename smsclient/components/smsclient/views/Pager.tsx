"use client";

import { cn } from "@/lib/cn";
import { useState } from "react";

export function Pager() {
  const [page, setPage] = useState(0);
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => setPage(i)}
          className={cn(
            "grid h-[34px] w-[34px] place-items-center rounded-[10px] border border-slate-200 bg-white text-sm font-extrabold text-slate-700",
            page === i &&
              "border-[#2f6fed] bg-[#2f6fed] text-white shadow-[0_10px_18px_rgba(47,111,237,0.25)]",
          )}
        >
          {i + 1}
        </button>
      ))}
      <button
        type="button"
        className="grid h-[34px] w-[34px] place-items-center rounded-[10px] border border-slate-200 bg-white text-sm font-black text-slate-700"
      >
        ›
      </button>
    </div>
  );
}
