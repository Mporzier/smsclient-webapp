"use client";

import { cn } from "@/lib/cn";
import { ProtoBtn } from "@/components/smsclient/ui";
import {
  innerInputSm,
  innerTextareaSm,
} from "@/components/smsclient/flowFieldStyles";
import { useCallback, useEffect, useState } from "react";
import { Users, X } from "lucide-react";
import { modalCloseBtnCompact, overlayStackedCls } from "./modalChrome";
import {
  groupQuickFormSnapshotsEqual,
  handleModalBackdropClick,
  useModalFormDirty,
  type GroupQuickFormSnapshot,
} from "./modalFormGuard";

export type GroupQuickCreateModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string, description: string) => void | Promise<void>;
};

const shellCls =
  "flex w-full max-w-[480px] flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.24)]";

const fieldShell =
  "rounded-xl border border-slate-200 bg-white p-2.5 shadow-[0_8px_18px_rgba(15,23,42,0.06)]";

const inpText =
  "w-full border-none bg-transparent text-[13px] font-normal text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-normal";

const modalTitleCls = "text-base font-semibold tracking-tight text-slate-900";
const fieldLabelCls = "text-xs font-medium text-slate-700";
const fieldMetaCls = "text-[11px] font-normal text-slate-500";
const errorTextCls = "text-xs font-medium text-rose-800";

export function GroupQuickCreateModal({
  open,
  onClose,
  onCreated,
}: GroupQuickCreateModalProps) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName("");
      setDesc("");
      setSaveError(null);
      setSaving(false);
    }
  }

  const handleClose = useCallback(() => {
    setSaveError(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  const handleCreate = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setSaveError("Indique un nom de groupe.");
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      await onCreated?.(trimmed, desc.trim());
      handleClose();
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : "Enregistrement impossible."
      );
    } finally {
      setSaving(false);
    }
  }, [name, desc, onCreated, handleClose]);

  const formSnapshot: GroupQuickFormSnapshot = { name, description: desc };
  const isDirty = useModalFormDirty(
    open,
    formSnapshot,
    groupQuickFormSnapshotsEqual
  );

  if (!open) return null;

  return (
    <div
      className={overlayStackedCls}
      role="dialog"
      aria-modal
      aria-label="Nouveau groupe"
      onClick={(e) =>
        handleModalBackdropClick(e, handleClose, isDirty, !saving)
      }
    >
      <div className={shellCls}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#dfe6f2] bg-gradient-to-br from-violet-50 to-indigo-50 text-[#2f6fed] shadow-[0_8px_16px_rgba(47,111,237,0.12)]"
              aria-hidden
            >
              <Users className="h-5 w-5" strokeWidth={2} />
            </div>
            <h2 className={cn("m-0 min-w-0", modalTitleCls)}>Nouveau groupe</h2>
          </div>
          <button
            type="button"
            className={modalCloseBtnCompact}
            aria-label="Fermer"
            onClick={handleClose}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-2 bg-slate-50 px-4 py-3">
          {saveError && (
            <p
              className={cn(
                "rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5",
                errorTextCls
              )}
            >
              {saveError}
            </p>
          )}

          <div className={fieldShell}>
            <label className="flex justify-between gap-2">
              <span className={fieldLabelCls}>
                Nom du groupe <span className="text-red-500">*</span>
              </span>
              <span className={fieldMetaCls}>{name.length}/40</span>
            </label>
            <div className={cn(innerInputSm, "mt-1.5 h-9")}>
              <input
                className={inpText}
                maxLength={40}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSaveError(null);
                }}
                placeholder="Ex : Clients VIP"
                autoFocus
              />
            </div>
          </div>

          <div className={fieldShell}>
            <label className="flex justify-between gap-2">
              <span className={fieldLabelCls}>Description</span>
              <span className={fieldMetaCls}>{desc.length}/120</span>
            </label>
            <div className={cn(innerTextareaSm, "mt-1.5")}>
              <textarea
                className="min-h-[72px] w-full resize-y border-none bg-transparent text-[13px] font-normal leading-snug text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-normal"
                maxLength={120}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
                placeholder="Optionnel — contexte ou critères du groupe…"
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3">
          <ProtoBtn disabled={saving} onClick={handleClose}>
            Annuler
          </ProtoBtn>
          <ProtoBtn
            primary
            disabled={saving}
            onClick={() => void handleCreate()}
          >
            {saving ? "Création…" : "Créer le groupe"}
          </ProtoBtn>
        </div>
      </div>
    </div>
  );
}
