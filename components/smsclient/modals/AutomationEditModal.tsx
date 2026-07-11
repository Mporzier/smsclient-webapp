"use client";

import { ProtoBtn } from "@/components/smsclient/ui";
import { innerInputSm, innerTextareaSm } from "@/components/smsclient/flowFieldStyles";
import { cn } from "@/lib/cn";
import type { AutomationRowData, AutomationSavePayload } from "@/lib/types/automation";
import { useCallback, useEffect, useState } from "react";
import { Clock, X, Zap } from "lucide-react";
import { modalCloseBtnCompact, overlayCls } from "./modalChrome";
import { handleModalBackdropClick } from "./modalFormGuard";

const shellCls =
  "flex max-h-[min(86dvh,720px)] w-full max-w-[560px] flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.20)]";

const fieldLabelCls = "text-xs font-semibold text-slate-700";
const hintTextCls = "text-[11px] font-normal leading-snug text-slate-600";

type AutomationEditModalProps = {
  open: boolean;
  row: AutomationRowData | null;
  onClose: () => void;
  onSave: (payload: AutomationSavePayload) => Promise<void>;
};

export function AutomationEditModal({
  open,
  row,
  onClose,
  onSave,
}: AutomationEditModalProps) {
  const [body, setBody] = useState("");
  const [sendTime, setSendTime] = useState("09:00");
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open && row) {
      setBody(row.body);
      setSendTime(row.sendTime);
      setEnabled(row.enabled);
      setError(null);
    }
  }

  const handleClose = useCallback(() => {
    setError(null);
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

  const handleSave = useCallback(async () => {
    if (!row) return;
    const trimmed = body.trim();
    if (!trimmed) {
      setError("Le message ne peut pas être vide.");
      return;
    }
    if (trimmed.length > 480) {
      setError("Le message est limité à 480 caractères.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        presetKey: row.presetKey,
        body: trimmed,
        enabled,
        sendTime,
      });
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }, [row, body, enabled, sendTime, onSave, handleClose]);

  if (!open || !row) return null;

  return (
    <div
      className={overlayCls}
      role="dialog"
      aria-modal
      aria-label={`Configurer ${row.name}`}
      onClick={(e) =>
        handleModalBackdropClick(e, handleClose, false, !saving)
      }
    >
      <div className={shellCls}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#dfe6f2] bg-gradient-to-br from-blue-50 to-indigo-50 text-[#2f6fed]"
              aria-hidden
            >
              <Zap className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <h2 className="m-0 truncate text-base font-semibold text-slate-900">
                {row.name}
              </h2>
              <p className="m-0 mt-0.5 text-xs text-slate-500">{row.scheduleLabel}</p>
            </div>
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

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-3">
          <p className={cn("m-0", hintTextCls)}>{row.description}</p>

          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-[#2f6fed]"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span className="text-sm font-semibold text-slate-800">
              Activer cette automatisation
            </span>
          </label>

          <div className="rounded-xl border border-slate-200 bg-white p-2.5">
            <label className={fieldLabelCls} htmlFor="automation-send-time">
              Heure d&apos;envoi
            </label>
            <div className={cn(innerInputSm, "mt-1.5 h-9 gap-2")}>
              <Clock className="h-4 w-4 shrink-0 text-[#2f6fed]" aria-hidden />
              <input
                id="automation-send-time"
                type="time"
                className="w-full border-none bg-transparent text-[13px] text-slate-900 outline-none"
                value={sendTime}
                onChange={(e) => setSendTime(e.target.value)}
              />
            </div>
            <p className={cn("mt-1.5", hintTextCls)}>
              Fuseau horaire : Europe/Paris
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-2.5">
            <div className="flex justify-between gap-2">
              <label className={fieldLabelCls} htmlFor="automation-body">
                Message SMS
              </label>
              <span className="text-[11px] text-slate-500">{body.length}/480</span>
            </div>
            <div className={cn(innerTextareaSm, "mt-1.5")}>
              <textarea
                id="automation-body"
                className="min-h-[100px] w-full resize-y border-none bg-transparent text-[13px] leading-snug text-slate-900 outline-none"
                maxLength={480}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setError(null);
                }}
                rows={4}
              />
            </div>
            <p className={cn("mt-1.5", hintTextCls)}>
              Variables :{" "}
              <code className="rounded bg-slate-100 px-1">{"{prenom}"}</code>,{" "}
              <code className="rounded bg-slate-100 px-1">{"{nom}"}</code>
            </p>
          </div>

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-800">
              {error}
            </p>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3">
          <ProtoBtn disabled={saving} onClick={handleClose}>
            Annuler
          </ProtoBtn>
          <ProtoBtn primary disabled={saving} onClick={() => void handleSave()}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </ProtoBtn>
        </div>
      </div>
    </div>
  );
}
