"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import type { ReactNode } from "react";
import { FormDialogHeader } from "./FormDialogHeader";
import { hasStackedOpenDialog } from "./modalFormGuard";
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
  saveLabel?: string;
  wide?: boolean;
  contentClassName?: string;
  /** Ex. `overflow-hidden` quand le contenu gère lui-même son scroll. */
  bodyClassName?: string;
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
  saveLabel,
  wide = false,
  contentClassName,
  bodyClassName,
  children,
}: FormDialogShellProps) {
  const { t } = useI18n();
  const resolvedSaveLabel = saveLabel ?? t("dialog.save");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving && !hasStackedOpenDialog()) onClose();
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
          if (saving || hasStackedOpenDialog()) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (saving || hasStackedOpenDialog()) e.preventDefault();
        }}
      >
        <FormDialogHeader
          title={title}
          description={description}
          icon={icon}
          bareIcon={bareIcon}
        />
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto px-6 py-4",
            bodyClassName,
          )}
        >
          {children}
        </div>
        {onSave ? (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-card p-2.5 px-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="cursor-pointer"
            >
              {t("dialog.close")}
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={() => void onSave()}
              disabled={saving}
              className="cursor-pointer"
            >
              {saving ? t("dialog.saving") : resolvedSaveLabel}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
