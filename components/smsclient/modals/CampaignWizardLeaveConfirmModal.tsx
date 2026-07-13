"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import {
  confirmDialogContentCls,
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onStay();
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName={dialogOverlayStackedCls}
        className={cn(confirmDialogContentCls, dialogContentStackedZCls)}
      >
        <DialogHeader className="flex-row items-start gap-3 space-y-0 text-left">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base font-black text-foreground">
              Quitter la création de campagne ?
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-sm font-semibold leading-relaxed text-muted-foreground">
              Vous avez commencé à remplir le formulaire (destinataires,
              message, etc.). Si vous quittez maintenant, ces modifications
              seront perdues.
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="-mx-0 -mb-0 mt-1 rounded-none border-0 bg-transparent p-0 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onStay}
            className="h-11 cursor-pointer rounded-[14px] px-4 text-[15px] font-bold"
          >
            Rester
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={onLeave}
            className="h-11 cursor-pointer rounded-[14px] bg-amber-600 px-4 text-[15px] font-bold text-white hover:bg-amber-700 hover:text-white"
          >
            Quitter sans enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
