"use client";

import { ProtoBtn } from "@/components/smsclient/ui";
import { cn } from "@/lib/cn";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { modalCloseBtnCompact, overlayCls } from "./modalChrome";
import { handleModalBackdropClick } from "./modalFormGuard";

const shellCls =
  "flex max-h-[min(86dvh,760px)] w-full flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.20)]";

type ParametresSettingModalProps = {
  open: boolean;
  title: string;
  description?: string;
  icon: ReactNode;
  onClose: () => void;
  onSave?: () => void | Promise<void>;
  saving?: boolean;
  dirty?: boolean;
  saveLabel?: string;
  wide?: boolean;
  children: ReactNode;
};

export function ParametresSettingModal({
  open,
  title,
  description,
  icon,
  onClose,
  onSave,
  saving = false,
  dirty = false,
  saveLabel = "Enregistrer",
  wide = false,
  children,
}: ParametresSettingModalProps) {
  if (!open) return null;

  return (
    <div
      className={overlayCls}
      role="dialog"
      aria-modal
      aria-label={title}
      onClick={(e) =>
        handleModalBackdropClick(e, onClose, false, !saving)
      }
    >
      <div className={cn(shellCls, wide ? "max-w-[980px]" : "max-w-[640px]")}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#dfe6f2] bg-gradient-to-br from-blue-50 to-indigo-50 text-[#2f6fed]"
              aria-hidden
            >
              {icon}
            </div>
            <div className="min-w-0">
              <h2 className="m-0 truncate text-base font-black text-slate-900">
                {title}
              </h2>
              {description && (
                <p className="m-0 mt-0.5 text-xs font-semibold text-slate-500">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            className={modalCloseBtnCompact}
            aria-label="Fermer"
            onClick={onClose}
            disabled={saving}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-4">
          {children}
        </div>

        {onSave && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3">
            <ProtoBtn onClick={onClose} disabled={saving}>
              Fermer
            </ProtoBtn>
            <ProtoBtn
              primary
              onClick={() => void onSave()}
              disabled={saving || !dirty}
            >
              {saving ? "Enregistrement…" : saveLabel}
            </ProtoBtn>
          </div>
        )}
      </div>
    </div>
  );
}
