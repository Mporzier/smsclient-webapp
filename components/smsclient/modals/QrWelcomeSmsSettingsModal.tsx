"use client";

import { SmsMessageComposer } from "@/components/smsclient/CreateCampaign/SmsMessageComposer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  normalizePrenomTokens,
  SMS_PRENOM_PREVIEW_SAMPLE,
} from "@/lib/proto/smsPersonalization";
import { cn } from "@/lib/utils";
import { MessageCircle, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  brandBtnCls,
  brandBtnPrimaryCls,
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  modalCloseBtnCompact,
} from "./modalChrome";
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

  useEffect(() => {
    if (open) setLocalTemplate(template);
  }, [open, template]);

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
    if (!dirty || saving) return;
    await onSave(normalizedLocal);
    onClose();
  }, [dirty, normalizedLocal, onClose, onSave, saving]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName={dialogOverlayCls}
        className={cn(
          formDialogContentCls,
          "max-h-[min(88dvh,640px)] sm:max-w-[560px]",
          dialogContentZCls
        )}
        onPointerDownOutside={(e) => {
          if (saving || dirty) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (saving || dirty) e.preventDefault();
        }}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3.5">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-ring/20 bg-muted/50 text-ring">
              <MessageCircle className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <DialogTitle
                id="qr-welcome-sms-modal-title"
                className="m-0 text-base font-black text-foreground"
              >
                SMS de bienvenue
              </DialogTitle>
              <DialogDescription className="m-0 mt-0.5 text-xs font-semibold">
                Personnalisez le message envoyé après l&apos;inscription.
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            className={modalCloseBtnCompact}
            aria-label="Fermer"
            disabled={saving}
            onClick={handleClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

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
            disabled={!dirty || saving}
            onClick={() => void handleSave()}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
