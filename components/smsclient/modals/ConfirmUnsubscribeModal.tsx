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
import { BellOff, Scale } from "lucide-react";
import { useCallback, useState } from "react";
import {
  ConfirmDialogHeader,
  ConfirmInfoCard,
  confirmAlertContentCls,
  confirmCardAmberIconCls,
  confirmDialogMediaAmberCls,
} from "./ConfirmInfoCard";
import { dialogContentStackedZCls, dialogOverlayStackedCls } from "./modalChrome";

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
        overlayClassName={dialogOverlayStackedCls}
        className={cn(confirmAlertContentCls(true), dialogContentStackedZCls)}
        onOutsideDismiss={() => {
          if (!loading) onCancel();
        }}
        onEscapeKeyDown={(e) => {
          if (loading) e.preventDefault();
        }}
      >
        <ConfirmDialogHeader
          title={t("contact.unsub.title")}
          media={<BellOff aria-hidden />}
          mediaClassName={confirmDialogMediaAmberCls}
        >
          <ConfirmInfoCard
            icon={BellOff}
            iconWrapClassName="bg-amber-200 dark:bg-amber-500/35"
            iconClassName={confirmCardAmberIconCls}
            className="bg-amber-100 text-foreground dark:bg-amber-500/20"
            title="Plus de SMS"
          >
            <strong className="font-semibold">{contactLabel}</strong>{" "}
            {t("contact.unsub.body")}
          </ConfirmInfoCard>
          <ConfirmInfoCard
            icon={Scale}
            iconClassName="text-slate-600 dark:text-slate-300"
            className="bg-slate-100 text-foreground dark:bg-slate-500/10"
            title="Mention légale"
          >
            {t("contact.unsub.legal")}
          </ConfirmInfoCard>
        </ConfirmDialogHeader>

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
