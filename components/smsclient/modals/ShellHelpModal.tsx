"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  clampFloatingPanelPos,
  defaultFloatingPanelPos,
  FLOATING_PANEL_MARGIN,
} from "@/lib/floatingPanelPosition";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  HELP_FAQ_ICON_SURFACE_CLS,
  helpFaqMessagePrefix,
  listHelpFaqItems,
  type HelpFaqItemId,
} from "@/lib/helpSectionFaq";
import { knowledgeBaseArticleUrl } from "@/lib/knowledgeBase";
import {
  guideMessageKey,
  SECTION_GUIDES,
  type SectionGuideKey,
} from "@/lib/sectionGuides";
import {
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Play,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { formDialogContentCls } from "./modalChrome";

const PANEL_W = 720;
const PANEL_ESTIMATE_H = 520;

export type ShellHelpModalProps = {
  section: SectionGuideKey;
  open: boolean;
  onClose: () => void;
};

function faqTitleKey(
  section: SectionGuideKey,
  itemId: HelpFaqItemId,
): MessageKey {
  if (itemId === "overview") {
    return guideMessageKey(section, "title");
  }
  return `${helpFaqMessagePrefix(section, itemId)}.title` as MessageKey;
}

function faqTeaserKey(
  section: SectionGuideKey,
  itemId: HelpFaqItemId,
): MessageKey {
  if (itemId === "overview") {
    return guideMessageKey(section, "desc");
  }
  return `${helpFaqMessagePrefix(section, itemId)}.teaser` as MessageKey;
}

const FAQ_STEP_MAX = 12;

function faqIntroKey(
  section: SectionGuideKey,
  itemId: HelpFaqItemId,
): MessageKey {
  if (itemId === "overview") {
    return guideMessageKey(section, "desc");
  }
  return `${helpFaqMessagePrefix(section, itemId)}.intro` as MessageKey;
}

function collectFaqSteps(
  t: (key: MessageKey) => string,
  section: SectionGuideKey,
  itemId: HelpFaqItemId,
): string[] {
  if (itemId === "overview") {
    return [
      guideMessageKey(section, "b1"),
      guideMessageKey(section, "b2"),
      guideMessageKey(section, "b3"),
    ]
      .map((key) => t(key))
      .filter((line) => line.trim().length > 0);
  }
  const prefix = helpFaqMessagePrefix(section, itemId);
  const steps: string[] = [];
  for (let i = 1; i <= FAQ_STEP_MAX; i += 1) {
    const key = `${prefix}.s${i}` as MessageKey;
    const raw = t(key);
    if (raw === key || !raw.trim()) break;
    steps.push(raw);
  }
  return steps;
}

function resolveFaqIntro(
  t: (key: MessageKey) => string,
  section: SectionGuideKey,
  itemId: HelpFaqItemId,
): string {
  const introKey = faqIntroKey(section, itemId);
  const raw = t(introKey);
  if (raw !== introKey && raw.trim()) return raw;
  return t(faqTeaserKey(section, itemId));
}

type HelpFaqCardProps = {
  title: string;
  teaser: string;
  icon: LucideIcon;
  iconWrapClassName: string;
  onClick: () => void;
};

function HelpFaqCard({
  title,
  teaser,
  icon: Icon,
  iconWrapClassName,
  onClick,
}: HelpFaqCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-left",
        "transition-colors hover:border-violet-300 hover:bg-violet-50/50 dark:hover:border-violet-700 dark:hover:bg-violet-950/30",
      )}
    >
      <span
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-lg",
          iconWrapClassName,
        )}
        aria-hidden
      >
        <Icon className="size-[18px]" strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug text-foreground">
          {title}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
          {teaser}
        </span>
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground"
        strokeWidth={2}
        aria-hidden
      />
    </button>
  );
}

type ShellHelpModalBodyProps = Omit<ShellHelpModalProps, "open"> & {
  titleId: string;
  closeRef: RefObject<HTMLButtonElement | null>;
};

