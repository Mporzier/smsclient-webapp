"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { useCallback, useState } from "react";
import { Users } from "lucide-react";
import {
  brandBtnCls,
  brandBtnPrimaryCls,
  brandInputCls,
  dialogContentStackedZCls,
  dialogOverlayStackedCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";
import { FormDialogHeader } from "./FormDialogHeader";
import {
  groupQuickFormSnapshotsEqual,
  hasStackedOpenDialog,
  useModalFormDirty,
} from "./modalFormGuard";

export type GroupQuickCreateModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string, description: string) => void | Promise<void>;
};

const fieldShell =
  "rounded-xl border border-border bg-card p-2.5 shadow-[0_8px_18px_rgba(15,23,42,0.06)]";

const modalTitleCls = "text-base font-semibold tracking-tight text-foreground";
const fieldLabelCls = "text-xs font-medium text-foreground/80";
const fieldMetaCls = "text-[11px] font-normal text-muted-foreground";
const hintTextCls = "text-xs font-normal leading-snug text-muted-foreground";

export function GroupQuickCreateModal({
  open,
  onClose,
  onCreated,
}: GroupQuickCreateModalProps) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName("");
      setDesc("");
      setNameError(null);
      setSaveError(null);
      setSaving(false);
    }
  }

  const isDirty = useModalFormDirty(
    open,
    { name, description: desc },
    groupQuickFormSnapshotsEqual,
  );
  const canDismiss = !saving && !isDirty;

  const handleClose = useCallback(() => {
    if (saving) return;
    setNameError(null);
    setSaveError(null);
    onClose();
  }, [onClose, saving]);

  const handleCreate = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Indiquez un nom de groupe.");
      return;
    }
    setNameError(null);
    setSaveError(null);
    setSaving(true);
    try {
      await onCreated?.(trimmed, desc.trim());
      handleClose();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Enregistrement impossible.";
      if (msg.includes("existe déjà")) {
        setNameError(msg);
      } else {
        setSaveError(msg);
      }
    } finally {
      setSaving(false);
    }
  }, [name, desc, onCreated, handleClose]);

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
          "sm:max-w-[480px]",
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
        <FormDialogHeader
          className="bg-card px-4 py-3"
          bareIcon
          icon={
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-gradient-to-br from-violet-50 to-indigo-50 text-ring shadow-[0_8px_16px_rgba(47,111,237,0.12)]">
              <Users className="h-5 w-5" strokeWidth={2} />
            </div>
          }
          title="Nouveau groupe"
          titleClassName={modalTitleCls}
        />

        <div className="space-y-2 bg-muted/50 px-4 py-3">
          <div className={fieldShell}>
            <div className="flex justify-between gap-2">
              <Label className={fieldLabelCls} htmlFor="group-quick-name">
                Nom du groupe <span className="text-destructive">*</span>
              </Label>
              <span className={fieldMetaCls}>{name.length}/40</span>
            </div>
            <Input
              id="group-quick-name"
              className={cn(brandInputCls, "mt-1.5 h-9 text-[13px] font-normal")}
              maxLength={40}
              value={name}
              aria-invalid={Boolean(nameError)}
              aria-describedby={
                nameError ? "group-quick-name-err" : undefined
              }
              onChange={(e) => {
                setName(e.target.value);
                setNameError(null);
                setSaveError(null);
              }}
              placeholder="Ex. Clients VIP"
            />
            {nameError ? (
              <p
                id="group-quick-name-err"
                className={cn("m-0 mt-1.5", hintTextCls, "text-destructive")}
              >
                {nameError}
              </p>
            ) : null}
          </div>

          <div className={fieldShell}>
            <div className="flex justify-between gap-2">
              <Label className={fieldLabelCls} htmlFor="group-quick-desc">
                Description
              </Label>
              <span className={fieldMetaCls}>{desc.length}/120</span>
            </div>
            <Textarea
              id="group-quick-desc"
              className="mt-1.5 min-h-[72px] resize-y text-[13px] font-normal leading-snug"
              maxLength={120}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="Ex. Clients VIP, relance juin"
            />
          </div>
        </div>

        {saveError ? (
          <div className="shrink-0 border-t border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {saveError}
          </div>
        ) : null}

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-card px-4 py-3">
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
            disabled={saving}
            onClick={() => void handleCreate()}
          >
            {saving ? "Création…" : "Créer le groupe"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
