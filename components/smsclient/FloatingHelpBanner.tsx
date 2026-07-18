"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { knowledgeBaseArticleUrl } from "@/lib/knowledgeBase";
import { HELP_ACTIONS } from "@/lib/proto/helpActions";
import {
  SECTION_GUIDES,
  type SectionGuideKey,
} from "@/lib/sectionGuides";
import { cn } from "@/lib/utils";
import { BookOpen, GripVertical, Sparkles, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

const BANNER_W = 400;
const MARGIN = 16;

type Pos = { x: number; y: number };

function defaultPos(): Pos {
  if (typeof window === "undefined") return { x: MARGIN, y: MARGIN };
  return {
    x: Math.max(MARGIN, window.innerWidth - BANNER_W - MARGIN),
    y: MARGIN + 72,
  };
}

function clampPos(pos: Pos, width: number, height: number): Pos {
  const maxX = Math.max(MARGIN, window.innerWidth - width - MARGIN);
  const maxY = Math.max(MARGIN, window.innerHeight - height - MARGIN);
  return {
    x: Math.min(Math.max(MARGIN, pos.x), maxX),
    y: Math.min(Math.max(MARGIN, pos.y), maxY),
  };
}

export type FloatingHelpBannerProps = {
  section: SectionGuideKey;
  open: boolean;
  onClose: () => void;
  onNavigate?: (hash: string) => void;
};

export function FloatingHelpBanner({
  section,
  open,
  onClose,
  onNavigate,
}: FloatingHelpBannerProps) {
  const guide = SECTION_GUIDES[section];
  const Icon = guide.icon;
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const [pos, setPos] = useState<Pos>(defaultPos);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPos((prev) => {
      const el = panelRef.current;
      const w = el?.offsetWidth ?? BANNER_W;
      const h = el?.offsetHeight ?? 320;
      return clampPos(prev.x === 0 && prev.y === 0 ? defaultPos() : prev, w, h);
    });
    closeRef.current?.focus();
  }, [open, section]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      const el = panelRef.current;
      if (!el) return;
      setPos((p) => clampPos(p, el.offsetWidth, el.offsetHeight));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const el = panelRef.current;
      if (!el) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        origX: pos.x,
        origY: pos.y,
      };
      setDragging(true);
    },
    [pos.x, pos.y]
  );

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const el = panelRef.current;
    if (!el) return;
    const next = {
      x: drag.origX + (e.clientX - drag.startX),
      y: drag.origY + (e.clientY - drag.startY),
    };
    setPos(clampPos(next, el.offsetWidth, el.offsetHeight));
  }, []);

  const endDrag = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }, []);

  const handlePrimary = () => {
    if (guide.primaryRoute && onNavigate) {
      onNavigate(guide.primaryRoute);
    }
  };

  const showPrimary = Boolean(
    guide.primaryRoute && onNavigate && guide.primaryLabel
  );

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      id="floating-help-banner"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className={cn(
        "fixed z-50 w-[min(400px,calc(100vw-32px))]",
        dragging && "select-none"
      )}
      style={{ left: pos.x, top: pos.y }}
    >
      <Card size="sm" className="shadow-lg">
        <CardHeader
          className={cn(
            "cursor-grab touch-none border-b active:cursor-grabbing",
            dragging && "cursor-grabbing"
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className="flex min-w-0 items-start gap-2.5 pr-8">
            <GripVertical
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div
              className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-muted text-foreground"
              aria-hidden
            >
              <Icon className="size-4" strokeWidth={2} />
            </div>
            <div className="min-w-0 space-y-1">
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <Sparkles className="size-3" aria-hidden />
                {guide.eyebrow}
              </span>
              <CardTitle id={titleId}>{guide.title}</CardTitle>
              <CardDescription>{guide.description}</CardDescription>
            </div>
          </div>
          <CardAction>
            <Button
              ref={closeRef}
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Fermer l'aide"
              onClick={onClose}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <X aria-hidden />
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-3">
          <ul className="m-0 grid list-none gap-1.5 p-0">
            {guide.bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex gap-2 text-sm leading-snug text-muted-foreground"
              >
                <span
                  className="mt-2 size-1 shrink-0 rounded-full bg-foreground/40"
                  aria-hidden
                />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-2">
            {showPrimary && guide.primaryLabel && (
              <Button type="button" size="sm" onClick={handlePrimary}>
                {guide.primaryLabel}
              </Button>
            )}
            <Button variant="link" size="sm" asChild>
              <a
                href={knowledgeBaseArticleUrl(guide.kbSlug)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <BookOpen data-icon="inline-start" aria-hidden />
                Base de connaissance
              </a>
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex-wrap gap-1.5">
          {HELP_ACTIONS.slice(0, 3).map((action) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={action.label}
                type="button"
                variant="outline"
                size="xs"
                onClick={action.onClick}
              >
                <ActionIcon data-icon="inline-start" aria-hidden />
                {action.label}
              </Button>
            );
          })}
        </CardFooter>
      </Card>
    </div>
  );
}
