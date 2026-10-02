"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/components/ui/sonner";
import { Copy, ExternalLink, Link } from "lucide-react";
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

  const copyLink = () => {
    if (!publicUrl) return;
    void navigator.clipboard.writeText(publicUrl).then(() => {
      toast(t("qr.hub.linkModal.copiedToast"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton
        className={cn(
          formDialogContentCls,
          dialogContentZCls,
          "max-h-[min(88dvh,420px)] sm:max-w-[480px]"
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
            <Label id="qr-collect-signup-link-label">{t("qr.signupLink")}</Label>
            <button
              type="button"
              disabled={!publicUrl}
              aria-labelledby="qr-collect-signup-link-label"
              className="flex w-full cursor-pointer items-center gap-2 overflow-hidden rounded-lg border border-blue-100/90 bg-blue-50/40 px-3 py-3 text-left transition-colors hover:bg-blue-100/45 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={copyLink}
            >
              <span className="min-w-0 flex-1 text-sm font-medium leading-snug break-all text-foreground">
                {publicUrl || "—"}
              </span>
              <Copy
                className="h-4 w-4 shrink-0 text-blue-600"
                strokeWidth={2.25}
                aria-hidden
              />
            </button>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border px-4 py-3">
          <Button
            type="button"
            variant="outline"
            disabled={!publicUrl}
            onClick={copyLink}
          >
            <Copy data-icon="inline-start" aria-hidden />
            {t("qr.copyLink")}
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
