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
import { BellOff } from "lucide-react";
import { useCallback, useState } from "react";
import {
  confirmDialogContentCls,
  dialogContentStackedZCls,
  dialogOverlayStackedCls,
} from "./modalChrome";

type ConfirmUnsubscribeModalProps = {
  open: boolean;
  contactLabel: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function ConfirmUnsubscribeModal({
  open,
  contactLabel,
  onConfirm,
  onCancel,
}: ConfirmUnsubscribeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) {
      setLoading(false);
      setError(null);
    }
  }

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
        overlayClassName={dialogOverlayStackedCls}
        className={cn(
          confirmDialogContentCls,
          "rounded-xl shadow-lg",
          dialogContentStackedZCls
        )}
        onPointerDownOutside={(e) => {
          if (loading) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (loading) e.preventDefault();
        }}
      >
        <DialogHeader className="flex-row items-start gap-3 space-y-0 text-left">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
            <BellOff className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
              Désabonner ce contact ?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="mt-1.5 space-y-2 text-sm font-normal leading-relaxed text-muted-foreground">
                <p>
                  <strong className="font-semibold text-foreground">
                    {contactLabel}
                  </strong>{" "}
                  ne recevra plus vos SMS marketing. Le contact reste dans votre
                  liste, mais il sera exclu des prochaines campagnes et des
                  envois groupés.
                </p>
                <p className="text-muted-foreground/90">
                  Cette action enregistre son droit de retrait (STOP SMS)
                  conformément aux règles d&apos;envoi.
                </p>
              </div>
            </DialogDescription>
          </div>
        </DialogHeader>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <DialogFooter className="-mx-0 -mb-0 mt-1 rounded-none border-0 bg-transparent p-0 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={onCancel}
            className="cursor-pointer"
          >
            Annuler
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={() => void handleConfirm()}
            className="cursor-pointer bg-amber-600 text-white hover:bg-amber-700 hover:text-white"
          >
            {loading ? "Désabonnement…" : "Désabonner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
