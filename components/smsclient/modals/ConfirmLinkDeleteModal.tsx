"use client";

import { useI18n } from "@/lib/i18n";
import { Ban, Link2 } from "lucide-react";
import { useCallback, useState } from "react";
import {
  ConfirmDeleteAlertDialog,
  ConfirmInfoCard,
  confirmCardDestructiveCls,
  confirmCardDestructiveIconCls,
} from "./ConfirmInfoCard";

type ConfirmLinkDeleteModalProps = {
  open: boolean;
  shortUrl: string;
  originalUrl: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function ConfirmLinkDeleteModal({
  open,
  shortUrl,
  originalUrl,
  onConfirm,
  onCancel,
}: ConfirmLinkDeleteModalProps) {
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
    <ConfirmDeleteAlertDialog
      open={open}
      title={t("links.deleteTitle")}
      loading={loading}
      error={error}
      cancelLabel={t("common.cancel")}
      confirmLabel={t("common.delete")}
      deletingLabel={t("common.deleting")}
      onCancel={onCancel}
      onConfirm={() => void handleConfirm()}
    >
      <ConfirmInfoCard
        icon={Link2}
        iconClassName={confirmCardDestructiveIconCls}
        className={confirmCardDestructiveCls}
        title="Redirection désactivée"
      >
        Le lien court <strong className="font-semibold">{shortUrl}</strong> ne
        redirigera plus vers{" "}
        <strong className="font-semibold">{originalUrl}</strong>.
      </ConfirmInfoCard>
      <ConfirmInfoCard
        icon={Ban}
        iconClassName={confirmCardDestructiveIconCls}
        className={confirmCardDestructiveCls}
        title="Action définitive"
      >
        Cette suppression ne peut pas être annulée.
      </ConfirmInfoCard>
    </ConfirmDeleteAlertDialog>
  );
}
