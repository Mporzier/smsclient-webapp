"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  confirmDialogContentCls,
  dialogContentStackedZCls,
  dialogContentZCls,
  dialogOverlayCls,
  dialogOverlayStackedCls,
} from "./modalChrome";

type ConfirmDeleteModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  /** Au-dessus d’une autre modale (ex. édition de groupe). */
  stacked?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function ConfirmDeleteModal({
  open,
  title,
  description,
  confirmLabel = "Supprimer",
  stacked = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setError(null);
    }
  }, [open]);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }, [onConfirm]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !loading) onCancel();
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName={stacked ? dialogOverlayStackedCls : dialogOverlayCls}
        className={cn(
          confirmDialogContentCls,
          "sm:max-w-[420px]",
          stacked ? dialogContentStackedZCls : dialogContentZCls
        )}
        onPointerDownOutside={(e) => {
          if (loading) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (loading) e.preventDefault();
        }}
      >
        <DialogHeader className="flex-row items-start gap-3 space-y-0 text-left">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base font-black text-foreground">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-sm font-semibold leading-relaxed text-muted-foreground">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive">
            {error}
          </p>
        )}

        <DialogFooter className="-mx-0 -mb-0 mt-1 rounded-none border-0 bg-transparent p-0 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={loading}
            onClick={onCancel}
            className="h-11 cursor-pointer rounded-[14px] px-4 text-[15px] font-bold"
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="lg"
            disabled={loading}
            onClick={() => void handleConfirm()}
            className="h-11 cursor-pointer rounded-[14px] bg-destructive px-4 text-[15px] font-bold text-white hover:bg-destructive/90 hover:text-white"
          >
            {loading ? "Suppression…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
