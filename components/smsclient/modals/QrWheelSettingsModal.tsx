"use client";

import { QrWheelSettings } from "@/components/smsclient/views/QrWheelSettings";
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

type QrWheelSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  config: QrWheelConfig | null;
  loading: boolean;
  saving: boolean;
  onSave: (config: QrWheelConfig) => Promise<void>;
  onEnableWithDefaults: () => Promise<void>;
};

export function QrWheelSettingsModal({
  open,
  onClose,
  config,
  loading,
  saving,
  onSave,
  onEnableWithDefaults,
}: QrWheelSettingsModalProps) {
  const { t } = useI18n();

  const handleClose = useCallback(() => {
    if (saving) return;
    onClose();
  }, [onClose, saving]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={!saving}
        overlayClassName={dialogOverlayCls}
        className={cn(
          formDialogContentCls,
          "max-h-[min(88dvh,760px)] sm:max-w-[680px]",
          dialogContentZCls
        )}
        onOpenAutoFocus={preventDialogOpenAutoFocus}
        onPointerDownOutside={(e) => {
          if (saving) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (saving) e.preventDefault();
        }}
      >
        <FormDialogHeader
          className="items-start px-4 py-3.5"
          bareIcon
          icon={
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-200/80 bg-amber-50 text-amber-600">
              <Gift className="h-4 w-4" aria-hidden />
            </span>
          }
          title={t("qr.modal.wheel.title")}
          titleClassName="font-black"
          description={t("qr.modal.wheel.desc")}
          descriptionClassName="font-semibold"
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <QrWheelSettings
            embedded
            config={config}
            loading={loading}
            saving={saving}
            onSave={onSave}
            onEnableWithDefaults={onEnableWithDefaults}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
