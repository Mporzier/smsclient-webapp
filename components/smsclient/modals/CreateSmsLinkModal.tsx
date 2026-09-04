"use client";

import {
  normalizeUrl,
  isValidLinkUrl,
  isValidLinkLabel,
  SMS_LINK_LABEL_MAX_LENGTH,
  SMS_LINK_LABEL_MIN_LENGTH,
} from "@/components/smsclient/CreateCampaign/campaignTextUtils";
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
import type { LinkRowData } from "@/lib/types/link";
import { URL_MAX_LENGTH } from "@/lib/forms/fieldLimits";
import { cn } from "@/lib/cn";
import { Link2 } from "lucide-react";
import { useCallback, useState } from "react";
import {
  dialogContentStackedZCls,
  dialogOverlayStackedCls,
  formDialogContentCls,
  modalIconCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";
import {
  hasStackedOpenDialog,
  smsLinkFormSnapshotsEqual,
  useModalFormDirty,
} from "./modalFormGuard";

type CreateSmsLinkModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (args: {
    originalUrl: string;
    label: string;
  }) => Promise<{ data: LinkRowData | null; error: string | null }>;
  onCreated?: (link: LinkRowData) => void;
};

const fieldLabelCls = "text-xs font-semibold text-foreground";
const fieldMetaCls = "text-xs font-normal text-muted-foreground";
const hintTextCls = "text-xs font-normal leading-snug text-muted-foreground";
/** Ring Input UI trop épais en Dialog — border + ring-0 comme Contact. */
const modalFieldCls =
  "focus-visible:outline-none focus-visible:ring-0 aria-invalid:ring-0";

export function CreateSmsLinkModal({
  open,
  onClose,
  onCreate,
  onCreated,
}: CreateSmsLinkModalProps) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [labelError, setLabelError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setOriginalUrl("");
      setLabel("");
      setUrlError(null);
      setLabelError(null);
      setSaveError(null);
      setSaving(false);
    }
  }

  const isDirty = useModalFormDirty(
    open,
    { originalUrl, label },
    smsLinkFormSnapshotsEqual,
  );
  const canDismiss = !saving && !isDirty;

  const handleClose = useCallback(() => {
    if (saving) return;
    setUrlError(null);
    setLabelError(null);
    setSaveError(null);
    onClose();
  }, [onClose, saving]);

  const handleSubmit = useCallback(async () => {
    let hasFieldError = false;
    if (!isValidLinkUrl(originalUrl)) {
      setUrlError("Saisissez une URL valide (ex. https://votre-site.fr/promo).");
      hasFieldError = true;
    } else {
      setUrlError(null);
    }
    const trimmedLabel = label.trim().slice(0, SMS_LINK_LABEL_MAX_LENGTH);
    if (!isValidLinkLabel(trimmedLabel)) {
      setLabelError(
        `Le libellé est obligatoire (${SMS_LINK_LABEL_MIN_LENGTH} caractères minimum).`
      );
      hasFieldError = true;
    } else {
      setLabelError(null);
    }
    if (hasFieldError) return;

    const normalized = normalizeUrl(originalUrl);
    setSaving(true);
    setSaveError(null);
    const { data, error: createError } = await onCreate({
      originalUrl: normalized,
      label: trimmedLabel,
    });
    setSaving(false);
    if (createError || !data) {
      setSaveError(createError ?? "Création impossible.");
      return;
    }
    onCreated?.(data);
    onClose();
  }, [originalUrl, label, onCreate, onCreated, onClose]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          if (saving || hasStackedOpenDialog()) return;
          handleClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={!saving}
        overlayClassName={dialogOverlayStackedCls}
        className={cn(
          formDialogContentCls,
          "max-h-[min(86dvh,560px)] sm:max-w-[480px]",
          dialogContentStackedZCls
        )}
        onOpenAutoFocus={preventDialogOpenAutoFocus}
        onPointerDownOutside={(e) => {
          if (hasStackedOpenDialog()) return;
          if (!canDismiss) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (hasStackedOpenDialog()) return;
          if (!canDismiss) e.preventDefault();
        }}
      >
        <DialogHeader className="shrink-0 flex-row items-center gap-2.5 space-y-0 border-b border-border px-4 py-2.5 text-left">
          <div className={modalIconCls("sm")} aria-hidden>
            <Link2 />
          </div>
          <DialogTitle className="min-w-0 flex-1 pr-8 text-base font-semibold leading-none tracking-tight">
            Nouveau lien
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-1.5">
            <Label className={fieldLabelCls} htmlFor="create-sms-link-url">
              URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="create-sms-link-url"
              type="url"
              className={modalFieldCls}
              maxLength={URL_MAX_LENGTH}
              placeholder="Ex. www.votre-site.fr/promo"
              value={originalUrl}
              aria-invalid={Boolean(urlError)}
              aria-describedby={urlError ? "create-sms-link-url-err" : undefined}
              onChange={(e) => {
                setOriginalUrl(e.target.value);
                setUrlError(null);
                setSaveError(null);
              }}
              disabled={saving}
            />
            {urlError ? (
              <p
                id="create-sms-link-url-err"
                className={cn(hintTextCls, "text-destructive")}
              >
                {urlError}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label
              className="flex justify-between gap-2"
              htmlFor="create-sms-link-label"
            >
              <span className={fieldLabelCls}>
                Libellé <span className="text-destructive">*</span>
              </span>
              <span className={fieldMetaCls}>
                {label.length}/{SMS_LINK_LABEL_MAX_LENGTH}
              </span>
            </Label>
            <Input
              id="create-sms-link-label"
              type="text"
              required
              minLength={SMS_LINK_LABEL_MIN_LENGTH}
              maxLength={SMS_LINK_LABEL_MAX_LENGTH}
              className={modalFieldCls}
              placeholder="Ex. Promo été"
              value={label}
              aria-invalid={Boolean(labelError)}
              aria-describedby={
                labelError ? "create-sms-link-label-err" : undefined
              }
              onChange={(e) => {
                setLabel(e.target.value);
                setLabelError(null);
                setSaveError(null);
              }}
              disabled={saving}
            />
            {labelError ? (
              <p
                id="create-sms-link-label-err"
                className={cn(hintTextCls, "text-destructive")}
              >
                {labelError}
              </p>
            ) : null}
          </div>
        </div>

        {saveError ? (
          <div className="shrink-0 border-t border-destructive/30 bg-destructive/10 px-6 py-2 text-sm text-destructive">
            {saveError}
          </div>
        ) : null}

        <DialogFooter className="mx-0 mb-0 shrink-0 flex-row flex-wrap items-center justify-end gap-2 rounded-b-xl p-2.5 px-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={handleClose}
            className="cursor-pointer"
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={saving}
            onClick={() => void handleSubmit()}
            className="cursor-pointer"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
