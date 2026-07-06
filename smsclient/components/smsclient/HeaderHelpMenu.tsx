"use client";

import { cn } from "@/lib/cn";
import { HELP_ACTIONS } from "@/lib/proto/helpActions";
import { useEffect, useRef, useState } from "react";

export function HeaderHelpMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        title="Aide"
        aria-label="Aide"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-slate-200 bg-white text-base font-black text-slate-600 shadow-[0_10px_22px_rgba(15,23,42,0.08)] transition-colors hover:border-slate-300 hover:bg-slate-50",
          open && "border-blue-200 bg-blue-50 text-blue-700"
        )}
      >
        ?
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Actions d'aide"
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(300px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
        >
          <p className="px-3 pb-1 pt-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
            Aide
          </p>
          {HELP_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  action.onClick();
                  setOpen(false);
                }}
                className="flex w-full cursor-pointer items-start gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors hover:border-slate-200 hover:bg-slate-50"
              >
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900">
                    {action.label}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                    {action.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
