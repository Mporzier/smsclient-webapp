/** Legacy overlay — encore utilisé par modales non migrées. Tokens + z-index haut. */
export const overlayCls =
  "fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/55 p-6 backdrop-blur-sm";
/** Overlay au-dessus d’une autre modale (ex. création de groupe depuis contact). */
export const overlayStackedCls =
  "fixed inset-0 z-[10000] flex items-center justify-center bg-foreground/45 p-6 backdrop-blur-[2px]";

export const modalCard =
  "max-h-[min(82vh,760px)] w-full max-w-[980px] overflow-auto rounded-[22px] border border-border bg-card shadow-2xl";
export const modalCloseBtn =
  "grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-2xl border border-border bg-card text-lg font-black shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";
export const modalCloseBtnCompact =
  "grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl border border-border bg-card shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";

/** Classes Dialog (shadcn) — confirms et futures modales. */
export const dialogOverlayCls = "z-[9999] bg-foreground/55 backdrop-blur-sm";
export const dialogOverlayStackedCls =
  "z-[10000] bg-foreground/45 backdrop-blur-[2px]";
export const dialogContentZCls = "z-[9999]";
export const dialogContentStackedZCls = "z-[10001]";

/** Contenu confirm type alertdialog. */
export const confirmDialogContentCls =
  "max-h-[min(82vh,640px)] w-full max-w-[calc(100%-2rem)] gap-0 rounded-2xl border border-border bg-card p-5 text-left shadow-2xl ring-0 sm:max-w-[440px]";
