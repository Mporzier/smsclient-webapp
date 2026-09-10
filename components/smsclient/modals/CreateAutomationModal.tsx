"use client";

import { SmsMessageComposer } from "@/components/smsclient/CreateCampaign/SmsMessageComposer";
import { AUTOMATION_WEEKDAY_OPTIONS } from "@/lib/automations/scheduleLabel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { validateAutomationSmsBody } from "@/lib/automations/messageValidation";
import { cn } from "@/lib/cn";
import { buildEstimateMergeValues } from "@/lib/proto/smsPersonalization";
import type { ContactRowData } from "@/lib/types/contact";
import type { CustomFieldDef } from "@/lib/types/customFields";
import type { AutomationSavePayload } from "@/lib/types/automation";
import {
  AUTOMATION_NAME_MAX_LENGTH as NAME_MAX,
  AUTOMATION_NAME_MIN_LENGTH as NAME_MIN,
} from "@/lib/types/automation";
import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { FormDialogHeader } from "./FormDialogHeader";
import { hasStackedOpenDialog } from "./modalFormGuard";
import {
  dialogContentStackedZCls,
  dialogOverlayStackedCls,
  dialogPopoverZCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";

const fieldLabelCls = "text-xs font-semibold text-foreground";
const fieldMetaCls = "text-xs font-normal text-muted-foreground";
const hintTextCls = "text-xs font-normal leading-snug text-muted-foreground";
const modalFieldCls =
  "focus-visible:outline-none focus-visible:ring-0 aria-invalid:ring-0";

const selectContentCls = cn(dialogPopoverZCls, "max-h-60");

type ScheduleType = "fixed_date" | "recurring";
type RecurrenceMode = "weekly" | "interval_days" | "interval_months";

function isDialogPortaledLayer(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      '[data-slot="select-content"], [data-slot="popover-content"]',
    ),
  );
}

export type CreateAutomationModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: AutomationSavePayload) => Promise<void>;
  contacts?: ContactRowData[];
  customFieldDefs?: readonly CustomFieldDef[];
};

