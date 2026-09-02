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
import { useI18n } from "@/lib/i18n";
import { AlertTriangle } from "lucide-react";
import { useCallback, useState } from "react";
import {
  dialogContentStackedZCls,
  dialogOverlayStackedCls,
} from "./modalChrome";

type ConfirmCustomFieldDeleteModalProps = {
  open: boolean;
  labels: string[];
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function ConfirmCustomFieldDeleteModal({
  open,
  labels,
  onConfirm,
  onCancel,
}: ConfirmCustomFieldDeleteModalProps) {
  const { t } = useI18n();
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
      setError(e instanceof Error ? e.message : t("common.errorOccurred"));
      setLoading(false);
    }
  }, [onConfirm, t]);

  const n = labels.length;
  const title =
    n === 1
      ? t("customFields.deleteTitle", { label: labels[0] ?? "" })
      : n > 1
        ? t("customFields.deleteTitleMany", { n })
        : t("customFields.deleteTitleFallback");

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !loading) onCancel();
      }}
    >
      <AlertDialogContent
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
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <AlertTriangle aria-hidden />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                {n > 1
                  ? t("customFields.deleteBodyMany")
                  : t("customFields.deleteBody")}
              </p>
              <p className="font-medium text-foreground">
                {t("customFields.deleteIrreversible")}
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
            {t("common.cancel")}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={() => void handleConfirm()}
            className="cursor-pointer"
          >
            {loading
              ? t("common.deleting")
              : t("customFields.deleteConfirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
