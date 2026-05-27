"use client";

import { ProtoBtn } from "@/components/smsclient/ui";
import { overlayStackedCls } from "./modalChrome";
import { useCallback, useEffect, useState } from "react";
import { BellOff } from "lucide-react";

type ConfirmUnsubscribeModalProps = {
  open: boolean;
  contactLabel: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function ConfirmUnsubscribeModal({
  open,
  contactLabel,
  onConfirm,
  onCancel,
}: ConfirmUnsubscribeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }, [onConfirm]);

  if (!open) return null;

  return (
    <div
      className={overlayStackedCls}
      role="alertdialog"
      aria-modal
      aria-label="Confirmer le désabonnement"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-[440px] rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_28px_70px_rgba(15,23,42,0.20)]">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
            <BellOff className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="m-0 text-base font-black text-slate-900">
              Désabonner ce contact ?
            </h2>
            <p className="mt-1.5 text-sm font-semibold leading-relaxed text-slate-600">
              <strong className="font-extrabold text-slate-800">
                {contactLabel}
              </strong>{" "}
              ne recevra plus vos SMS marketing. Le contact reste dans votre
              liste, mais il sera exclu des prochaines campagnes et des envois
              groupés.
            </p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
              Cette action enregistre son droit de retrait (STOP SMS) conformément
              aux règles d&apos;envoi.
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-900">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <ProtoBtn disabled={loading} onClick={onCancel}>
            Annuler
          </ProtoBtn>
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleConfirm()}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border-none bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(217,119,6,0.25)] transition-all hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Désabonnement…" : "Désabonner"}
          </button>
        </div>
      </div>
    </div>
  );
}