function ShellHelpModalBody({
  section,
  onClose,
  titleId,
  closeRef,
}: ShellHelpModalBodyProps) {
  const { t } = useI18n();
  const meta = SECTION_GUIDES[section];
  const listId = useId();
  const items = useMemo(
    () => listHelpFaqItems(section, meta.icon),
    [section, meta.icon],
  );
  const [activeId, setActiveId] = useState<HelpFaqItemId | null>(null);

  const subtitleKey = `helpFaq.${section}.subtitle` as MessageKey;
  const subtitleRaw = t(subtitleKey);
  const subtitle =
    subtitleRaw === subtitleKey
      ? t("helpFaq.fallback.subtitle")
      : subtitleRaw;

  const discoverTitleKey =
    `helpFaq.${section}.discover.title` as MessageKey;
  const discoverTeaserKey =
    `helpFaq.${section}.discover.teaser` as MessageKey;
  const discoverTitleRaw = t(discoverTitleKey);
  const discoverTitle =
    discoverTitleRaw === discoverTitleKey
      ? t("helpFaq.fallback.discover.title", {
          section: t(guideMessageKey(section, "eyebrow")),
        })
      : discoverTitleRaw;
  const discoverTeaserRaw = t(discoverTeaserKey);
  const discoverTeaser =
    discoverTeaserRaw === discoverTeaserKey
      ? t("helpFaq.fallback.discover.teaser")
      : discoverTeaserRaw;

  const activeItem = activeId
    ? items.find((item) => item.id === activeId)
    : undefined;

  const detailIntro =
    activeItem && activeId
      ? resolveFaqIntro(t, section, activeId)
      : "";
  const steps =
    activeItem && activeId
      ? collectFaqSteps(t, section, activeId)
      : [];
  const DetailIcon = activeItem?.icon;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative shrink-0 px-5 py-4 sm:px-6 sm:py-5">
        <Button
          ref={closeRef}
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-foreground sm:top-4 sm:right-4"
          aria-label={t("float.close")}
          onClick={onClose}
        >
          <X className="size-4" strokeWidth={2.25} aria-hidden />
        </Button>
        {activeItem && DetailIcon ? (
          <div className="flex items-center gap-2.5 pr-10">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label={t("helpFaq.back")}
              onClick={() => setActiveId(null)}
            >
              <ChevronLeft className="size-4" strokeWidth={2.25} aria-hidden />
            </Button>
            <span
              className={cn(
                "inline-flex size-10 shrink-0 items-center justify-center rounded-lg",
                activeItem.iconWrapClassName,
              )}
              aria-hidden
            >
              <DetailIcon className="size-[18px]" strokeWidth={2.25} />
            </span>
            <h2
              id={titleId}
              className="min-w-0 text-lg font-bold leading-snug sm:text-xl"
            >
              {t(faqTitleKey(section, activeItem.id))}
            </h2>
          </div>
        ) : (
          <div className="flex items-center gap-2 pr-10">
            <span className="shrink-0 p-3" aria-hidden>
              <CircleHelp
                className="size-8 text-foreground"
                strokeWidth={2.25}
              />
            </span>
            <div className="min-w-0 space-y-1">
              <h2
                id={titleId}
                className="text-xl font-bold leading-snug sm:text-2xl"
              >
                {t("helpFaq.panelTitle")}
              </h2>
              <p className="m-0 text-sm leading-snug text-muted-foreground sm:text-[15px]">
                {subtitle}
              </p>
            </div>
          </div>
        )}
      </div>

      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto px-5 sm:px-6",
          activeItem ? "pb-4 pt-1 sm:pb-5 sm:pt-1.5" : "py-4 sm:py-5",
        )}
      >
        {activeItem ? (
          <div>
            <p className="m-0 text-sm leading-relaxed text-foreground sm:text-[15px]">
              {detailIntro}
            </p>
            <div className="mt-7">
              <p className="m-0 text-sm font-semibold text-foreground">
                {t("helpFaq.stepsLabel")}
              </p>
              <ol className="m-0 mt-3.5 grid list-none gap-2 p-0">
                {steps.map((step, index) => (
                  <li
                    key={`${index}-${step.slice(0, 24)}`}
                    className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-3 py-1"
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold leading-none tabular-nums",
                        HELP_FAQ_ICON_SURFACE_CLS,
                      )}
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 text-sm leading-6 text-foreground">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : (
          <ul
            id={listId}
            className="m-0 grid list-none gap-2 p-0"
            role="list"
          >
            {items.map((item) => {
              const ItemIcon = item.icon;
              return (
                <li key={item.id}>
                  <HelpFaqCard
                    title={t(faqTitleKey(section, item.id))}
                    teaser={t(faqTeaserKey(section, item.id))}
                    icon={ItemIcon}
                    iconWrapClassName={item.iconWrapClassName}
                    onClick={() => setActiveId(item.id)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 px-5 pb-4 pt-1 sm:px-6 sm:pb-5">
        <a
          href={knowledgeBaseArticleUrl(meta.kbSlug)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3",
            "transition-colors hover:border-violet-300 hover:bg-violet-50/40 dark:hover:border-violet-700 dark:hover:bg-violet-950/25",
          )}
        >
          <span
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-800 text-white dark:bg-violet-950"
            aria-hidden
          >
            <Play className="size-4 fill-current pl-0.5" strokeWidth={0} />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block text-sm font-semibold leading-snug text-foreground">
              {discoverTitle}
            </span>
            <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
              {discoverTeaser}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-3">
            <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium leading-none text-muted-foreground">
              {t("helpFaq.discover.duration")}
            </span>
            <ChevronRight
              className="size-5 text-muted-foreground"
              strokeWidth={2}
              aria-hidden
            />
          </span>
        </a>
      </div>
    </div>
  );
}

export function ShellHelpModal({
  section,
  open,
  onClose,
}: ShellHelpModalProps) {
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

  const [pos, setPos] = useState(() =>
    defaultFloatingPanelPos(PANEL_W),
  );
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPos((prev) => {
      const el = panelRef.current;
      const w = el?.offsetWidth ?? PANEL_W;
      const h = el?.offsetHeight ?? PANEL_ESTIMATE_H;
      const initial =
        prev.x === FLOATING_PANEL_MARGIN && prev.y === FLOATING_PANEL_MARGIN
          ? defaultFloatingPanelPos(w)
          : prev;
      return clampFloatingPanelPos(initial, w, h);
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
      setPos((p) => clampFloatingPanelPos(p, el.offsetWidth, el.offsetHeight));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (
        target.closest("button, a, input, textarea, select, [role='button']")
      ) {
        return;
      }
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
    [pos.x, pos.y],
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
    setPos(clampFloatingPanelPos(next, el.offsetWidth, el.offsetHeight));
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

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      id="shell-help-modal"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className={cn(
        "fixed z-50 w-[min(720px,calc(100vw-32px))] cursor-grab touch-none active:cursor-grabbing",
        dragging && "cursor-grabbing select-none",
      )}
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        className={cn(
          formDialogContentCls,
          "flex max-h-[min(92dvh,840px)] flex-col rounded-lg border border-border shadow-[0_0_44px_10px_rgba(15,23,42,0.22)] ring-0 dark:shadow-[0_0_44px_12px_rgba(0,0,0,0.58)]",
        )}
      >
        <ShellHelpModalBody
          key={section}
          section={section}
          onClose={onClose}
          titleId={titleId}
          closeRef={closeRef}
        />
      </div>
    </div>
  );
}
