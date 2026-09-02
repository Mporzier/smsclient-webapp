"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import { CAMPAIGN_NAME_MAX_LENGTH } from "@/lib/forms/fieldLimits";
import { useI18n } from "@/lib/i18n";
import { Megaphone } from "lucide-react";
import { useState } from "react";
import {
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  modalIconCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";

const fieldLabelCls = "text-xs font-semibold text-foreground";
const fieldMetaCls = "text-xs font-normal text-muted-foreground";
const modalFieldCls =
  "focus-visible:outline-none focus-visible:ring-0 aria-invalid:ring-0";

function formatCampaignDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

type CampaignNameModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
};

export function CampaignNameModal({
  open,
  onClose,
  onConfirm,
}: CampaignNameModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName("");
    }
  }

  const defaultName = t("campaigns.nameModal.defaultName", {
    date: formatCampaignDate(new Date()),
  });

  function handleSubmit() {
    onConfirm(name.trim() || defaultName);
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
          "rounded-xl shadow-lg sm:max-w-[480px]",
          dialogContentZCls
        )}
        onOpenAutoFocus={preventDialogOpenAutoFocus}
      >
        <DialogHeader className="shrink-0 flex-row items-center gap-2.5 space-y-0 border-b border-border px-4 py-2.5 text-left">
          <div className={modalIconCls("sm")} aria-hidden>
            <Megaphone />
          </div>
          <DialogTitle className="min-w-0 flex-1 pr-8 text-base font-semibold leading-none tracking-tight">
            {t("campaigns.nameModal.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          <div className="space-y-1.5">
            <Label
              className="flex justify-between gap-2"
              htmlFor="campaign-name-input"
            >
              <span className={fieldLabelCls}>
                {t("campaigns.nameModal.label")}
              </span>
              <span className={fieldMetaCls}>
                {name.length}/{CAMPAIGN_NAME_MAX_LENGTH}
              </span>
            </Label>
            <Input
              id="campaign-name-input"
              className={modalFieldCls}
              maxLength={CAMPAIGN_NAME_MAX_LENGTH}
              value={name}
              placeholder={defaultName}
              onChange={(e) => {
                setName(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 shrink-0 flex-row items-center justify-end gap-2 rounded-b-xl p-2.5 px-4">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={onClose}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="default"
            className="cursor-pointer"
            onClick={handleSubmit}
          >
            {t("campaigns.nameModal.continue")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
