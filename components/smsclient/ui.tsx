"use client";

import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/**
 * Texte une ligne dans cellule de liste. Si tronqué, tip hover/focus (portail).
 */
export function CellTruncate({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "span" | "div";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [label, setLabel] = useState("");
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setTruncated(el.scrollWidth > el.clientWidth + 1);
    const text = (el.textContent ?? "").trim();
    setLabel(text);
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [children, measure]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const updatePosition = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({
      top: rect.bottom + 6,
      left: Math.min(
        Math.max(8, rect.left),
        window.innerWidth - 16
      ),
    });
  }, []);

  const show = useCallback(() => {
    measure();
    const el = ref.current;
    if (!el || el.scrollWidth <= el.clientWidth + 1) return;
    updatePosition();
    setVisible(true);
  }, [measure, updatePosition]);

  const hide = useCallback(() => setVisible(false), []);

  useEffect(() => {
    if (!visible) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [visible, updatePosition]);

  return (
    <>
      <Tag
        ref={(node) => {
          ref.current = node;
        }}
        className={cn("min-w-0 max-w-full truncate", className)}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {children}
      </Tag>
      {visible &&
        truncated &&
        label &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[10050] max-w-[min(360px,calc(100vw-16px))] break-words rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-md"
            style={{ top: pos.top, left: pos.left }}
          >
            {label}
          </div>,
          document.body
        )}
    </>
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
