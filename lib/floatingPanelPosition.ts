export const FLOATING_PANEL_MARGIN = 16;

type Pos = { x: number; y: number };

export function defaultFloatingPanelPos(panelWidth: number): Pos {
  if (typeof window === "undefined") {
    return { x: FLOATING_PANEL_MARGIN, y: FLOATING_PANEL_MARGIN };
  }
  return {
    x: Math.max(
      FLOATING_PANEL_MARGIN,
      window.innerWidth - panelWidth - FLOATING_PANEL_MARGIN,
    ),
    y: FLOATING_PANEL_MARGIN + 72,
  };
}

export function clampFloatingPanelPos(
  pos: Pos,
  width: number,
  height: number,
): Pos {
  const maxX = Math.max(
    FLOATING_PANEL_MARGIN,
    window.innerWidth - width - FLOATING_PANEL_MARGIN,
  );
  const maxY = Math.max(
    FLOATING_PANEL_MARGIN,
    window.innerHeight - height - FLOATING_PANEL_MARGIN,
  );
  return {
    x: Math.min(Math.max(FLOATING_PANEL_MARGIN, pos.x), maxX),
    y: Math.min(Math.max(FLOATING_PANEL_MARGIN, pos.y), maxY),
  };
}
