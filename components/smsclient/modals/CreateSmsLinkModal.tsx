"use client";

import {
  normalizeUrl,
  isValidLinkUrl,
  isValidLinkLabel,
  SMS_LINK_LABEL_MAX_LENGTH,
  SMS_LINK_LABEL_MIN_LENGTH,
} from "@/components/smsclient/CreateCampaign/campaignTextUtils";
import { PlusIcon } from "@/components/smsclient/ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LinkRowData } from "@/lib/types/link";
import { cn } from "@/lib/utils";
import { Link2, X } from "lucide-react";
import { useCallback, useState } from "react";
import {
  brandBtnCls,
  brandBtnPrimaryCls,
  brandInputCls,
  dialogContentStackedZCls,
  dialogOverlayStackedCls,
  formDialogContentCls,
  modalCloseBtnCompact,
} from "./modalChrome";

type CreateSmsLinkModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (args: {
    originalUrl: string;
    label: string;
  }) => Promise<{ data: LinkRowData | null; error: string | null }>;
  onCreated?: (link: LinkRowData) => void;
};

export function CreateSmsLinkModal({
  open,
  onClose,
  onCreate,
  onCreated,
}: CreateSmsLinkModalProps) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setOriginalUrl("");
      setLabel("");
      setError(null);
      setSaving(false);
    }
  }

  const handleClose = useCallback(() => {
    if (saving) return;
    onClose();
  }, [onClose, saving]);

  const urlValid = isValidLinkUrl(originalUrl);
  const labelValid = isValidLinkLabel(label);
  const canSubmit = urlValid && labelValid && !saving;

  const handleSubmit = useCallback(async () => {
    const normalized = normalizeUrl(originalUrl);
    if (!isValidLinkUrl(originalUrl)) {
      setError("Saisissez une URL valide (ex. https://votre-site.fr/promo).");
      return;
    }
    const trimmedLabel = label.trim().slice(0, SMS_LINK_LABEL_MAX_LENGTH);
    if (!isValidLinkLabel(trimmedLabel)) {
      setError(
        `Le libellé est obligatoire (${SMS_LINK_LABEL_MIN_LENGTH} caractères minimum).`
      );
      return;
    }
    setSaving(true);
    setError(null);
    const { data, error: createError } = await onCreate({
      originalUrl: normalized,
      label: trimmedLabel,
    });
    setSaving(false);
    if (createError || !data) {
      setError(createError ?? "Création impossible.");
      return;
    }
    onCreated?.(data);
    onClose();
  }, [originalUrl, label, onCreate, onCreated, onClose]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName={dialogOverlayStackedCls}
        className={cn(
          formDialogContentCls,
          "sm:max-w-[480px]",
          dialogContentStackedZCls
        )}
        onPointerDownOutside={(e) => {
          if (saving) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (saving) e.preventDefault();
        }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-ring/20 bg-muted/50 text-ring">
              <Link2 className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <DialogTitle
                id="create-sms-link-title"
                className="m-0 text-base font-black text-foreground"
              >
                Nouveau lien
              </DialogTitle>
              <DialogDescription className="m-0 mt-0.5 text-xs font-semibold">
                Le lien sera enregistré dans la section Liens.
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

        <div className="space-y-3 px-4 py-4">
          <div>
            <Label
              htmlFor="create-sms-link-url"
              className="mb-1.5 block text-xs font-bold text-foreground/80"
            >
              URL
            </Label>
            <Input
              id="create-sms-link-url"
              type="url"
              className={cn(brandInputCls, "h-10 text-sm font-semibold")}
              placeholder="www.votre-site.fr/promo"
              value={originalUrl}
              onChange={(e) => {
                setOriginalUrl(e.target.value);
                if (error) setError(null);
              }}
              disabled={saving}
            />
          </div>
          <div>
            <Label
              htmlFor="create-sms-link-label"
              className="mb-1.5 block text-xs font-bold text-foreground/80"
            >
              Libellé
            </Label>
            <Input
              id="create-sms-link-label"
              type="text"
              required
              minLength={SMS_LINK_LABEL_MIN_LENGTH}
              maxLength={SMS_LINK_LABEL_MAX_LENGTH}
              className={cn(brandInputCls, "h-10 text-sm font-semibold")}
              placeholder="Promo été"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (error) setError(null);
              }}
              disabled={saving}
            />
          </div>
          {error ? (
            <p className="m-0 text-xs font-bold text-destructive">{error}</p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-4 py-3.5">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className={brandBtnCls}
            disabled={saving}
            onClick={handleClose}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="default"
            size="lg"
            className={brandBtnPrimaryCls}
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
          >
            {!saving ? <PlusIcon /> : null}
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
