"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import {
  dialogContentStackedZCls,
  dialogOverlayStackedCls,
} from "@/components/smsclient/modals/modalChrome";

type CampaignWizardLeaveConfirmModalProps = {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
};

export function CampaignWizardLeaveConfirmModal({
  open,
  onStay,
  onLeave,
}: CampaignWizardLeaveConfirmModalProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onStay();
      }}
    >
      <AlertDialogContent
        overlayClassName={dialogOverlayStackedCls}
        className={dialogContentStackedZCls}
        onOutsideDismiss={onStay}
      >
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            <AlertTriangle aria-hidden />
          </AlertDialogMedia>
          <AlertDialogTitle>Quitter la création de campagne ?</AlertDialogTitle>
          <AlertDialogDescription>
            Vous avez commencé à remplir le formulaire (destinataires, message,
            etc.). Si vous quittez maintenant, ces modifications seront perdues.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onStay}>Rester</AlertDialogCancel>
          <AlertDialogAction
            variant="default"
            className="bg-amber-600 text-white hover:bg-amber-700 hover:text-white"
            onClick={onLeave}
          >
            Quitter sans enregistrer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
