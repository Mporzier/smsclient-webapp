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
import { SmsMessageComposer } from "@/components/smsclient/CreateCampaign/SmsMessageComposer";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import { SMS_PRENOM_PREVIEW_SAMPLE } from "@/lib/proto/smsPersonalization";
import {
  isValidSmsTemplateBody,
  isValidSmsTemplateTitle,
  SMS_TEMPLATE_DESCRIPTION_MAX_LENGTH,
  SMS_TEMPLATE_TITLE_MAX_LENGTH,
  SMS_TEMPLATE_TITLE_MIN_LENGTH,
  type UserSmsTemplateRow,
} from "@/lib/types/smsTemplate";
import type { CustomFieldDef } from "@/lib/types/customFields";
import { LayoutTemplate, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { FormDialogHeader } from "./FormDialogHeader";
import {
  dialogContentStackedZCls,
  dialogOverlayStackedCls,
  dialogPopoverZCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";
import {
  hasStackedOpenDialog,
  smsTemplateFormSnapshotsEqual,
  useModalFormDirty,
} from "./modalFormGuard";

type TemplateSaveArgs = {
  title: string;
  description: string;
  body: string;
};

type CreateSmsTemplateModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (
    args: TemplateSaveArgs,
  ) => Promise<{ data: UserSmsTemplateRow | null; error: string | null }>;
  onCreated?: (row: UserSmsTemplateRow) => void;
  /** Ligne à éditer — omit / null = création. */
  editRow?: UserSmsTemplateRow | null;
  onUpdate?: (
    id: string,
    args: TemplateSaveArgs,
  ) => Promise<{ data: UserSmsTemplateRow | null; error: string | null }>;
  onDelete?: () => void;
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
  editRow = null,
  onUpdate,
  onDelete,
  customFieldDefs = [],
}: CreateSmsTemplateModalProps) {
  const { t } = useI18n();
  const isEdit = Boolean(editRow);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const editId = editRow?.id ?? null;
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevEditId, setPrevEditId] = useState(editId);
  if (open !== prevOpen || editId !== prevEditId) {
    setPrevOpen(open);
    setPrevEditId(editId);
    if (open) {
      setTitle(editRow?.title ?? "");
      setDescription(editRow?.description ?? "");
      setBody(editRow?.body ?? "");
      setTitleError(null);
      setBodyError(null);
      setSaveError(null);
      setSaving(false);
    }
  }

  const isDirty = useModalFormDirty(
    open,
    { title, description, body },
    smsTemplateFormSnapshotsEqual,
  );
  const canDismiss = !saving && !isDirty;

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
    const payload = { title, description, body };
    const { data, error: saveErr } =
      isEdit && editRow && onUpdate
        ? await onUpdate(editRow.id, payload)
        : await onCreate(payload);
    setSaving(false);
    if (saveErr || !data) {
      setSaveError(
        saveErr ??
          (isEdit ? t("templates.updateFailed") : t("templates.createFailed")),
      );
      return;
    }
    onCreated?.(data);
    onClose();
  }, [
    title,
    description,
    body,
    isEdit,
    editRow,
    onUpdate,
    onCreate,
    onCreated,
    onClose,
    t,
  ]);

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
          if (!canDismiss) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (hasStackedOpenDialog()) return;
          if (!canDismiss) e.preventDefault();
        }}
      >
        <FormDialogHeader
          icon={<LayoutTemplate />}
          title={t(isEdit ? "templates.editTitle" : "templates.createTitle")}
          description={t(
            isEdit ? "templates.editSubtitle" : "templates.createSubtitle",
          )}
        />

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-1.5">
            <Label
              className="flex justify-between gap-2"
              htmlFor="create-sms-template-title"
            >
              <span className={fieldLabelCls}>
                {t("templates.field.title")}{" "}
                <span className="text-destructive">*</span>
              </span>
              <span className={fieldMetaCls}>
                {title.length}/{SMS_TEMPLATE_TITLE_MAX_LENGTH}
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
            <Textarea
              id="create-sms-template-description"
              rows={2}
              maxLength={SMS_TEMPLATE_DESCRIPTION_MAX_LENGTH}
              className={cn(modalFieldCls, "min-h-[4.5rem] resize-none")}
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
            <span className={cn(fieldLabelCls, "block")}>
              {t("templates.field.body")}{" "}
              <span className="text-destructive">*</span>
            </span>
            <SmsMessageComposer
              value={body}
              onChange={(next) => {
                setBody(next);
                setBodyError(null);
                setSaveError(null);
              }}
              placeholder={t("templates.field.bodyPlaceholder")}
              hasError={Boolean(bodyError)}
              estimateFirstName={SMS_PRENOM_PREVIEW_SAMPLE}
              customFieldDefs={customFieldDefs}
              reserveStop
              popoverClassName={dialogPopoverZCls}
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

        <DialogFooter
          className={cn(
            "mx-0 mb-0 shrink-0 flex-row flex-wrap items-center gap-2 rounded-b-xl p-2.5 px-4",
            isEdit && onDelete ? "justify-between sm:justify-between" : "justify-end sm:justify-end",
          )}
        >
          {isEdit && onDelete ? (
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={onDelete}
              className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {t("common.delete")}
            </Button>
          ) : null}
          <div className="flex flex-wrap items-center justify-end gap-2">
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
                ? t(isEdit ? "templates.saving" : "templates.creating")
                : t(isEdit ? "templates.saveAction" : "templates.createAction")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
