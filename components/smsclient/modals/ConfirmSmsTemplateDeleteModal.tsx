"use client";

import { useI18n } from "@/lib/i18n";
import { Ban, LayoutTemplate } from "lucide-react";
import { useCallback, useState } from "react";
import {
  ConfirmDeleteAlertDialog,
  ConfirmInfoCard,
  confirmCardDestructiveCls,
  confirmCardDestructiveIconCls,
} from "./ConfirmInfoCard";

type ConfirmSmsTemplateDeleteModalProps = {
  open: boolean;
  count: number;
  stacked?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function ConfirmSmsTemplateDeleteModal({
  open,
  count,
  stacked = false,
  onConfirm,
  onCancel,
}: ConfirmSmsTemplateDeleteModalProps) {
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

  const title =
    count > 1
      ? t("templates.deleteManyTitle", { n: count })
      : t("templates.deleteTitle", { n: count || 1 });

  return (
    <ConfirmDeleteAlertDialog
      open={open}
      stacked={stacked}
      title={title}
      loading={loading}
      error={error}
      cancelLabel={t("common.cancel")}
      confirmLabel={t("common.delete")}
      deletingLabel={t("common.deleting")}
      onCancel={onCancel}
      onConfirm={() => void handleConfirm()}
    >
      <ConfirmInfoCard
        icon={LayoutTemplate}
        iconClassName={confirmCardDestructiveIconCls}
        className={confirmCardDestructiveCls}
        title="Modèle supprimé"
      >
        {count > 1 ? t("templates.deleteManyDesc") : t("templates.deleteDesc")}
      </ConfirmInfoCard>
      <ConfirmInfoCard
        icon={Ban}
        iconClassName="text-amber-700 dark:text-amber-400"
        className="bg-amber-50 text-foreground dark:bg-amber-500/10"
        title="Action définitive"
      >
        Cette action ne peut pas être annulée.
      </ConfirmInfoCard>
    </ConfirmDeleteAlertDialog>
  );
}
