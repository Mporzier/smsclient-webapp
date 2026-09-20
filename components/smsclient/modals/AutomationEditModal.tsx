"use client";

import { SmsMessageComposer } from "@/components/smsclient/CreateCampaign/SmsMessageComposer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { automationPresetEmoji } from "@/lib/automations/catalogEmojis";
import { validateAutomationSmsBody } from "@/lib/automations/messageValidation";
import { cn } from "@/lib/cn";
import { buildEstimateMergeValues } from "@/lib/proto/smsPersonalization";
import type { ContactRowData } from "@/lib/types/contact";
import type { CustomFieldDef } from "@/lib/types/customFields";
import type { AutomationRowData, AutomationSavePayload } from "@/lib/types/automation";
import { CalendarDays } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  dialogContentZCls,
  dialogOverlayCls,
  dialogPopoverZCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";
import { FormDialogHeader } from "./FormDialogHeader";

const fieldLabelCls = "text-xs font-semibold text-foreground";
const hintTextCls = "text-xs font-normal leading-snug text-muted-foreground";
const modalFieldCls =
  "focus-visible:outline-none focus-visible:ring-0 aria-invalid:ring-0";

const sectionCls =
  "space-y-3 rounded-xl border border-border/60 bg-background p-4 shadow-sm";

type AutomationEditModalProps = {
  open: boolean;
  row: AutomationRowData | null;
  onClose: () => void;
  onSave: (payload: AutomationSavePayload) => Promise<void>;
  contacts?: ContactRowData[];
  customFieldDefs?: readonly CustomFieldDef[];
};

export function AutomationEditModal({
  open,
  row,
  onClose,
  onSave,
  contacts = [],
  customFieldDefs = [],
}: AutomationEditModalProps) {
  const [body, setBody] = useState("");
  const [sendTime, setSendTime] = useState("09:00");
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimateSample = useMemo(
    () => buildEstimateMergeValues(contacts, customFieldDefs),
    [contacts, customFieldDefs],
  );

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

    const validationError = validateAutomationSmsBody(body, {
      reserveStop: true,
      estimateSample,
      customFieldDefs,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (row.presetKey) {
        await onSave({
          mode: "preset",
          presetKey: row.presetKey,
          body: body.trim(),
          enabled,
          sendTime,
        });
      } else if (row.id) {
        await onSave({
          mode: "custom",
          id: row.id,
          name: row.name,
          kind: row.kind === "recurring" ? "recurring" : "fixed_date",
          body: body.trim(),
          enabled,
          sendTime,
          fixedMonth: row.fixedMonth,
          fixedDay: row.fixedDay,
          recurrenceUnit: row.recurrenceUnit,
          recurrenceInterval: row.recurrenceInterval,
          recurrenceWeekday: row.recurrenceWeekday,
          recurrenceMonthDayKind: row.recurrenceMonthDayKind,
        });
      } else {
        throw new Error("Automatisation introuvable.");
      }
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }, [
    row,
    body,
    enabled,
    sendTime,
    onSave,
    handleClose,
    estimateSample,
    customFieldDefs,
  ]);

  const headerEmoji = row
    ? automationPresetEmoji(row.presetKey)
    : "⚡";
  const isPreset = Boolean(row?.presetKey);
  const headerTitle = isPreset ? "Configurer l'automatisation" : row?.name;
  const headerDescription = isPreset ? row?.name : row?.scheduleLabel;

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
          "max-h-[min(90dvh,820px)] sm:max-w-[620px]",
          dialogContentZCls,
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
              className="shrink-0 border-b border-border/60 px-4 py-3"
              bareIcon
              icon={
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50 text-2xl leading-none">
                  <span aria-hidden>{headerEmoji}</span>
                </div>
              }
              title={headerTitle}
              description={headerDescription}
            />

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-muted/30 px-4 py-4">
              {row.description ? (
                <p className={cn("m-0 px-0.5", hintTextCls)}>{row.description}</p>
              ) : null}

              {isPreset && row.scheduleLabel ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-muted-foreground shadow-sm">
                  <CalendarDays
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                    aria-hidden
                  />
                  <span className="leading-snug">{row.scheduleLabel}</span>
                </div>
              ) : null}

              <div className={sectionCls}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <Label
                      htmlFor="automation-enabled"
                      className={cn(fieldLabelCls, "cursor-pointer")}
                    >
                      Statut
                    </Label>
                    <p className={hintTextCls}>
                      {enabled
                        ? "Les envois suivent le calendrier défini."
                        : "Brouillon — aucun envoi tant que c'est désactivé."}
                    </p>
                  </div>
                  <Switch
                    id="automation-enabled"
                    checked={enabled}
                    disabled={saving}
                    onCheckedChange={setEnabled}
                  />
                </div>
              </div>

              <div className={sectionCls}>
                <div className="space-y-1.5">
                  <Label
                    className={fieldLabelCls}
                    htmlFor="automation-send-time"
                  >
                    Heure d&apos;envoi
                  </Label>
                  <Input
                    id="automation-send-time"
                    type="time"
                    className={modalFieldCls}
                    value={sendTime}
                    disabled={saving}
                    onChange={(e) => setSendTime(e.target.value)}
                  />
                  <p className={hintTextCls}>Fuseau horaire : Europe/Paris</p>
                </div>
              </div>

              <div className={sectionCls}>
                <div className="space-y-1.5">
                  <Label className={fieldLabelCls}>
                    Message SMS{" "}
                    <span className="text-destructive" aria-hidden>
                      *
                    </span>
                  </Label>
                  <SmsMessageComposer
                    value={body}
                    onChange={(next) => {
                      setBody(next);
                      setError(null);
                    }}
                    hasError={Boolean(error)}
                    estimateSample={estimateSample}
                    customFieldDefs={customFieldDefs}
                    reserveStop
                    popoverClassName={dialogPopoverZCls}
                  />
                  {error ? (
                    <p className={cn(hintTextCls, "text-destructive")}>
                      {error}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <DialogFooter className="mx-0 mb-0 shrink-0 flex-row flex-wrap items-center justify-end gap-2 rounded-b-xl border-t border-border/60 bg-card p-2.5 px-4 sm:justify-end">
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
                onClick={() => void handleSave()}
                className="cursor-pointer"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
