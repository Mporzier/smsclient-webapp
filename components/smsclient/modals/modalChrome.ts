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

/** Shell Dialog formulaire (header / body scroll / footer). */
export const formDialogContentCls =
  "flex w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-[22px] border border-border bg-card p-0 text-left shadow-2xl ring-0";

/** Classes Button brand (ex-ProtoBtn). */
export const brandBtnCls =
  "h-11 cursor-pointer rounded-[14px] px-4 text-[15px] font-bold shadow-sm";
export const brandBtnPrimaryCls = `${brandBtnCls} shadow-md`;

/** Input brand (ex-classes `inp` locales). */
export const brandInputCls =
  "h-11 rounded-[14px] border-border bg-card px-3.5 text-[15px] font-bold text-foreground";

/** Shell icône header Dialog — styles via `.modal-icon` + CSS vars `--modal-icon-*`. */
export type ModalIconSize = "sm" | "md" | "lg";

export function modalIconCls(size: ModalIconSize = "md"): string {
  if (size === "sm") return "modal-icon modal-icon--sm";
  if (size === "lg") return "modal-icon modal-icon--lg";
  return "modal-icon";
}