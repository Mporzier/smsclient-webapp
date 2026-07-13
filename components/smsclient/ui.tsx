import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

/** Texte sur une ligne dans une cellule de liste : tronqué sans infobulle au survol. */
export function CellTruncate({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "span" | "div";
}) {
  return (
    <Tag className={cn("min-w-0 max-w-full truncate", className)}>
      {children}
    </Tag>
  );
}
export function PlusIcon({ className }: { className?: string }) {
  return (
    <Plus
      className={cn("mr-2 h-[1.125rem] w-[1.125rem] shrink-0", className)}
      strokeWidth={2.5}
      aria-hidden
    />
  );
}

export function BadgeSent({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1.5 text-xs font-medium text-cyan-800">
      <span className="h-2 w-2 rounded-full bg-current opacity-90" />
      {children}
    </span>
  );
}

export function BadgeScheduled({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-blue-700">
      <span className="h-2 w-2 rounded-full bg-current opacity-90" />
      {children}
    </span>
  );
}

export function BadgeDraft({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700">
      <span className="h-2 w-2 rounded-full bg-current opacity-90" />
      {children}
    </span>
  );
}

export function BadgeFailed({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700">
      <span className="h-2 w-2 rounded-full bg-current opacity-90" />
      {children}
    </span>
  );
}
