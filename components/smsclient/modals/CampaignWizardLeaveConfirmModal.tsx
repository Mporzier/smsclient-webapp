"use client";

import { ProtoBtn } from "@/components/smsclient/ui";
import { ModalPortal } from "@/components/smsclient/modals/ModalPortal";
import { overlayStackedCls } from "@/components/smsclient/modals/modalChrome";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onStay();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onStay]);

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
        className={overlayStackedCls}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="campaign-leave-title"
        onClick={(e) => e.target === e.currentTarget && onStay()}
      >
        <div className="w-full max-w-[440px] rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_28px_70px_rgba(15,23,42,0.20)]">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2
                id="campaign-leave-title"
                className="m-0 text-base font-black text-slate-900"
              >
                Quitter la création de campagne ?
              </h2>
              <p className="mt-1.5 text-sm font-semibold leading-relaxed text-slate-600">
                Vous avez commencé à remplir le formulaire (destinataires,
                message, etc.). Si vous quittez maintenant, ces modifications
                seront perdues.
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <ProtoBtn onClick={onStay}>Rester</ProtoBtn>
            <button
              type="button"
              onClick={onLeave}
              className="cursor-pointer rounded-xl border-none bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(217,119,6,0.25)] transition-all hover:bg-amber-700"
            >
              Quitter sans enregistrer
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
