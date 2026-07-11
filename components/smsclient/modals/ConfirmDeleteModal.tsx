"use client";

import { ProtoBtn } from "@/components/smsclient/ui";
import { overlayCls, overlayStackedCls } from "./modalChrome";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

type ConfirmDeleteModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  /** Au-dessus d’une autre modale (ex. édition de groupe). */
  stacked?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function ConfirmDeleteModal({
  open,
  title,
  description,
  confirmLabel = "Supprimer",
  stacked = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
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
      className={stacked ? overlayStackedCls : overlayCls}
      role="alertdialog"
      aria-modal
      aria-label={title}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_28px_70px_rgba(15,23,42,0.20)]">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-500">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="m-0 text-base font-black text-slate-900">{title}</h2>
            <p className="mt-1.5 text-sm font-semibold leading-relaxed text-slate-600">
              {description}
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
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border-none bg-rose-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(225,29,72,0.2)] transition-all hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Suppression…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
