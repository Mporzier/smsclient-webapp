"use client";

import { SmsMessageComposer } from "@/components/smsclient/CreateCampaign/SmsMessageComposer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  normalizePrenomTokens,
  SMS_PRENOM_PREVIEW_SAMPLE,
} from "@/lib/proto/smsPersonalization";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  brandBtnCls,
  brandBtnPrimaryCls,
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";
import { FormDialogHeader } from "./FormDialogHeader";
import { useModalFormDirty } from "./modalFormGuard";

type QrWelcomeSmsSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  template: string;
  saving: boolean;
  onSave: (template: string) => Promise<void>;
};

export function QrWelcomeSmsSettingsModal({
  open,
  onClose,
  template,
  saving,
  onSave,
}: QrWelcomeSmsSettingsModalProps) {
  const [localTemplate, setLocalTemplate] = useState(template);
  const [prevSync, setPrevSync] = useState({ open, template });

  if (open !== prevSync.open || template !== prevSync.template) {
    setPrevSync({ open, template });
    if (open) setLocalTemplate(template);
  }

  const normalizedLocal = useMemo(
    () => normalizePrenomTokens(localTemplate),
    [localTemplate]
  );
  const dirty = useModalFormDirty(
    open,
    normalizedLocal.trim(),
    (a, b) => a === b
  );

  const handleClose = useCallback(() => {
    if (saving) return;
    onClose();
  }, [onClose, saving]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    await onSave(normalizedLocal);
    onClose();
  }, [normalizedLocal, onClose, onSave, saving]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={!saving}
        overlayClassName={dialogOverlayCls}
        className={cn(
          formDialogContentCls,
          "max-h-[min(88dvh,640px)] sm:max-w-[560px]",
          dialogContentZCls
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
          className="items-start px-4 py-3.5"
          bareIcon
          icon={
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-ring/20 bg-muted/50 text-ring">
              <MessageCircle className="h-4 w-4" aria-hidden />
            </span>
          }
          title="SMS de bienvenue"
          titleClassName="font-black"
          description="Personnalisez le message envoyé après l'inscription."
          descriptionClassName="font-semibold"
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <SmsMessageComposer
            value={localTemplate}
            onChange={setLocalTemplate}
            placeholder="Bonjour prénom, merci pour votre inscription…"
            estimateFirstName={SMS_PRENOM_PREVIEW_SAMPLE}
          />
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-border px-4 py-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className={cn(brandBtnCls, "h-9 px-3 text-xs")}
            disabled={saving}
            onClick={handleClose}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="default"
            size="lg"
            className={cn(brandBtnPrimaryCls, "h-9 px-3 text-xs")}
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
