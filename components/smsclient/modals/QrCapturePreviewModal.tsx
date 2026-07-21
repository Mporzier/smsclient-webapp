"use client";

import { QrWheelPreview } from "@/components/smsclient/views/QrWheelPreview";
import type { QrWheelConfig } from "@/lib/types/qrWheel";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Gift } from "lucide-react";
import { useCallback } from "react";
import {
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";
import { FormDialogHeader } from "./FormDialogHeader";

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
  const { t } = useI18n();
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
        showCloseButton
        overlayClassName={dialogOverlayCls}
        className={cn(
          formDialogContentCls,
          "max-h-[min(86dvh,720px)] sm:max-w-[560px]",
          dialogContentZCls
        )}
        onOpenAutoFocus={preventDialogOpenAutoFocus}
      >
        <FormDialogHeader
          className="items-start px-4 py-3.5"
          bareIcon
          icon={
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-200/80 bg-amber-50 text-amber-600">
              <Gift className="h-4 w-4" aria-hidden />
            </span>
          }
          title={t("qr.modal.preview.title")}
          titleClassName="font-black"
          description={t("qr.modal.preview.desc")}
          descriptionClassName="font-semibold"
        />

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
