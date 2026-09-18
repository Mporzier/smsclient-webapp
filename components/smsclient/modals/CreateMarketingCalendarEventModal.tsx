"use client";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import {
  MARKETING_CALENDAR_EVENT_TYPE_DOT_CLASS,
  MARKETING_CALENDAR_EVENT_TYPE_LABEL_KEYS,
  MARKETING_CALENDAR_EVENT_TYPES,
} from "@/lib/proto/marketingCalendarEventTypes";
import type { MarketingCalendarEventType } from "@/lib/types/marketingCalendarEvent";
import { CalendarPlus } from "lucide-react";
import { useCallback, useState } from "react";
import { FormDialogHeader } from "./FormDialogHeader";
import {
  dialogContentStackedZCls,
  dialogOverlayStackedCls,
  dialogPopoverZCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";
import { hasStackedOpenDialog } from "./modalFormGuard";

type CreateMarketingCalendarEventModalProps = {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  onCreate: (input: {
    title: string;
    date: string;
    type: MarketingCalendarEventType;
  }) => Promise<{ error: string | null }>;
};

const fieldLabelCls = "text-xs font-semibold text-foreground";
const hintTextCls = "text-xs font-normal leading-snug text-muted-foreground";
const modalFieldCls =
  "focus-visible:outline-none focus-visible:ring-0 aria-invalid:ring-0";

export function CreateMarketingCalendarEventModal({
  open,
  onClose,
  defaultDate = "",
  onCreate,
}: CreateMarketingCalendarEventModalProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [type, setType] = useState<MarketingCalendarEventType>("personal");
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTitle("");
      setDate(defaultDate);
      setType("personal");
      setSaving(false);
      setTitleError(null);
      setDateError(null);
      setSaveError(null);
    }
  }

  const handleClose = useCallback(() => {
    if (saving) return;
    onClose();
  }, [onClose, saving]);

  const handleSubmit = useCallback(async () => {
    const trimmed = title.trim();
    let hasFieldError = false;
    if (!trimmed) {
      setTitleError(t("dashboard.calendarEventErrorTitle"));
      hasFieldError = true;
    } else {
      setTitleError(null);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      setDateError(t("dashboard.calendarEventErrorDate"));
      hasFieldError = true;
    } else {
      setDateError(null);
    }
    if (hasFieldError) return;

    setSaving(true);
    setSaveError(null);
    const res = await onCreate({ title: trimmed, date: date.trim(), type });
    setSaving(false);
    if (res.error) {
      setSaveError(res.error);
      return;
    }
    onClose();
  }, [date, onClose, onCreate, t, title, type]);

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
          dialogContentStackedZCls,
        )}
        onOpenAutoFocus={preventDialogOpenAutoFocus}
        onPointerDownOutside={(e) => {
          if (hasStackedOpenDialog()) return;
          if (saving) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (hasStackedOpenDialog()) return;
          if (saving) e.preventDefault();
        }}
      >
        <FormDialogHeader
          icon={<CalendarPlus className="size-5" strokeWidth={2.25} />}
          title={t("dashboard.calendarAddEvent")}
          description={t("dashboard.calendarEventModalDesc")}
        />

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-1.5">
            <Label className={fieldLabelCls} htmlFor="mce-title">
              {t("dashboard.calendarEventTitleLabel")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="mce-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleError(null);
                setSaveError(null);
              }}
              placeholder={t("dashboard.calendarEventTitlePlaceholder")}
              disabled={saving}
              className={modalFieldCls}
              aria-invalid={Boolean(titleError)}
              aria-describedby={titleError ? "mce-title-err" : undefined}
            />
            {titleError ? (
              <p
                id="mce-title-err"
                className={cn(hintTextCls, "text-destructive")}
              >
                {titleError}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label className={fieldLabelCls}>
              {t("dashboard.calendarEventDateLabel")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <DatePicker
              value={date}
              onChange={(next) => {
                setDate(next);
                setDateError(null);
                setSaveError(null);
              }}
              disabled={saving}
              contentClassName={dialogPopoverZCls}
              className={cn(modalFieldCls, "w-full")}
            />
            {dateError ? (
              <p className={cn(hintTextCls, "text-destructive")}>{dateError}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <p className={fieldLabelCls}>{t("dashboard.calendarEventTypeLabel")}</p>
            <div
              role="radiogroup"
              aria-label={t("dashboard.calendarEventTypeLabel")}
              className="grid gap-2 sm:grid-cols-2"
            >
              {MARKETING_CALENDAR_EVENT_TYPES.map((typeId) => {
                const selected = type === typeId;
                return (
                  <Button
                    key={typeId}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    disabled={saving}
                    aria-pressed={selected}
                    className="h-auto cursor-pointer justify-start gap-2 px-3 py-2.5 text-left text-xs font-semibold"
                    onClick={() => {
                      setType(typeId);
                      setSaveError(null);
                    }}
                  >
                    <span
                      className={cn(
                        "h-2.5 w-2.5 shrink-0 rounded-full",
                        MARKETING_CALENDAR_EVENT_TYPE_DOT_CLASS[typeId],
                      )}
                      aria-hidden
                    />
                    {t(MARKETING_CALENDAR_EVENT_TYPE_LABEL_KEYS[typeId])}
                  </Button>
                );
              })}
            </div>
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
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={saving}
            onClick={() => void handleSubmit()}
            className="cursor-pointer"
          >
            {saving
              ? t("dashboard.calendarEventSaving")
              : t("dashboard.calendarEventSubmit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
