"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import { EMAIL_MAX_LENGTH } from "@/lib/forms/fieldLimits";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  requestEmailChange,
  type EmailChangeErrorCode,
} from "@/lib/supabase/changeEmail";
import { Mail } from "lucide-react";
import { useCallback, useState } from "react";
import { FormDialogHeader } from "./FormDialogHeader";
import {
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";
import { hasStackedOpenDialog, useModalFormDirty } from "./modalFormGuard";

type ChangeEmailModalProps = {
  open: boolean;
  currentEmail: string;
  onClose: () => void;
  onRequested?: (newEmail: string) => void;
};

const fieldLabelCls = "text-xs font-semibold text-foreground";
const hintTextCls = "text-xs font-normal leading-snug text-muted-foreground";
const modalFieldCls =
  "focus-visible:outline-none focus-visible:ring-0 aria-invalid:ring-0";

const EMAIL_ERR: Record<
  Extract<
    EmailChangeErrorCode,
    "email_required" | "email_invalid" | "email_same" | "email_exists"
  >,
  MessageKey
> = {
  email_required: "compte.emailRequired",
  email_invalid: "compte.emailInvalid",
  email_same: "compte.emailSame",
  email_exists: "compte.emailExists",
};

const PASSWORD_ERR: Record<
  Extract<EmailChangeErrorCode, "password_required" | "password_invalid">,
  MessageKey
> = {
  password_required: "compte.emailPasswordRequired",
  password_invalid: "compte.emailPasswordInvalid",
};

export function ChangeEmailModal({
  open,
  currentEmail,
  onClose,
  onRequested,
}: ChangeEmailModalProps) {
  const { t } = useI18n();
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setNewEmail("");
      setPassword("");
      setEmailError(null);
      setPasswordError(null);
      setSaveError(null);
      setSaving(false);
      setSentTo(null);
    }
  }

  const isDirty = useModalFormDirty(
    open,
    { newEmail, password },
    (a, b) => a.newEmail === b.newEmail && a.password === b.password,
  );
  const canDismiss = !saving && (!isDirty || Boolean(sentTo));

  const handleClose = useCallback(() => {
    if (saving) return;
    onClose();
  }, [onClose, saving]);

  const handleSubmit = useCallback(async () => {
    setEmailError(null);
    setPasswordError(null);
    setSaveError(null);
    setSaving(true);
    const result = await requestEmailChange({
      currentEmail,
      newEmail,
      password,
    });
    setSaving(false);
    if (!result.ok) {
      if (result.field === "email" && result.code in EMAIL_ERR) {
        setEmailError(
          t(EMAIL_ERR[result.code as keyof typeof EMAIL_ERR]),
        );
        return;
      }
      if (result.field === "password" && result.code in PASSWORD_ERR) {
        setPasswordError(
          t(PASSWORD_ERR[result.code as keyof typeof PASSWORD_ERR]),
        );
        return;
      }
      setSaveError(t("compte.emailFailed"));
      return;
    }
    setSentTo(result.newEmail);
    onRequested?.(result.newEmail);
  }, [currentEmail, newEmail, onRequested, password, t]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          if (saving || hasStackedOpenDialog()) return;
          if (!canDismiss) return;
          handleClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={!saving}
        overlayClassName={dialogOverlayCls}
        className={cn(
          formDialogContentCls,
          "max-h-[min(86dvh,640px)] sm:max-w-[480px]",
          dialogContentZCls,
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
          icon={<Mail />}
          title={t(
            sentTo ? "compte.emailSuccessTitle" : "compte.emailEditTitle",
          )}
        />

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {sentTo ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
              {t("compte.emailSuccessBody", {
                email: sentTo,
                current: currentEmail,
              })}
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className={fieldLabelCls} htmlFor="change-email-current">
                  {t("compte.email")}
                </Label>
                <Input
                  id="change-email-current"
                  type="email"
                  value={currentEmail}
                  disabled
                  readOnly
                  className={modalFieldCls}
                />
              </div>
              <div className="space-y-1.5">
                <Label className={fieldLabelCls} htmlFor="change-email-new">
                  {t("compte.emailNew")}
                </Label>
                <Input
                  id="change-email-new"
                  type="email"
                  autoComplete="email"
                  maxLength={EMAIL_MAX_LENGTH}
                  value={newEmail}
                  disabled={saving}
                  aria-invalid={Boolean(emailError)}
                  className={modalFieldCls}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                />
                {emailError ? (
                  <p className={cn(hintTextCls, "text-destructive")}>
                    {emailError}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label
                  className={fieldLabelCls}
                  htmlFor="change-email-password"
                >
                  {t("compte.emailPassword")}
                </Label>
                <Input
                  id="change-email-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  disabled={saving}
                  aria-invalid={Boolean(passwordError)}
                  className={modalFieldCls}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleSubmit();
                    }
                  }}
                />
                {passwordError ? (
                  <p className={cn(hintTextCls, "text-destructive")}>
                    {passwordError}
                  </p>
                ) : null}
              </div>
            </>
          )}
        </div>

        {saveError ? (
          <div className="shrink-0 border-t border-destructive/30 bg-destructive/10 px-6 py-2 text-sm text-destructive">
            {saveError}
          </div>
        ) : null}

        <DialogFooter className="mx-0 mb-0 shrink-0 flex-row items-center justify-end gap-2 rounded-b-xl p-2.5 px-4">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={handleClose}
            className="cursor-pointer"
          >
            {t(sentTo ? "dialog.close" : "common.cancel")}
          </Button>
          {sentTo ? null : (
            <Button
              type="button"
              variant="default"
              disabled={saving}
              onClick={() => void handleSubmit()}
              className="cursor-pointer"
            >
              {saving ? t("dialog.saving") : t("compte.emailSubmit")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
