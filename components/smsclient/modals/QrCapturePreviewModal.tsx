"use client";

import { QrWheelPreview } from "@/components/smsclient/views/QrWheelPreview";
import type { QrWheelConfig } from "@/lib/types/qrWheel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Gift, X } from "lucide-react";
import { useCallback } from "react";
import {
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  modalCloseBtnCompact,
} from "./modalChrome";

type QrCapturePreviewModalProps = {
  open: boolean;
  onClose: () => void;
  wheelConfig: QrWheelConfig | null;
  wheelLoading: boolean;
};

export function QrCapturePreviewModal({
  open,
  onClose,
  wheelConfig,
  wheelLoading,
}: QrCapturePreviewModalProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName={dialogOverlayCls}
        className={cn(
          formDialogContentCls,
          "max-h-[min(86dvh,720px)] sm:max-w-[560px]",
          dialogContentZCls
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3.5">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-200/80 bg-amber-50 text-amber-600">
              <Gift className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <DialogTitle
                id="qr-preview-modal-title"
                className="m-0 text-base font-black text-foreground"
              >
                Prévisualiser la roue
              </DialogTitle>
              <DialogDescription className="m-0 mt-0.5 text-xs font-semibold">
                Aperçu tel que vos clients le verront après l&apos;inscription.
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            className={modalCloseBtnCompact}
            aria-label="Fermer"
            onClick={handleClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
          <QrWheelPreview
            open={open}
            wheelConfig={wheelConfig}
            loading={wheelLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
