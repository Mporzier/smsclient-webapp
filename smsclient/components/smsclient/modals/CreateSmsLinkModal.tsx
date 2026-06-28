"use client";

import {
  normalizeUrl,
  isValidLinkUrl,
  isValidLinkLabel,
  SMS_LINK_LABEL_MAX_LENGTH,
  SMS_LINK_LABEL_MIN_LENGTH,
} from "@/components/smsclient/CreateCampaign/campaignTextUtils";
import { ProtoBtn, PlusIcon } from "@/components/smsclient/ui";
import { ModalPortal } from "@/components/smsclient/modals/ModalPortal";
import {
  modalCloseBtnCompact,
  overlayStackedCls,
} from "@/components/smsclient/modals/modalChrome";
import { handleModalBackdropClick } from "@/components/smsclient/modals/modalFormGuard";
import type { LinkRowData } from "@/lib/types/link";
import { Link2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const shellCls =
  "flex w-full max-w-[480px] flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.24)]";

type CreateSmsLinkModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (args: {
    originalUrl: string;
    label: string;
  }) => Promise<{ data: LinkRowData | null; error: string | null }>;
  onCreated?: (link: LinkRowData) => void;
};

export function CreateSmsLinkModal({
  open,
  onClose,
  onCreate,
  onCreated,
}: CreateSmsLinkModalProps) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setOriginalUrl("");
      setLabel("");
      setError(null);
      setSaving(false);
    }
  }

  const handleClose = useCallback(() => {
    if (saving) return;
    onClose();
  }, [onClose, saving]);

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

  const urlValid = isValidLinkUrl(originalUrl);
  const labelValid = isValidLinkLabel(label);
  const canSubmit = urlValid && labelValid && !saving;

  const handleSubmit = useCallback(async () => {
    const normalized = normalizeUrl(originalUrl);
    if (!isValidLinkUrl(originalUrl)) {
      setError("Saisissez une URL valide (ex. https://votre-site.fr/promo).");
      return;
    }
    const trimmedLabel = label.trim().slice(0, SMS_LINK_LABEL_MAX_LENGTH);
    if (!isValidLinkLabel(trimmedLabel)) {
      setError(
        `Le libellé est obligatoire (${SMS_LINK_LABEL_MIN_LENGTH} caractères minimum).`
      );
      return;
    }
    setSaving(true);
    setError(null);
    const { data, error: createError } = await onCreate({
      originalUrl: normalized,
      label: trimmedLabel,
    });
    setSaving(false);
    if (createError || !data) {
      setError(createError ?? "Création impossible.");
      return;
    }
    onCreated?.(data);
    onClose();
  }, [originalUrl, label, onCreate, onCreated, onClose]);

  if (!open) return null;

  return (
    <ModalPortal>
      <div
        className={overlayStackedCls}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-sms-link-title"
        onClick={(e) =>
          handleModalBackdropClick(e, handleClose, false, !saving)
        }
      >
        <div className={shellCls} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#2f6fed]/20 bg-[#eef4ff] text-[#2f6fed]">
                <Link2 className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2
                  id="create-sms-link-title"
                  className="m-0 text-base font-black text-slate-900"
                >
                  Nouveau lien
                </h2>
                <p className="m-0 mt-0.5 text-xs font-semibold text-slate-500">
                  Le lien sera enregistré dans la section Liens.
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

          <div className="space-y-3 px-4 py-4">
            <div>
              <label
                htmlFor="create-sms-link-url"
                className="mb-1.5 block text-xs font-bold text-slate-700"
              >
                URL
              </label>
              <input
                id="create-sms-link-url"
                type="url"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#2f6fed]/40 focus:ring-2 focus:ring-[#2f6fed]/15"
                placeholder="www.votre-site.fr/promo"
                value={originalUrl}
                onChange={(e) => {
                  setOriginalUrl(e.target.value);
                  if (error) setError(null);
                }}
                disabled={saving}
              />
            </div>
            <div>
              <label
                htmlFor="create-sms-link-label"
                className="mb-1.5 block text-xs font-bold text-slate-700"
              >
                Libellé
              </label>
              <input
                id="create-sms-link-label"
                type="text"
                required
                minLength={SMS_LINK_LABEL_MIN_LENGTH}
                maxLength={SMS_LINK_LABEL_MAX_LENGTH}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#2f6fed]/40 focus:ring-2 focus:ring-[#2f6fed]/15"
                placeholder="Promo été"
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                  if (error) setError(null);
                }}
                disabled={saving}
              />
            </div>
            {error ? (
              <p className="m-0 text-xs font-bold text-rose-700">{error}</p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3.5">
            <ProtoBtn disabled={saving} onClick={handleClose}>
              Annuler
            </ProtoBtn>
            <ProtoBtn
              primary
              disabled={!canSubmit}
              onClick={() => void handleSubmit()}
            >
              {!saving ? <PlusIcon /> : null}
              {saving ? "Enregistrement…" : "Enregistrer"}
            </ProtoBtn>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
