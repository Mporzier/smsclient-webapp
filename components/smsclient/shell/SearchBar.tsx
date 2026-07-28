"use client";

import { Input } from "@/components/ui/input";
import { SEARCH_QUERY_MAX_LENGTH } from "@/lib/forms/fieldLimits";
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
      className="mt-3.5 flex h-11 max-w-full w-full items-center gap-2.5 rounded-2xl border border-border bg-card px-3.5 shadow-sm sm:max-w-[520px]"
      role="search"
    >
      <Search
        className="h-[18px] w-[18px] shrink-0 text-muted-foreground"
        aria-hidden
      />
      <Input
        className="h-auto flex-1 border-0 bg-transparent px-0 py-0 text-sm font-semibold shadow-none focus-visible:border-0 focus-visible:ring-0 md:text-sm"
        placeholder={placeholder}
        value={value ?? ""}
        maxLength={SEARCH_QUERY_MAX_LENGTH}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}
