"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PagerProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

/** Indices 0-based + `"ellipsis"` — 5 premières + 5 dernières + voisinage. */
function pageItems(page: number, totalPages: number): (number | "ellipsis")[] {
  const edge = 5;
  if (totalPages <= edge * 2 + 3) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const set = new Set<number>();
  for (let i = 0; i < edge; i++) set.add(i);
  for (let i = page - 1; i <= page + 1; i++) {
    if (i >= 0 && i < totalPages) set.add(i);
  }
  for (let i = totalPages - edge; i < totalPages; i++) set.add(i);

  const sorted = [...set].sort((a, b) => a - b);
  const items: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i]!;
    if (i > 0 && cur - sorted[i - 1]! > 1) {
      items.push("ellipsis");
    }
    items.push(cur);
  }
  return items;
}

export function Pager({ page, totalPages, onPageChange }: PagerProps) {
  if (totalPages <= 1) return null;

  const items = pageItems(page, totalPages);

  return (
    <div className="flex w-full items-center justify-center">
      <div className="flex flex-wrap items-center justify-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          className="h-7 w-7 shrink-0 cursor-pointer rounded-lg"
          aria-label="Page précédente"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Button>
        {items.map((item, idx) =>
          item === "ellipsis" ? (
            <span
              key={`e-${idx}`}
              className="inline-flex h-7 min-w-7 items-center justify-center px-0.5 text-sm text-muted-foreground"
              aria-hidden
            >
              …
            </span>
          ) : (
            <Button
              key={item}
              type="button"
              variant={page === item ? "default" : "outline"}
              size="icon-xs"
              onClick={() => onPageChange(item)}
              className={cn(
                "h-7 w-7 cursor-pointer rounded-lg text-sm font-medium",
                page === item && "shadow-sm",
              )}
              aria-label={`Page ${item + 1}`}
              aria-current={page === item ? "page" : undefined}
            >
              {item + 1}
            </Button>
          ),
        )}
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          disabled={page === totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          className="h-7 w-7 shrink-0 cursor-pointer rounded-lg"
          aria-label="Page suivante"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
