"use client";

import { cn } from "@/lib/cn";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  SMS_EMOJI_CATEGORIES,
  SMS_MARKETING_QUICK_EMOJIS,
} from "./smsEmojiData";

const PANEL_TRANSITION_MS = 140;

function EmojiBtn({
  emoji,
  onPick,
  size = "md",
}: {
  emoji: string;
  onPick: (emoji: string) => void;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      type="button"
      aria-label={`Insérer ${emoji}`}
      title={emoji}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPick(emoji);
      }}
      className={cn(
        "cursor-pointer rounded-xl border border-slate-200/80 bg-white text-center transition-colors",
        "hover:border-slate-300 hover:bg-slate-50 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fed]/30",
        size === "lg" && "grid h-10 w-10 place-items-center text-xl",
        size === "md" && "grid h-9 w-9 place-items-center text-lg",
        size === "sm" && "grid h-8 w-8 place-items-center text-base"
      )}
    >
      <span aria-hidden>{emoji}</span>
    </button>
  );
}

const PANEL_WIDTH = 296;

export function SmsEmojiPicker({
  open,
  onClose,
  onPick,
  anchorRef,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevOpenRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const margin = 8;
    let left = rect.left;
    const top = rect.bottom + margin;

    if (left + PANEL_WIDTH > window.innerWidth - margin) {
      left = window.innerWidth - PANEL_WIDTH - margin;
    }
    if (left < margin) left = margin;

    setPosition({ top, left });
  }, [anchorRef]);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const startClose = useCallback(() => {
    clearCloseTimer();
    setVisible(false);
    closeTimerRef.current = setTimeout(() => {
      setShown(false);
      closeTimerRef.current = null;
    }, PANEL_TRANSITION_MS);
  }, [clearCloseTimer]);

  const handlePick = useCallback(
    (emoji: string) => {
      onClose();
      requestAnimationFrame(() => onPick(emoji));
    },
    [onPick, onClose]
  );

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onLayout = () => updatePosition();
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [open, updatePosition]);

  useLayoutEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;

    if (open && !wasOpen) {
      clearCloseTimer();
      updatePosition();
      setShown(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    if (!open && wasOpen) {
      startClose();
    }
  }, [open, updatePosition, clearCloseTimer, startClose]);

  useEffect(() => {
    if (!shown) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [shown, onClose, anchorRef]);

  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shown, onClose]);

  if (!mounted || !shown || !position) return null;

  return createPortal(
    <div
      ref={panelRef}
      style={{
        top: position.top,
        left: position.left,
        width: PANEL_WIDTH,
        transitionDuration: `${PANEL_TRANSITION_MS}ms`,
      }}
      className={cn(
        "fixed z-[200] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]",
        "transition-opacity ease-out motion-reduce:transition-none",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      role="dialog"
      aria-label="Choisir un emoji"
      aria-hidden={!visible}
    >
      <div className="border-b border-slate-100 bg-gradient-to-b from-amber-50/80 to-white px-3.5 py-3">
        <p className="m-0 text-[11px] font-extrabold uppercase tracking-wide text-amber-800/80">
          Sélection rapide
        </p>
        <p className="m-0 mt-0.5 text-[10px] font-semibold text-slate-500">
          Les plus percutants pour vos campagnes
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1">
          {SMS_MARKETING_QUICK_EMOJIS.map((emoji) => (
            <EmojiBtn key={emoji} emoji={emoji} onPick={handlePick} size="lg" />
          ))}
        </div>
      </div>

      <div className="max-h-52 space-y-3.5 overflow-y-auto px-3.5 py-3 overscroll-contain">
        {SMS_EMOJI_CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <p className="m-0 mb-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
              {cat.label}
            </p>
            <div className="flex flex-wrap gap-0.5">
              {cat.emojis.map((emoji) => (
                <EmojiBtn
                  key={`${cat.label}-${emoji}`}
                  emoji={emoji}
                  onPick={handlePick}
                  size="sm"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
}
