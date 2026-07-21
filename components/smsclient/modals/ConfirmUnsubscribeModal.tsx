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
          <AlertDialogTitle>{t("contact.unsub.title")}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                <strong className="font-semibold text-foreground">
                  {contactLabel}
                </strong>{" "}
                {t("contact.unsub.body")}
              </p>
              <p className="text-muted-foreground/90">
                {t("contact.unsub.legal")}
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
            disabled={loading}
            onClick={() => void handleConfirm()}
            className="cursor-pointer bg-amber-600 text-white hover:bg-amber-700 hover:text-white"
          >
            {loading ? t("contact.unsub.busy") : t("contact.modal.unsubscribe")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
