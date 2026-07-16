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
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { useCallback, useState } from "react";
import {
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
        overlayClassName={stacked ? dialogOverlayStackedCls : dialogOverlayCls}
        className={cn(
          stacked ? dialogContentStackedZCls : dialogContentZCls
        )}
        onOutsideDismiss={() => {
          if (!loading) onCancel();
        }}
        onEscapeKeyDown={(e) => {
          if (loading) e.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <AlertTriangle aria-hidden />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
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
            variant="destructive"
            disabled={loading}
            onClick={() => void handleConfirm()}
            className="cursor-pointer"
          >
            {loading ? "Suppression…" : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
