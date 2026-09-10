"use client";

import { CatalogPicker } from "@/components/smsclient/views/automatisations/CatalogPicker";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import type { AutomationPresetKey } from "@/lib/types/automation";
import { Zap } from "lucide-react";
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
          "max-h-[min(90dvh,820px)] sm:max-w-[920px]",
          dialogContentZCls,
        )}
        onOpenAutoFocus={preventDialogOpenAutoFocus}
      >
        <FormDialogHeader
          className="px-4 py-3"
          bareIcon
          icon={
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600">
              <Zap className="h-5 w-5" strokeWidth={2.25} />
            </div>
          }
          title="Activer une automatisation"
          description="Choisissez un scénario prêt à l'emploi dans le catalogue."
        />

        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/50 px-4 py-3">
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
