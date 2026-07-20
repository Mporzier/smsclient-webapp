"use client";

import { innerInputSm } from "@/components/smsclient/flowFieldStyles";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import type { AutomationRowData, AutomationSavePayload } from "@/lib/types/automation";
import { Clock, Zap } from "lucide-react";
import { useCallback, useState } from "react";
import {
  brandBtnCls,
  brandBtnPrimaryCls,
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";
import { FormDialogHeader } from "./FormDialogHeader";

const fieldLabelCls = "text-xs font-semibold text-foreground/80";
const hintTextCls = "text-[11px] font-normal leading-snug text-muted-foreground";

type AutomationEditModalProps = {
  open: boolean;
  row: AutomationRowData | null;
  onClose: () => void;
  onSave: (payload: AutomationSavePayload) => Promise<void>;
};

export function AutomationEditModal({
  open,
  row,
  onClose,
  onSave,
}: AutomationEditModalProps) {
  const [body, setBody] = useState("");
  const [sendTime, setSendTime] = useState("09:00");
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open && row) {
      setBody(row.body);
      setSendTime(row.sendTime);
      setEnabled(row.enabled);
      setError(null);
    }
  }

  const handleClose = useCallback(() => {
    if (saving) return;
    setError(null);
    onClose();
  }, [onClose, saving]);

  const handleSave = useCallback(async () => {
    if (!row) return;
    const trimmed = body.trim();
    if (!trimmed) {
      setError("Le message ne peut pas être vide.");
      return;
    }
    if (trimmed.length > 480) {
      setError("Le message est limité à 480 caractères.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        presetKey: row.presetKey,
        body: trimmed,
        enabled,
        sendTime,
      });
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }, [row, body, enabled, sendTime, onSave, handleClose]);

  return (
    <Dialog
      open={open && !!row}
      onOpenChange={(next) => {
        if (!next && !saving) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={!saving}
        overlayClassName={dialogOverlayCls}
        className={cn(
          formDialogContentCls,
          "max-h-[min(86dvh,720px)] sm:max-w-[560px]",
          dialogContentZCls
        )}
        onOpenAutoFocus={preventDialogOpenAutoFocus}
        onPointerDownOutside={(e) => {
          if (saving) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (saving) e.preventDefault();
        }}
      >
        {row && (
          <>
            <FormDialogHeader
              className="px-4 py-3"
              bareIcon
              icon={
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-gradient-to-br from-blue-50 to-indigo-50 text-ring">
                  <Zap className="h-5 w-5" strokeWidth={2.25} />
                </div>
              }
              title={row.name}
              description={row.scheduleLabel}
            />

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/50 px-4 py-3">
              <p className={cn("m-0", hintTextCls)}>{row.description}</p>

              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
                <Checkbox
                  checked={enabled}
                  onCheckedChange={(checked) => setEnabled(checked === true)}
                />
                <span className="text-sm font-semibold text-foreground/90">
                  Activer cette automatisation
                </span>
              </label>

              <div className="rounded-xl border border-border bg-card p-2.5">
                <Label className={fieldLabelCls} htmlFor="automation-send-time">
                  Heure d&apos;envoi
                </Label>
                <div className={cn(innerInputSm, "mt-1.5 h-9 gap-2")}>
                  <Clock className="h-4 w-4 shrink-0 text-ring" aria-hidden />
                  <input
                    id="automation-send-time"
                    type="time"
                    className="w-full border-none bg-transparent text-[13px] text-foreground outline-none"
                    value={sendTime}
                    onChange={(e) => setSendTime(e.target.value)}
                  />
                </div>
                <p className={cn("mt-1.5", hintTextCls)}>
                  Fuseau horaire : Europe/Paris
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-2.5">
                <div className="flex justify-between gap-2">
                  <Label className={fieldLabelCls} htmlFor="automation-body">
                    Message SMS
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    {body.length}/480
                  </span>
                </div>
                <Textarea
                  id="automation-body"
                  className="mt-1.5 min-h-[100px] resize-y text-[13px] leading-snug"
                  maxLength={480}
                  value={body}
                  aria-invalid={Boolean(error)}
                  onChange={(e) => {
                    setBody(e.target.value);
                    setError(null);
                  }}
                  rows={4}
                />
                {error ? (
                  <p className="mt-1.5 text-xs font-medium text-destructive">
                    {error}
                  </p>
                ) : null}
                <p className={cn("mt-1.5", hintTextCls)}>
                  Variables :{" "}
                  <code className="rounded bg-muted px-1">{"{prenom}"}</code>,{" "}
                  <code className="rounded bg-muted px-1">{"{nom}"}</code>
                </p>
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-4 py-3">
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
                onClick={() => void handleSave()}
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
