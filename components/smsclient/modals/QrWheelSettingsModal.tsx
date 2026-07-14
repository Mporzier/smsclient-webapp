"use client";

import { QrWheelSettings } from "@/components/smsclient/views/QrWheelSettings";
import type { QrWheelConfig } from "@/lib/types/qrWheel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Gift, X } from "lucide-react";
import { useCallback, useState } from "react";
import {
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  modalCloseBtnCompact,
} from "./modalChrome";

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
  const [dirty, setDirty] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setDirty(false);
  }

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
        showCloseButton={false}
        overlayClassName={dialogOverlayCls}
        className={cn(
          formDialogContentCls,
          "max-h-[min(88dvh,760px)] sm:max-w-[680px]",
          dialogContentZCls
        )}
        onPointerDownOutside={(e) => {
          if (saving || dirty) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (saving || dirty) e.preventDefault();
        }}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3.5">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-200/80 bg-amber-50 text-amber-600">
              <Gift className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <DialogTitle
                id="qr-wheel-modal-title"
                className="m-0 text-base font-black text-foreground"
              >
                Configurer la roue
              </DialogTitle>
              <DialogDescription className="m-0 mt-0.5 text-xs font-semibold">
                Définissez les cases, leurs chances (100 % au total) et les
                messages envoyés aux clients.
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            className={modalCloseBtnCompact}
            aria-label="Fermer"
            disabled={saving}
            onClick={handleClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <QrWheelSettings
            embedded
            config={config}
            loading={loading}
            saving={saving}
            onSave={onSave}
            onEnableWithDefaults={onEnableWithDefaults}
            onDirtyChange={setDirty}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
