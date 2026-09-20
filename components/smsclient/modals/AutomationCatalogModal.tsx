"use client";

import { CatalogPicker } from "@/components/smsclient/views/automatisations/CatalogPicker";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import type { AutomationPresetKey } from "@/lib/types/automation";
import { FormDialogHeader } from "./FormDialogHeader";
import {
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";

export type AutomationCatalogModalProps = {
  open: boolean;
  enabledPresetKeys: ReadonlySet<string>;
  focusTag?: string | null;
  onClose: () => void;
  onConfigure: (presetKey: AutomationPresetKey) => void;
};

export function AutomationCatalogModal({
  open,
  enabledPresetKeys,
  focusTag,
  onClose,
  onConfigure,
}: AutomationCatalogModalProps) {
  function handleConfigure(presetKey: AutomationPresetKey) {
    onConfigure(presetKey);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton
        overlayClassName={dialogOverlayCls}
        className={cn(
          formDialogContentCls,
          "flex max-h-[min(90dvh,820px)] min-h-0 sm:max-w-[920px]",
          dialogContentZCls,
        )}
        onOpenAutoFocus={preventDialogOpenAutoFocus}
      >
        <FormDialogHeader
          className="shrink-0 border-b border-border/60 px-4 py-3"
          bareIcon
          icon={
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50 text-2xl leading-none">
              <span aria-hidden>🚀</span>
            </div>
          }
          title="Activer une automatisation"
          description="Scénarios prêts à l'emploi — filtres, pertinence et configuration en un clic."
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/30 px-3 py-3 sm:px-4">
          <CatalogPicker
            key={open ? `catalog-${focusTag ?? "all"}` : "catalog-closed"}
            enabledPresetKeys={enabledPresetKeys}
            onConfigure={handleConfigure}
            focusTag={focusTag}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
