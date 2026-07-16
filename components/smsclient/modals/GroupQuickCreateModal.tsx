"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { useCallback, useState } from "react";
import { Users, X } from "lucide-react";
import {
  brandBtnCls,
  brandBtnPrimaryCls,
  brandInputCls,
  dialogContentStackedZCls,
  dialogOverlayStackedCls,
  formDialogContentCls,
  modalCloseBtnCompact,
} from "./modalChrome";
import {
  groupQuickFormSnapshotsEqual,
  useModalFormDirty,
  type GroupQuickFormSnapshot,
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
const errorTextCls = "text-xs font-medium text-rose-800";

export function GroupQuickCreateModal({
  open,
  onClose,
  onCreated,
}: GroupQuickCreateModalProps) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName("");
      setDesc("");
      setSaveError(null);
      setSaving(false);
    }
  }

  const handleClose = useCallback(() => {
    if (saving) return;
    setSaveError(null);
    onClose();
  }, [onClose, saving]);

  const handleCreate = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setSaveError("Indiquez un nom de groupe.");
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      await onCreated?.(trimmed, desc.trim());
      handleClose();
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : "Enregistrement impossible."
      );
    } finally {
      setSaving(false);
    }
  }, [name, desc, onCreated, handleClose]);

  const formSnapshot: GroupQuickFormSnapshot = { name, description: desc };
  const isDirty = useModalFormDirty(
    open,
    formSnapshot,
    groupQuickFormSnapshotsEqual
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          if (saving || isDirty) return;
          handleClose();
        }
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
          if (saving || isDirty) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (saving || isDirty) e.preventDefault();
        }}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-gradient-to-br from-violet-50 to-indigo-50 text-ring shadow-[0_8px_16px_rgba(47,111,237,0.12)]"
              aria-hidden
            >
              <Users className="h-5 w-5" strokeWidth={2} />
            </div>
            <DialogTitle className={cn("m-0 min-w-0", modalTitleCls)}>
              Nouveau groupe
            </DialogTitle>
          </div>
          <button
            type="button"
            className={modalCloseBtnCompact}
            aria-label="Fermer"
            onClick={handleClose}
            disabled={saving}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-2 bg-muted/50 px-4 py-3">
          {saveError && (
            <p
              className={cn(
                "rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5",
                errorTextCls
              )}
            >
              {saveError}
            </p>
          )}

          <div className={fieldShell}>
            <div className="flex justify-between gap-2">
              <Label className={fieldLabelCls} htmlFor="group-quick-name">
                Nom du groupe <span className="text-red-500">*</span>
              </Label>
              <span className={fieldMetaCls}>{name.length}/40</span>
            </div>
            <Input
              id="group-quick-name"
              className={cn(brandInputCls, "mt-1.5 h-9 text-[13px] font-normal")}
              maxLength={40}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaveError(null);
              }}
              placeholder="Ex : Clients VIP"
              autoFocus
            />
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
              placeholder="Optionnel — contexte ou critères du groupe…"
            />
          </div>
        </div>

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
