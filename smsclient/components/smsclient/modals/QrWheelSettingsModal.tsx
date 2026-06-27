"use client";

import { QrWheelSettings } from "@/components/smsclient/views/QrWheelSettings";
import type { QrWheelConfig } from "@/lib/types/qrWheel";
import { Gift, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  modalCloseBtnCompact,
  overlayCls,
} from "@/components/smsclient/modals/modalChrome";
import { ModalPortal } from "@/components/smsclient/modals/ModalPortal";
import { handleModalBackdropClick } from "@/components/smsclient/modals/modalFormGuard";

const shellCls =
  "flex max-h-[min(88dvh,760px)] w-full max-w-[680px] flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.20)]";

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

  const handleClose = useCallback(() => {
    if (saving) return;
    onClose();
  }, [onClose, saving]);

  useEffect(() => {
    if (!open) setDirty(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <ModalPortal>
      <div
        className={overlayCls}
        onClick={(e) => handleModalBackdropClick(e, handleClose, dirty, !saving)}
      >
        <div
          className={shellCls}
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-wheel-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-200/80 bg-amber-50 text-amber-600">
                <Gift className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2
                  id="qr-wheel-modal-title"
                  className="m-0 text-base font-black text-slate-900"
                >
                  Configurer la roue
                </h2>
                <p className="m-0 mt-0.5 text-xs font-semibold text-slate-500">
                  Personnalisez les récompenses et les options de la roue.
                </p>
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
        </div>
      </div>
    </ModalPortal>
  );
}
