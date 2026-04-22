import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Texte sur une ligne dans une cellule de liste : tronqué, survol = texte complet (attribut title). */
export function CellTruncate({
  children,
  title: titleProp,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  title?: string;
  className?: string;
  as?: "span" | "div";
}) {
  const titleText =
    titleProp ??
    (typeof children === "string" && children.length > 0
      ? children
      : undefined);
  return (
    <Tag className={cn("min-w-0 max-w-full truncate", className)} title={titleText}>
      {children}
    </Tag>
  );
}

export function ProtoBtn({
  className,
  primary,
  green,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  primary?: boolean;
  green?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-11 cursor-pointer items-center justify-center rounded-[14px] border border-slate-200 bg-white px-4 text-[15px] font-bold text-slate-700 shadow-[0_10px_22px_rgba(15,23,42,0.08)]",
        primary &&
          "border-transparent bg-gradient-to-br from-[#4a86ff] to-[#2f6fed] px-[18px] text-white shadow-[0_18px_30px_rgba(47,111,237,0.22)]",
        green &&
          "border-emerald-500/85 bg-emerald-500/85 text-white hover:brightness-[0.98]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function PlusIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "mr-2 inline-block -translate-y-px text-lg font-black",
        className,
      )}
    >
      +
    </span>
  );
}

export function BadgeSent({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1.5 text-xs font-extrabold text-cyan-800">
      <span className="h-2 w-2 rounded-full bg-current opacity-90" />
      {children}
    </span>
  );
}

export function BadgeScheduled({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-xs font-extrabold text-blue-700">
      <span className="h-2 w-2 rounded-full bg-current opacity-90" />
      {children}
    </span>
  );
}

export function BadgeDraft({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-extrabold text-slate-700">
      <span className="h-2 w-2 rounded-full bg-current opacity-90" />
      {children}
    </span>
  );
}

export function BadgeFailed({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1.5 text-xs font-extrabold text-rose-700">
      <span className="h-2 w-2 rounded-full bg-current opacity-90" />
      {children}
    </span>
  );
}
