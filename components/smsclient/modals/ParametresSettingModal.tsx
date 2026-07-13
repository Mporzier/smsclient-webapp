"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import {
  brandBtnCls,
  brandBtnPrimaryCls,
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  modalCloseBtnCompact,
} from "./modalChrome";

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
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName={dialogOverlayCls}
        className={cn(
          formDialogContentCls,
          "max-h-[min(86dvh,760px)]",
          wide ? "sm:max-w-[980px]" : "sm:max-w-[640px]",
          dialogContentZCls
        )}
        onPointerDownOutside={(e) => {
          if (saving || dirty) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (saving || dirty) e.preventDefault();
        }}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-gradient-to-br from-blue-50 to-indigo-50 text-ring"
              aria-hidden
            >
              {icon}
            </div>
            <div className="min-w-0">
              <DialogTitle className="m-0 truncate text-base font-black text-foreground">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="m-0 mt-0.5 text-xs font-semibold">
                  {description}
                </DialogDescription>
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

        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/50 px-4 py-4">
          {children}
        </div>

        {onSave && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-card px-4 py-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className={brandBtnCls}
              onClick={onClose}
              disabled={saving}
            >
              Fermer
            </Button>
            <Button
              type="button"
              variant="default"
              size="lg"
              className={brandBtnPrimaryCls}
              onClick={() => void onSave()}
              disabled={saving || !dirty}
            >
              {saving ? "Enregistrement…" : saveLabel}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
