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
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  modalCloseBtnCompact,
  modalIconCls,
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
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className={modalIconCls("sm")} aria-hidden>
              {icon}
            </div>
            <div className="min-w-0">
              <DialogTitle className="m-0 truncate text-base font-semibold leading-none tracking-tight text-foreground">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="m-0 mt-1 text-xs text-muted-foreground">
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

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {onSave && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-card p-2.5 px-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="cursor-pointer"
            >
              Fermer
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={() => void onSave()}
              disabled={saving || !dirty}
              className="cursor-pointer"
            >
              {saving ? "Enregistrement…" : saveLabel}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
