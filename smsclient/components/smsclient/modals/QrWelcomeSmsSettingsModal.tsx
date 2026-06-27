"use client";

import { SmsMessageComposer } from "@/components/smsclient/CreateCampaign/SmsMessageComposer";
import { ProtoBtn } from "@/components/smsclient/ui";
import {
  modalCloseBtnCompact,
  overlayCls,
} from "@/components/smsclient/modals/modalChrome";
import { ModalPortal } from "@/components/smsclient/modals/ModalPortal";
import { handleModalBackdropClick, useModalFormDirty } from "@/components/smsclient/modals/modalFormGuard";
import {
  normalizePrenomTokens,
  SMS_PRENOM_PREVIEW_SAMPLE,
} from "@/lib/proto/smsPersonalization";
import { MessageCircle, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const shellCls =
  "flex max-h-[min(88dvh,640px)] w-full max-w-[560px] flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.20)]";

type QrWelcomeSmsSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  template: string;
  saving: boolean;
  onSave: (template: string) => Promise<void>;
};

export function QrWelcomeSmsSettingsModal({
  open,
  onClose,
  template,
  saving,
  onSave,
}: QrWelcomeSmsSettingsModalProps) {
  const [localTemplate, setLocalTemplate] = useState(template);

  useEffect(() => {
    if (open) setLocalTemplate(template);
  }, [open, template]);

  const normalizedLocal = useMemo(
    () => normalizePrenomTokens(localTemplate),
    [localTemplate],
  );
  const dirty = useModalFormDirty(
    open,
    normalizedLocal.trim(),
    (a, b) => a === b,
  );

  const handleClose = useCallback(() => {
    if (saving) return;
    onClose();
  }, [onClose, saving]);

  const handleSave = useCallback(async () => {
    if (!dirty || saving) return;
    await onSave(normalizedLocal);
    onClose();
  }, [dirty, normalizedLocal, onClose, onSave, saving]);

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
          aria-labelledby="qr-welcome-sms-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#2f6fed]/20 bg-[#eef4ff] text-[#2f6fed]">
                <MessageCircle className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2
                  id="qr-welcome-sms-modal-title"
                  className="m-0 text-base font-black text-slate-900"
                >
                  SMS de bienvenue
                </h2>
                <p className="m-0 mt-0.5 text-xs font-semibold text-slate-500">
                  Personnalisez le message envoyé après l&apos;inscription.
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
            <SmsMessageComposer
              value={localTemplate}
              onChange={setLocalTemplate}
              placeholder="Bonjour prénom, merci pour votre inscription…"
              estimateFirstName={SMS_PRENOM_PREVIEW_SAMPLE}
            />
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 px-4 py-3">
            <ProtoBtn className="h-9 px-3 text-xs" disabled={saving} onClick={handleClose}>
              Annuler
            </ProtoBtn>
            <ProtoBtn
              primary
              className="h-9 px-3 text-xs"
              disabled={!dirty || saving}
              onClick={() => void handleSave()}
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </ProtoBtn>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
