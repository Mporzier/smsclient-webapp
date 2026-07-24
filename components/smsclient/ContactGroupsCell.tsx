"use client";

import { cn } from "@/lib/cn";
import {
  groupColor,
  groupTagBase,
} from "@/lib/proto/contactDisplay";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const tagBase = groupTagBase;
const GROUPS_GAP_PX = 4;

/** Pills groupes avec overflow mesuré + tip « … » (liste Contacts / modale groupe). */
export function ContactGroupsCell({
  groups,
  emptyLabel = "—",
}: {
  groups: string[];
  emptyLabel?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const ellipsisRef = useRef<HTMLSpanElement>(null);
  const tipAnchorRef = useRef<HTMLSpanElement>(null);
  const [visibleCount, setVisibleCount] = useState(groups.length);
  const [tipOpen, setTipOpen] = useState(false);
  const [tipPos, setTipPos] = useState({ top: 0, left: 0 });

  const recompute = useCallback(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    const ellipsis = ellipsisRef.current;
    if (!container || !measure || !ellipsis) return;

    const avail = container.clientWidth;
    if (avail <= 0) return;

    const pills = Array.from(
      measure.querySelectorAll<HTMLElement>("[data-group-pill]"),
    );
    const ellipsisW = ellipsis.offsetWidth;
    let used = 0;
    let count = 0;

    for (let i = 0; i < pills.length; i++) {
      const w = pills[i]!.offsetWidth;
      const nextUsed = used + (count > 0 ? GROUPS_GAP_PX : 0) + w;
      const hasMore = i < pills.length - 1;
      if (hasMore) {
        if (nextUsed + GROUPS_GAP_PX + ellipsisW <= avail) {
          used = nextUsed;
          count = i + 1;
        } else {
          break;
        }
      } else if (nextUsed <= avail) {
        count = i + 1;
      }
    }

    if (count === 0 && groups.length > 0) {
      setVisibleCount(0);
      return;
    }
    setVisibleCount(count);
  }, [groups.length]);

  useLayoutEffect(() => {
    recompute();
  }, [groups, recompute]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => recompute());
    ro.observe(el);
    return () => ro.disconnect();
  }, [recompute]);

  const updateTipPos = useCallback(() => {
    const el = tipAnchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTipPos({
      top: rect.bottom + 6,
      left: Math.min(Math.max(8, rect.left), window.innerWidth - 16),
    });
  }, []);

  const showTip = useCallback(() => {
    updateTipPos();
    setTipOpen(true);
  }, [updateTipPos]);

  const hideTip = useCallback(() => setTipOpen(false), []);

  useEffect(() => {
    if (!tipOpen) return;
    const onScrollOrResize = () => updateTipPos();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [tipOpen, updateTipPos]);

  if (groups.length === 0) {
    return <span className="text-sm text-muted-foreground">{emptyLabel}</span>;
  }

  const overflow = groups.length - visibleCount;
  const tipLabel = groups.join(" · ");

  return (
    <>
      <div ref={containerRef} className="relative min-w-0 w-full">
        <div
          ref={measureRef}
          className="pointer-events-none invisible absolute left-0 top-0 flex whitespace-nowrap"
          style={{ gap: GROUPS_GAP_PX }}
          aria-hidden
        >
          {groups.map((g) => {
            const c = groupColor(g);
            return (
              <span
                key={g}
                data-group-pill
                className={cn(tagBase, c.bg, c.border, c.text, "shrink-0")}
              >
                {g}
              </span>
            );
          })}
          <span ref={ellipsisRef} className={cn(tagBase, "shrink-0")}>
            …
          </span>
        </div>

        <div
          className="flex min-w-0 items-center overflow-hidden"
          style={{ gap: GROUPS_GAP_PX }}
        >
          {groups.slice(0, visibleCount).map((g) => {
            const c = groupColor(g);
            return (
              <span
                key={g}
                className={cn(tagBase, c.bg, c.border, c.text, "shrink-0")}
              >
                {g}
              </span>
            );
          })}
          {overflow > 0 && (
            <span
              ref={tipAnchorRef}
              className={cn(
                tagBase,
                "shrink-0 border-border bg-muted text-muted-foreground",
              )}
              onMouseEnter={showTip}
              onMouseLeave={hideTip}
            >
              …
            </span>
          )}
        </div>
      </div>
      {tipOpen &&
        overflow > 0 &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[10050] max-w-[min(360px,calc(100vw-16px))] break-words rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-md"
            style={{ top: tipPos.top, left: tipPos.left }}
          >
            {tipLabel}
          </div>,
          document.body,
        )}
    </>
  );
}
