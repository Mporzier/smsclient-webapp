"use client";

import { useI18n } from "@/lib/i18n";
import { RotateCcw, Users } from "lucide-react";
import { useCallback, useState } from "react";
import {
  ConfirmDeleteAlertDialog,
  ConfirmInfoCard,
  confirmCardBlueCls,
  confirmCardBlueIconCls,
  confirmCardDestructiveCls,
  confirmCardDestructiveIconCls,
  confirmRestorePathCls,
} from "./ConfirmInfoCard";

type ConfirmContactDeleteModalProps = {
  open: boolean;
  count: number;
  /** Titre « Supprimer ce contact ? » (modale édition) vs « Supprimer N contact(s) ? » (liste). */
  fromEdit?: boolean;
  /** Au-dessus d'une autre modale (ex. édition de contact). */
  stacked?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function ConfirmContactDeleteModal({
  open,
  count,
  fromEdit = false,
  stacked = false,
  onConfirm,
  onCancel,
}: ConfirmContactDeleteModalProps) {
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
      setError(
        e instanceof Error ? e.message : t("common.errorOccurred"),
      );
      setLoading(false);
    }
  }, [onConfirm, t]);

  const title = fromEdit
    ? "Supprimer ce contact ?"
    : count === 1
      ? "Supprimer 1 contact ?"
      : `Supprimer ${count} contacts ?`;

  const removedFromGroups =
    count === 1
      ? "Le contact sera retiré de ses groupes."
      : "Les contacts seront retirés de leurs groupes.";

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
        icon={Users}
        iconClassName={confirmCardDestructiveIconCls}
        className={confirmCardDestructiveCls}
        title="Vos groupes ne seront pas supprimés"
      >
        {removedFromGroups}
      </ConfirmInfoCard>
      <ConfirmInfoCard
        icon={RotateCcw}
        iconClassName={confirmCardBlueIconCls}
        className={confirmCardBlueCls}
        title="Restauration possible"
      >
        {count === 1 ? (
          <>
            Vous pouvez le restaurer à tout moment dans
            <br />
            <span className={confirmRestorePathCls}>Paramètres → Corbeille</span>
          </>
        ) : (
          <>
            Vous pouvez les restaurer à tout moment dans
            <br />
            <span className={confirmRestorePathCls}>Paramètres → Corbeille</span>
          </>
        )}
      </ConfirmInfoCard>
    </ConfirmDeleteAlertDialog>
  );
}
