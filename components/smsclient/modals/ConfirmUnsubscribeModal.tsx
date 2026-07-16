"use client";

import { Button } from "@/components/ui/button";
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
import { BellOff } from "lucide-react";
import { useCallback, useState } from "react";
import {
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
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !loading) onCancel();
      }}
    >
      <AlertDialogContent
        size="default"
        overlayClassName={dialogOverlayStackedCls}
        className={dialogContentStackedZCls}
        onOutsideDismiss={() => {
          if (!loading) onCancel();
        }}
        onEscapeKeyDown={(e) => {
          if (loading) e.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            <BellOff aria-hidden />
          </AlertDialogMedia>
          <AlertDialogTitle>Désabonner ce contact ?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                <strong className="font-semibold text-foreground">
                  {contactLabel}
                </strong>{" "}
                ne recevra plus vos SMS marketing. Le contact reste dans votre
                liste, mais il sera exclu des prochaines campagnes et des envois
                groupés.
              </p>
              <p className="text-muted-foreground/90">
                Cette action enregistre son droit de retrait (STOP SMS)
                conformément aux règles d&apos;envoi.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="cursor-pointer">
            Annuler
          </AlertDialogCancel>
          <Button
            type="button"
            disabled={loading}
            onClick={() => void handleConfirm()}
            className="cursor-pointer bg-amber-600 text-white hover:bg-amber-700 hover:text-white"
          >
            {loading ? "Désabonnement…" : "Désabonner"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
