"use client";

import { Search } from "lucide-react";

export function SearchBar({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div
      className="mt-3.5 flex h-11 max-w-full items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 font-semibold text-slate-500 shadow-[0_10px_22px_rgba(15,23,42,0.08)] sm:max-w-[520px] w-full"
      role="search"
    >
      <Search
        className="h-[18px] w-[18px] shrink-0 text-slate-500"
        aria-hidden
      />
      <input
        className="w-full border-none bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}