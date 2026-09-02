"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SmsMergeTagMenu } from "@/components/smsclient/CreateCampaign/SmsMergeTagMenu";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import {
  isValidSmsTemplateBody,
  isValidSmsTemplateTitle,
  SMS_TEMPLATE_BODY_MAX_LENGTH,
  SMS_TEMPLATE_DESCRIPTION_MAX_LENGTH,
  SMS_TEMPLATE_TITLE_MAX_LENGTH,
  SMS_TEMPLATE_TITLE_MIN_LENGTH,
  type UserSmsTemplateRow,
} from "@/lib/types/smsTemplate";
import type { CustomFieldDef } from "@/lib/types/customFields";
import { LayoutTemplate } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { FormDialogHeader } from "./FormDialogHeader";
import {
  dialogContentStackedZCls,
  dialogOverlayStackedCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";
import { hasStackedOpenDialog } from "./modalFormGuard";

type CreateSmsTemplateModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (args: {
    title: string;
    description: string;
    body: string;
  }) => Promise<{ data: UserSmsTemplateRow | null; error: string | null }>;
  onCreated?: (row: UserSmsTemplateRow) => void;
  customFieldDefs?: readonly CustomFieldDef[];
};

const fieldLabelCls = "text-xs font-semibold text-foreground";
const fieldMetaCls = "text-xs font-normal text-muted-foreground";
const hintTextCls = "text-xs font-normal leading-snug text-muted-foreground";
const modalFieldCls =
  "focus-visible:outline-none focus-visible:ring-0 aria-invalid:ring-0";

export function CreateSmsTemplateModal({
  open,
  onClose,
  onCreate,
  onCreated,
  customFieldDefs = [],
}: CreateSmsTemplateModalProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTitle("");
      setDescription("");
      setBody("");
      setTitleError(null);
      setBodyError(null);
      setSaveError(null);
      setSaving(false);
    }
  }

  const insertBodyToken = useCallback((token: string) => {
    const el = bodyRef.current;
    if (!el) {
      setBody((prev) => `${prev}${token}`.slice(0, SMS_TEMPLATE_BODY_MAX_LENGTH));
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? start;
    const next = `${body.slice(0, start)}${token}${body.slice(end)}`.slice(
      0,
      SMS_TEMPLATE_BODY_MAX_LENGTH,
    );
    setBody(next);
    setBodyError(null);
    requestAnimationFrame(() => {
      const caret = Math.min(start + token.length, next.length);
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  }, [body]);

  const handleClose = useCallback(() => {
    if (saving) return;
    setTitleError(null);
    setBodyError(null);
    setSaveError(null);
    onClose();
  }, [onClose, saving]);

  const handleSubmit = useCallback(async () => {
    let hasFieldError = false;
    if (!isValidSmsTemplateTitle(title)) {
      setTitleError(
        t("templates.titleRequired", { min: SMS_TEMPLATE_TITLE_MIN_LENGTH }),
      );
      hasFieldError = true;
    } else {
      setTitleError(null);
    }
    if (!isValidSmsTemplateBody(body)) {
      setBodyError(t("templates.bodyRequired"));
      hasFieldError = true;
    } else {
      setBodyError(null);
    }
    if (hasFieldError) return;

    setSaving(true);
    setSaveError(null);
    const { data, error: createError } = await onCreate({
      title,
      description,
      body,
    });
    setSaving(false);
    if (createError || !data) {
      setSaveError(createError ?? t("templates.createFailed"));
      return;
    }
    onCreated?.(data);
    onClose();
  }, [title, description, body, onCreate, onCreated, onClose, t]);

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
          "max-h-[min(86dvh,640px)] sm:max-w-[520px]",
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
          icon={<LayoutTemplate />}
          title={t("templates.createTitle")}
          description={t("templates.createSubtitle")}
        />

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-1.5">
            <Label
              className="flex justify-between gap-2"
              htmlFor="create-sms-template-title"
            >
              <span className={fieldLabelCls}>{t("templates.field.title")}</span>
              <span className={fieldMetaCls}>
                {t("templates.field.titleCount", {
                  current: title.trim().length,
                  max: SMS_TEMPLATE_TITLE_MAX_LENGTH,
                  min: SMS_TEMPLATE_TITLE_MIN_LENGTH,
                })}
              </span>
            </Label>
            <Input
              id="create-sms-template-title"
              type="text"
              maxLength={SMS_TEMPLATE_TITLE_MAX_LENGTH}
              className={modalFieldCls}
              placeholder={t("templates.field.titlePlaceholder")}
              value={title}
              aria-invalid={Boolean(titleError)}
              aria-describedby={
                titleError ? "create-sms-template-title-err" : undefined
              }
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleError(null);
                setSaveError(null);
              }}
              disabled={saving}
            />
            {titleError ? (
              <p
                id="create-sms-template-title-err"
                className={cn(hintTextCls, "text-destructive")}
              >
                {titleError}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label
              className="flex justify-between gap-2"
              htmlFor="create-sms-template-description"
            >
              <span className={fieldLabelCls}>
                {t("templates.field.description")}
              </span>
              <span className={fieldMetaCls}>
                {description.length}/{SMS_TEMPLATE_DESCRIPTION_MAX_LENGTH}
              </span>
            </Label>
            <Input
              id="create-sms-template-description"
              type="text"
              maxLength={SMS_TEMPLATE_DESCRIPTION_MAX_LENGTH}
              className={modalFieldCls}
              placeholder={t("templates.field.descriptionPlaceholder")}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setSaveError(null);
              }}
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label
                className="flex min-w-0 flex-1 items-baseline justify-between gap-2"
                htmlFor="create-sms-template-body"
              >
                <span className={fieldLabelCls}>{t("templates.field.body")}</span>
                <span className={fieldMetaCls}>
                  {body.length}/{SMS_TEMPLATE_BODY_MAX_LENGTH}
                </span>
              </Label>
              <SmsMergeTagMenu
                defs={customFieldDefs}
                onInsert={insertBodyToken}
              />
            </div>
            <Textarea
              id="create-sms-template-body"
              ref={bodyRef}
              rows={5}
              maxLength={SMS_TEMPLATE_BODY_MAX_LENGTH}
              className={cn(modalFieldCls, "min-h-[120px] resize-y")}
              placeholder={t("templates.field.bodyPlaceholder")}
              value={body}
              aria-invalid={Boolean(bodyError)}
              aria-describedby={
                bodyError ? "create-sms-template-body-err" : undefined
              }
              onChange={(e) => {
                setBody(e.target.value);
                setBodyError(null);
                setSaveError(null);
              }}
              disabled={saving}
            />
            {bodyError ? (
              <p
                id="create-sms-template-body-err"
                className={cn(hintTextCls, "text-destructive")}
              >
                {bodyError}
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
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={saving}
            onClick={() => void handleSubmit()}
            className="cursor-pointer"
          >
            {saving ? t("templates.creating") : t("templates.createAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