export function CreateAutomationModal({
  open,
  onClose,
  onSave,
  contacts = [],
  customFieldDefs = [],
}: CreateAutomationModalProps) {
  const [name, setName] = useState("");
  const [scheduleType, setScheduleType] = useState<ScheduleType>("fixed_date");
  const [fixedMonth, setFixedMonth] = useState("1");
  const [fixedDay, setFixedDay] = useState("1");
  const [recurrenceMode, setRecurrenceMode] =
    useState<RecurrenceMode>("weekly");
  const [recurrenceInterval, setRecurrenceInterval] = useState("7");
  const [recurrenceWeekday, setRecurrenceWeekday] = useState("1");
  const [body, setBody] = useState("");
  const [sendTime, setSendTime] = useState("09:00");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const estimateSample = useMemo(
    () => buildEstimateMergeValues(contacts, customFieldDefs),
    [contacts, customFieldDefs],
  );

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName("");
      setScheduleType("fixed_date");
      setFixedMonth("1");
      setFixedDay("1");
      setRecurrenceMode("weekly");
      setRecurrenceInterval("7");
      setRecurrenceWeekday("1");
      setBody("");
      setSendTime("09:00");
      setNameError(null);
      setScheduleError(null);
      setBodyError(null);
      setSaveError(null);
      setSaving(false);
    }
  }

  const handleClose = useCallback(() => {
    if (saving) return;
    setNameError(null);
    setScheduleError(null);
    setBodyError(null);
    setSaveError(null);
    onClose();
  }, [onClose, saving]);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    let hasError = false;

    if (trimmedName.length < NAME_MIN || trimmedName.length > NAME_MAX) {
      setNameError(
        `Le nom doit contenir entre ${NAME_MIN} et ${NAME_MAX} caractères.`,
      );
      hasError = true;
    } else {
      setNameError(null);
    }

    let payload: Extract<AutomationSavePayload, { mode: "custom" }> | null =
      null;

    if (scheduleType === "fixed_date") {
      const month = Number.parseInt(fixedMonth, 10);
      const day = Number.parseInt(fixedDay, 10);
      const dateValid =
        Number.isFinite(month) &&
        Number.isFinite(day) &&
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31;
      if (!dateValid) {
        setScheduleError("Indiquez une date valide (jour et mois).");
        hasError = true;
      } else {
        setScheduleError(null);
        payload = {
          mode: "custom",
          name: trimmedName,
          kind: "fixed_date",
          body: "",
          enabled: false,
          sendTime,
          fixedMonth: month,
          fixedDay: day,
        };
      }
    } else if (recurrenceMode === "weekly") {
      const weekday = Number.parseInt(recurrenceWeekday, 10);
      if (!Number.isFinite(weekday) || weekday < 1 || weekday > 7) {
        setScheduleError("Choisissez un jour de la semaine.");
        hasError = true;
      } else {
        setScheduleError(null);
        payload = {
          mode: "custom",
          name: trimmedName,
          kind: "recurring",
          body: "",
          enabled: false,
          sendTime,
          recurrenceUnit: "weeks",
          recurrenceInterval: 1,
          recurrenceWeekday: weekday,
        };
      }
    } else {
      const interval = Number.parseInt(recurrenceInterval, 10);
      const unit = recurrenceMode === "interval_days" ? "days" : "months";
      const max = unit === "days" ? 365 : 24;
      if (!Number.isFinite(interval) || interval < 1 || interval > max) {
        setScheduleError(
          unit === "days"
            ? "Indiquez un intervalle entre 1 et 365 jours."
            : "Indiquez un intervalle entre 1 et 24 mois.",
        );
        hasError = true;
      } else {
        setScheduleError(null);
        payload = {
          mode: "custom",
          name: trimmedName,
          kind: "recurring",
          body: "",
          enabled: false,
          sendTime,
          recurrenceUnit: unit,
          recurrenceInterval: interval,
        };
      }
    }

    const bodyValidationError = validateAutomationSmsBody(body, {
      reserveStop: true,
      estimateSample,
      customFieldDefs,
    });
    if (bodyValidationError) {
      setBodyError(bodyValidationError);
      hasError = true;
    } else {
      setBodyError(null);
    }

    if (hasError || !payload) return;

    setSaving(true);
    setSaveError(null);
    try {
      await onSave({ ...payload, body: body.trim() });
      handleClose();
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : "Une erreur est survenue.",
      );
    } finally {
      setSaving(false);
    }
  }, [
    body,
    customFieldDefs,
    estimateSample,
    fixedDay,
    fixedMonth,
    handleClose,
    name,
    onSave,
    recurrenceInterval,
    recurrenceMode,
    recurrenceWeekday,
    scheduleType,
    sendTime,
  ]);

  const guardPortaledLayer = useCallback((e: Event) => {
    if (isDialogPortaledLayer(e.target)) {
      e.preventDefault();
    }
  }, []);

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
          "max-h-[min(90dvh,820px)] sm:max-w-[620px]",
          dialogContentStackedZCls,
        )}
        onOpenAutoFocus={preventDialogOpenAutoFocus}
        onPointerDownOutside={(e) => {
          guardPortaledLayer(e);
          if (hasStackedOpenDialog()) return;
          if (saving) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          guardPortaledLayer(e);
        }}
        onEscapeKeyDown={(e) => {
          if (hasStackedOpenDialog()) return;
          if (saving) e.preventDefault();
        }}
      >
        <FormDialogHeader
          icon={<Plus />}
          title="Créer une automatisation"
          description="Planification par date, message et variables."
        />

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-1.5">
            <Label
              className="flex justify-between gap-2"
              htmlFor="create-automation-name"
            >
              <span className={fieldLabelCls}>
                Nom <span className="text-destructive">*</span>
              </span>
              <span className={fieldMetaCls}>
                {name.length}/{NAME_MAX}
              </span>
            </Label>
            <Input
              id="create-automation-name"
              className={modalFieldCls}
              maxLength={NAME_MAX}
              value={name}
              placeholder="Ex. Relance clients fidèles"
              aria-invalid={Boolean(nameError)}
              disabled={saving}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(null);
                setSaveError(null);
              }}
            />
            {nameError ? (
              <p className={cn(hintTextCls, "text-destructive")}>{nameError}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label className={fieldLabelCls} htmlFor="create-automation-schedule">
              Planification
            </Label>
            <Select
              value={scheduleType}
              onValueChange={(value) => {
                setScheduleType(value as ScheduleType);
                setScheduleError(null);
              }}
              disabled={saving}
            >
              <SelectTrigger
                id="create-automation-schedule"
                className={cn("w-full", modalFieldCls)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className={selectContentCls}
              >
                <SelectItem value="fixed_date">
                  Date fixe (chaque année)
                </SelectItem>
                <SelectItem value="recurring">Récurrence</SelectItem>
              </SelectContent>
            </Select>

            {scheduleType === "fixed_date" ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1.5">
                  <Label
                    className={fieldLabelCls}
                    htmlFor="create-automation-month"
                  >
                    Mois
                  </Label>
                  <Select
                    value={fixedMonth}
                    onValueChange={setFixedMonth}
                    disabled={saving}
                  >
                    <SelectTrigger
                      id="create-automation-month"
                      className={cn("w-full", modalFieldCls)}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      className={selectContentCls}
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const m = String(i + 1);
                        return (
                          <SelectItem key={m} value={m}>
                            {m.padStart(2, "0")}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label
                    className={fieldLabelCls}
                    htmlFor="create-automation-day"
                  >
                    Jour
                  </Label>
                  <Select
                    value={fixedDay}
                    onValueChange={setFixedDay}
                    disabled={saving}
                  >
                    <SelectTrigger
                      id="create-automation-day"
                      className={cn("w-full", modalFieldCls)}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      className={selectContentCls}
                    >
                      {Array.from({ length: 31 }, (_, i) => {
                        const d = String(i + 1);
                        return (
                          <SelectItem key={d} value={d}>
                            {d.padStart(2, "0")}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <p className={cn("col-span-2", hintTextCls)}>
                  Envoi chaque année à cette date.
                </p>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <Select
                  value={recurrenceMode}
                  onValueChange={(value) => {
                    setRecurrenceMode(value as RecurrenceMode);
                    setScheduleError(null);
                  }}
                  disabled={saving}
                >
                  <SelectTrigger className={cn("w-full", modalFieldCls)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    className={selectContentCls}
                  >
                    <SelectItem value="weekly">Chaque semaine</SelectItem>
                    <SelectItem value="interval_days">
                      Tous les X jours
                    </SelectItem>
                    <SelectItem value="interval_months">
                      Tous les X mois
                    </SelectItem>
                  </SelectContent>
                </Select>

                {recurrenceMode === "weekly" ? (
                  <div className="space-y-1.5">
                    <Label
                      className={fieldLabelCls}
                      htmlFor="create-automation-weekday"
                    >
                      Jour de la semaine
                    </Label>
                    <Select
                      value={recurrenceWeekday}
                      onValueChange={setRecurrenceWeekday}
                      disabled={saving}
                    >
                      <SelectTrigger
                        id="create-automation-weekday"
                        className={cn("w-full", modalFieldCls)}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        className={selectContentCls}
                      >
                        {AUTOMATION_WEEKDAY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label
                      className={fieldLabelCls}
                      htmlFor="create-automation-interval"
                    >
                      {recurrenceMode === "interval_days"
                        ? "Nombre de jours"
                        : "Nombre de mois"}
                    </Label>
                    <Input
                      id="create-automation-interval"
                      type="number"
                      min={1}
                      max={recurrenceMode === "interval_days" ? 365 : 24}
                      className={modalFieldCls}
                      value={recurrenceInterval}
                      disabled={saving}
                      onChange={(e) => {
                        setRecurrenceInterval(e.target.value);
                        setScheduleError(null);
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {scheduleError ? (
              <p className={cn(hintTextCls, "text-destructive")}>
                {scheduleError}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label className={fieldLabelCls} htmlFor="create-automation-send-time">
              Heure d&apos;envoi
            </Label>
            <Input
              id="create-automation-send-time"
              type="time"
              className={modalFieldCls}
              value={sendTime}
              disabled={saving}
              onChange={(e) => setSendTime(e.target.value)}
            />
            <p className={hintTextCls}>Fuseau horaire : Europe/Paris</p>
          </div>

          <div className="space-y-1.5">
            <span className={cn(fieldLabelCls, "block")}>
              Message SMS <span className="text-destructive">*</span>
            </span>
            <SmsMessageComposer
              value={body}
              onChange={(next) => {
                setBody(next);
                setBodyError(null);
                setSaveError(null);
              }}
              placeholder="Ex. Bonjour {prenom}, profitez de notre offre du mois !"
              hasError={Boolean(bodyError)}
              estimateSample={estimateSample}
              customFieldDefs={customFieldDefs}
              reserveStop
              popoverClassName={dialogPopoverZCls}
            />
            {bodyError ? (
              <p className={cn(hintTextCls, "text-destructive")}>{bodyError}</p>
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
            onClick={() => void handleSave()}
            className="cursor-pointer"
          >
            {saving ? "Création…" : "Créer l'automatisation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
