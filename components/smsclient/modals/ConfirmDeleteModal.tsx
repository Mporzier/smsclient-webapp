"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { AlertTriangle } from "lucide-react";
import { useCallback, useState } from "react";
import {
  ConfirmDialogHeader,
  confirmAlertContentCls,
  confirmDialogMediaDestructiveCls,
} from "./ConfirmInfoCard";
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
  /** Au-dessus d'une autre modale (ex. édition de groupe). */
  stacked?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function ConfirmDeleteModal({
  open,
  title,
  description,
  confirmLabel,
  stacked = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const { t } = useI18n();
  const resolvedConfirm = confirmLabel ?? t("common.delete");
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
      setError(
        e instanceof Error ? e.message : t("common.errorOccurred"),
      );
      setLoading(false);
    }
  }, [onConfirm, t]);

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
          confirmAlertContentCls(stacked),
          stacked ? dialogContentStackedZCls : dialogContentZCls,
        )}
        onOutsideDismiss={() => {
          if (!loading) onCancel();
        }}
        onEscapeKeyDown={(e) => {
          if (loading) e.preventDefault();
        }}
      >
        <ConfirmDialogHeader
          title={title}
          media={<AlertTriangle aria-hidden />}
          mediaClassName={confirmDialogMediaDestructiveCls}
          description={description}
        />

        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="cursor-pointer">
            {t("common.cancel")}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={() => void handleConfirm()}
            className="cursor-pointer"
          >
            {loading ? t("common.deleting") : resolvedConfirm}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
