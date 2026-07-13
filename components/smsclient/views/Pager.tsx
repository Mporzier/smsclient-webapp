"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
        className="h-7 w-7 cursor-pointer rounded-lg text-sm font-medium"
        aria-label="Page précédente"
      >
        ‹
      </Button>
      {pages.map((i) => (
        <Button
          key={i}
          type="button"
          variant={page === i ? "default" : "outline"}
          size="icon-xs"
          onClick={() => onPageChange(i)}
          className={cn(
            "h-7 w-7 cursor-pointer rounded-lg text-sm font-medium",
            page === i && "shadow-sm"
          )}
          aria-label={`Page ${i + 1}`}
          aria-current={page === i ? "page" : undefined}
        >
          {i + 1}
        </Button>
      ))}
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        disabled={page === totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        className="h-7 w-7 cursor-pointer rounded-lg text-sm font-medium"
        aria-label="Page suivante"
      >
        ›
      </Button>
    </div>
  );
}
