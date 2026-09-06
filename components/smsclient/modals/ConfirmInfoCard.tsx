"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import {
  dialogContentStackedZCls,
  dialogContentZCls,
  dialogOverlayCls,
  dialogOverlayStackedCls,
} from "./modalChrome";

type ConfirmInfoCardProps = {
  icon: LucideIcon;
  className: string;
  iconClassName?: string;
  iconWrapClassName?: string;
  title: string;
  children: ReactNode;
};

export function ConfirmInfoCard({
  icon: Icon,
  className,
  iconClassName,
  iconWrapClassName,
  title,
  children,
}: ConfirmInfoCardProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-xl p-3",
        className,
      )}
    >
      {iconWrapClassName ? (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full p-1.5",
            iconWrapClassName,
          )}
        >
          <Icon className={cn("h-5 w-5", iconClassName)} aria-hidden />
        </span>
      ) : (
        <Icon className={cn("h-6 w-6 shrink-0", iconClassName)} aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-snug">{title}</p>
        <div className="mt-0.5 text-xs leading-snug">{children}</div>
      </div>
    </div>
  );
}

export const confirmDialogHeaderCls =
  "!grid !grid-cols-[2.5rem_minmax(0,1fr)] !grid-rows-[auto_auto] !gap-x-4 !gap-y-2 !place-items-start !text-left";

export const confirmDialogMediaBaseCls =
  "!col-start-1 !row-span-2 !row-start-1 !mb-0 !self-start";

export const confirmDialogMediaDestructiveCls =
  "rounded-full bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive";

export const confirmDialogMediaAmberCls =
  "rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";

export const confirmDialogMediaPrimaryCls =
  "rounded-full bg-primary/10 text-primary dark:bg-primary/20";

export const confirmDialogMediaEmeraldCls =
  "rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";

export const confirmCardEmeraldCls =
  "bg-emerald-100 text-foreground dark:bg-emerald-500/20";

export const confirmCardEmeraldIconCls =
  "text-emerald-700 dark:text-emerald-300";

/** @deprecated use confirmDialogMediaBaseCls + confirmDialogMediaDestructiveCls */
export const confirmDialogMediaCls = cn(
  confirmDialogMediaBaseCls,
  confirmDialogMediaDestructiveCls,
);

export const confirmDialogDescriptionCls =
  "!col-start-2 !row-start-2 text-left text-muted-foreground";

/** Header icône + titre + cards ou description — grid fixe partagée. */
export function ConfirmDialogHeader({
  title,
  media,
  mediaClassName,
  description,
  children,
}: {
  title: ReactNode;
  media: ReactNode;
  mediaClassName?: string;
  /** Texte simple sous le titre (loading, résumé, etc.). */
  description?: ReactNode;
  /** Bloc cards ConfirmInfoCard. */
  children?: ReactNode;
}) {
  return (
    <AlertDialogHeader className={confirmDialogHeaderCls}>
      <AlertDialogMedia
        className={cn(confirmDialogMediaBaseCls, mediaClassName)}
      >
        {media}
      </AlertDialogMedia>
      <AlertDialogTitle className={confirmDialogTitleCls}>{title}</AlertDialogTitle>
      {children != null ? (
        <AlertDialogDescription asChild>
          <div className={confirmInfoCardsCls}>{children}</div>
        </AlertDialogDescription>
      ) : description != null ? (
        <AlertDialogDescription className={confirmDialogDescriptionCls}>
          {description}
        </AlertDialogDescription>
      ) : null}
    </AlertDialogHeader>
  );
}

/** Header trash + titre + cards — layout delete standard. */
export function ConfirmDeleteDialogHeader({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <ConfirmDialogHeader
      title={title}
      media={<Trash2 aria-hidden />}
      mediaClassName={confirmDialogMediaDestructiveCls}
    >
      {children}
    </ConfirmDialogHeader>
  );
}

export const confirmDialogWideCls = "!max-w-md sm:!max-w-md";

/** Shell AlertDialogContent aligné modales confirm info. */
export function confirmAlertContentCls(stacked = false) {
  return cn(
    "!max-w-md sm:!max-w-md",
    stacked ? dialogContentStackedZCls : dialogContentZCls,
  );
}

export const confirmDialogTitleCls =
  "!col-start-2 !row-start-1 !m-0 text-left";

export const confirmInfoCardsCls =
  "!col-start-2 !row-start-2 flex w-full min-w-0 flex-col gap-2 !text-foreground";

export const confirmRestorePathCls =
  "font-bold text-[#2f6fed] dark:text-primary";

export const confirmCardBlueCls =
  "bg-[#eef4ff] text-foreground dark:bg-primary/10";

export const confirmCardBlueIconCls = "text-[#2f6fed] dark:text-primary";

export const confirmCardDestructiveCls =
  "bg-destructive/10 text-foreground dark:bg-destructive/20";

export const confirmCardDestructiveIconCls =
  "text-destructive dark:text-destructive";

export const confirmCardAmberCls =
  "bg-amber-50 text-foreground dark:bg-amber-500/10";

export const confirmCardAmberIconCls =
  "text-amber-700 dark:text-amber-400";

type ConfirmDeleteAlertDialogProps = {
  open: boolean;
  stacked?: boolean;
  title: ReactNode;
  loading: boolean;
  error?: string | null;
  cancelLabel: string;
  confirmLabel: string;
  deletingLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  children: ReactNode;
};

/** Shell AlertDialog delete — spacing calé sur ConfirmLinkDeleteModal. */
export function ConfirmDeleteAlertDialog({
  open,
  stacked = false,
  title,
  loading,
  error,
  cancelLabel,
  confirmLabel,
  deletingLabel,
  onCancel,
  onConfirm,
  children,
}: ConfirmDeleteAlertDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !loading) onCancel();
      }}
    >
      <AlertDialogContent
        overlayClassName={stacked ? dialogOverlayStackedCls : dialogOverlayCls}
        className={confirmAlertContentCls(stacked)}
        onOutsideDismiss={() => {
          if (!loading) onCancel();
        }}
        onEscapeKeyDown={(e) => {
          if (loading) e.preventDefault();
        }}
      >
        <ConfirmDeleteDialogHeader title={title}>{children}</ConfirmDeleteDialogHeader>

        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="cursor-pointer">
            {cancelLabel}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={onConfirm}
            className="cursor-pointer"
          >
            {loading ? deletingLabel : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
