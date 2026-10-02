"use client";

import {
  QrCollectQrPanel,
  type QrCollectQrPanelProps,
} from "@/components/smsclient/views/QrCollectQrPanel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import { QrCode } from "lucide-react";
import {
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";
import { FormDialogHeader } from "./FormDialogHeader";
export type QrCollectQrModalProps = QrCollectQrPanelProps & {
  open: boolean;
  onClose: () => void;
};

export function QrCollectQrModal({
  open,
  onClose,
  ...panelProps
}: QrCollectQrModalProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton
        className={cn(
          formDialogContentCls,
          dialogContentZCls,
          "max-h-[min(90vh,820px)] max-w-[min(100vw-2rem,980px)]",
        )}
        onOpenAutoFocus={preventDialogOpenAutoFocus}
        overlayClassName={dialogOverlayCls}
      >
        <FormDialogHeader
          bareIcon
          icon={
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-[#eef4ff] text-[#2f6fed]">
              <QrCode className="h-5 w-5" strokeWidth={2.25} />
            </div>
          }
          title={t("qr.hub.qrModal.title")}
          description={t("qr.pageSubtitle")}
        />
        <QrCollectQrPanel
          {...panelProps}
          contentClassName="px-4 pb-4 pt-1"
        />
      </DialogContent>
    </Dialog>
  );
}
