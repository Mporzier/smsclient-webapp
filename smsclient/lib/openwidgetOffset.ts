const CLOSE_CLEARANCE_PX = 20;
const OVERLAY_SCROLLBAR_FALLBACK_PX = 17;

function measureScrollbarWidth(el: HTMLElement): number {
  return Math.max(0, el.offsetWidth - el.clientWidth);
}

function getEffectiveScrollbarWidth(el: HTMLElement): number {
  const measured = measureScrollbarWidth(el);
  if (measured > 0) return measured;

  if (el.scrollHeight <= el.clientHeight) return 0;

  const { scrollbarGutter } = getComputedStyle(el);
  if (scrollbarGutter.includes("stable")) {
    return OVERLAY_SCROLLBAR_FALLBACK_PX;
  }

  return OVERLAY_SCROLLBAR_FALLBACK_PX;
}

export function measureOpenWidgetRightOffsetPx(): number {
  if (typeof window === "undefined") return 48;

  const main = document.querySelector<HTMLElement>("[data-app-main-scroll]");
  if (!main) return 48;

  const mainRect = main.getBoundingClientRect();
  const columnRightInset = Math.max(0, window.innerWidth - mainRect.right);
  const scrollbar = getEffectiveScrollbarWidth(main);

  return columnRightInset + scrollbar + CLOSE_CLEARANCE_PX;
}

export function applyOpenWidgetRightOffset(): void {
  const container = document.getElementById("chat-widget-container");
  if (!container) return;

  const offset = `${measureOpenWidgetRightOffsetPx()}px`;

  document.documentElement.style.setProperty("--openwidget-right-offset", offset);

  if (
    container.style.getPropertyValue("right") === offset &&
    container.style.getPropertyPriority("right") === "important"
  ) {
    return;
  }

  container.style.setProperty("right", offset, "important");
}

/** Réapplique le décalage après ouverture / redimensionnement du widget. */
export function scheduleOpenWidgetRightOffsetSync(): void {
  applyOpenWidgetRightOffset();
  for (const delay of [50, 150, 400, 800]) {
    window.setTimeout(applyOpenWidgetRightOffset, delay);
  }
}
