"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { SaveOff, TriangleAlert } from "lucide-react";
import {
  ConfirmDialogHeader,
  ConfirmInfoCard,
  confirmAlertContentCls,
  confirmCardAmberIconCls,
  confirmDialogMediaBaseCls,
} from "@/components/smsclient/modals/ConfirmInfoCard";
import { cn } from "@/lib/utils";
import { dialogOverlayStackedCls } from "@/components/smsclient/modals/modalChrome";

const leaveWarnSurfaceCls = "bg-amber-100 dark:bg-amber-500/20";

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
        className={confirmAlertContentCls(true)}
        onOutsideDismiss={onStay}
      >
        <ConfirmDialogHeader
          title="Quitter la création de campagne ?"
          media={<TriangleAlert aria-hidden />}
          mediaClassName={cn(
            confirmDialogMediaBaseCls,
            leaveWarnSurfaceCls,
            "rounded-full text-amber-700 dark:text-amber-400"
          )}
        >
          <ConfirmInfoCard
            icon={SaveOff}
            iconClassName={confirmCardAmberIconCls}
            className={leaveWarnSurfaceCls}
            title="Modifications perdues"
          >
            Vous avez commencé à remplir le formulaire. Si vous quittez
            maintenant, vos modifications seront perdues.
          </ConfirmInfoCard>
        </ConfirmDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onStay}>Rester</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onLeave}>
            Quitter sans enregistrer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
