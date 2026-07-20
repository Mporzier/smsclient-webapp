"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";
import { FormDialogHeader } from "./FormDialogHeader";
import {
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";

type FormDialogShellProps = {
  open: boolean;
  title: string;
  description?: string;
  icon?: ReactNode;
  bareIcon?: boolean;
  onClose: () => void;
  onSave?: () => void | Promise<void>;
  saving?: boolean;
  dirty?: boolean;
  saveLabel?: string;
  wide?: boolean;
  contentClassName?: string;
  children: ReactNode;
};

/**
 * Shell modale formulaire standard (croix = DialogContent showCloseButton).
 * Préférer ceci / FormDialogHeader plutôt que `modalCloseBtn*`.
 */
export function FormDialogShell({
  open,
  title,
  description,
  icon,
  bareIcon = false,
  onClose,
  onSave,
  saving = false,
  dirty = false,
  saveLabel = "Enregistrer",
  wide = false,
  contentClassName,
  children,
}: FormDialogShellProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) onClose();
      }}
    >
      <DialogContent
        showCloseButton={!saving}
        overlayClassName={dialogOverlayCls}
        className={cn(
          formDialogContentCls,
          "max-h-[min(86dvh,760px)]",
          wide ? "sm:max-w-[980px]" : "sm:max-w-[640px]",
          dialogContentZCls,
          contentClassName,
        )}
        onOpenAutoFocus={preventDialogOpenAutoFocus}
        onPointerDownOutside={(e) => {
          if (saving || dirty) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (saving || dirty) e.preventDefault();
        }}
      >
        <FormDialogHeader
          title={title}
          description={description}
          icon={icon}
          bareIcon={bareIcon}
        />
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {onSave ? (
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
              disabled={saving}
              className="cursor-pointer"
            >
              {saving ? "Enregistrement…" : saveLabel}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
