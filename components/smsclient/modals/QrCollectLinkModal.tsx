"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import { Copy, ExternalLink, Link } from "lucide-react";
import { useState } from "react";
import {
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";
import { FormDialogHeader } from "./FormDialogHeader";

type QrCollectLinkModalProps = {
  open: boolean;
  onClose: () => void;
  publicUrl: string;
};

export function QrCollectLinkModal({
  open,
  onClose,
  publicUrl,
}: QrCollectLinkModalProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton
        className={cn(
          formDialogContentCls,
          dialogContentZCls,
          "max-h-[min(88dvh,420px)] sm:max-w-[480px]",
        )}
        onOpenAutoFocus={preventDialogOpenAutoFocus}
        overlayClassName={dialogOverlayCls}
      >
        <FormDialogHeader
          className="px-4 py-3.5"
          bareIcon
          icon={
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-500/15 text-blue-600">
              <Link className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </span>
          }
          title={t("qr.hub.card.link.title")}
          description={t("qr.hub.linkModal.desc")}
        />

        <div className="space-y-4 px-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="qr-collect-signup-link">{t("qr.signupLink")}</Label>
            <Input
              id="qr-collect-signup-link"
              readOnly
              value={publicUrl || "—"}
              className="font-medium"
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border px-4 py-3">
          <Button
            type="button"
            variant="outline"
            disabled={!publicUrl}
            onClick={() => {
              if (!publicUrl) return;
              void navigator.clipboard.writeText(publicUrl).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              });
            }}
          >
            <Copy data-icon="inline-start" aria-hidden />
            {copied ? t("qr.copied") : t("qr.copyLink")}
          </Button>
          <Button
            type="button"
            disabled={!publicUrl}
            className="bg-blue-600 text-white hover:bg-blue-600/90"
            onClick={() => {
              if (!publicUrl) return;
              window.open(publicUrl, "_blank", "noopener,noreferrer");
            }}
          >
            <ExternalLink data-icon="inline-start" aria-hidden />
            {t("qr.hub.linkModal.open")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
