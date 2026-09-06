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
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import { getAuthLoginPath } from "@/lib/auth/siteUrl";
import {
  changePassword,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  sendPasswordResetEmail,
  type PasswordChangeErrorCode,
} from "@/lib/supabase/changePassword";
import { KeyRound } from "lucide-react";
import { useCallback, useState } from "react";
import { FormDialogHeader } from "./FormDialogHeader";
import {
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";
import { hasStackedOpenDialog, useModalFormDirty } from "./modalFormGuard";

type ChangePasswordModalProps = {
  open: boolean;
  email: string;
  onClose: () => void;
  onPasswordChanged?: () => void;
};

const fieldLabelCls = "text-xs font-semibold text-foreground";
const hintTextCls = "text-xs font-normal leading-snug text-muted-foreground";
const modalFieldCls =
  "focus-visible:outline-none focus-visible:ring-0 aria-invalid:ring-0";

const CURRENT_ERR: Record<
  Extract<PasswordChangeErrorCode, "current_required" | "current_invalid">,
  MessageKey
> = {
  current_required: "compte.passwordCurrentRequired",
  current_invalid: "compte.passwordCurrentInvalid",
};

const NEW_ERR: Record<
  Extract<
    PasswordChangeErrorCode,
    "new_required" | "new_invalid" | "same_password"
  >,
  MessageKey
> = {
  new_required: "compte.passwordNewRequired",
  new_invalid: "compte.passwordNewInvalid",
  same_password: "compte.passwordSame",
};

const CONFIRM_ERR: Record<
  Extract<PasswordChangeErrorCode, "confirm_required" | "confirm_mismatch">,
  MessageKey
> = {
  confirm_required: "compte.passwordConfirmRequired",
  confirm_mismatch: "compte.passwordConfirmMismatch",
};

export function ChangePasswordModal({
  open,
  email,
  onClose,
  onPasswordChanged,
}: ChangePasswordModalProps) {
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [newError, setNewError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetEmailPending, setResetEmailPending] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [success, setSuccess] = useState(false);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setCurrentError(null);
      setNewError(null);
      setConfirmError(null);
      setSaveError(null);
      setSaving(false);
      setResetEmailPending(false);
      setResetEmailSent(false);
      setSuccess(false);
    }
  }

  const isDirty = useModalFormDirty(
    open,
    { currentPassword, newPassword, confirmPassword },
    (a, b) =>
      a.currentPassword === b.currentPassword &&
      a.newPassword === b.newPassword &&
      a.confirmPassword === b.confirmPassword,
  );
  const canDismiss =
    !saving && !resetEmailPending && (!isDirty || success || resetEmailSent);

  const handleClose = useCallback(() => {
    if (saving || resetEmailPending) return;
    onClose();
  }, [onClose, resetEmailPending, saving]);

  const handleSubmit = useCallback(async () => {
    setCurrentError(null);
    setNewError(null);
    setConfirmError(null);
    setSaveError(null);
    setSaving(true);
    const result = await changePassword({
      email,
      currentPassword,
      newPassword,
      confirmPassword,
    });
    setSaving(false);
    if (!result.ok) {
      if (result.field === "current" && result.code in CURRENT_ERR) {
        setCurrentError(
          t(CURRENT_ERR[result.code as keyof typeof CURRENT_ERR]),
        );
        return;
      }
      if (result.field === "new" && result.code in NEW_ERR) {
        setNewError(t(NEW_ERR[result.code as keyof typeof NEW_ERR]));
        return;
      }
      if (result.field === "confirm" && result.code in CONFIRM_ERR) {
        setConfirmError(
          t(CONFIRM_ERR[result.code as keyof typeof CONFIRM_ERR]),
        );
        return;
      }
      setSaveError(t("compte.passwordFailed"));
      return;
    }
    setSuccess(true);
    onPasswordChanged?.();
  }, [
    confirmPassword,
    currentPassword,
    email,
    newPassword,
    onPasswordChanged,
    t,
  ]);

  const handleSendResetEmail = useCallback(async () => {
    setSaveError(null);
    setResetEmailPending(true);
    const result = await sendPasswordResetEmail(email);
    setResetEmailPending(false);
    if (!result.ok) {
      setSaveError(result.message);
      return;
    }
    setResetEmailSent(true);
  }, [email]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          if (saving || resetEmailPending || hasStackedOpenDialog()) return;
          if (!canDismiss) return;
          handleClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={!saving && !resetEmailPending}
        overlayClassName={dialogOverlayCls}
        className={cn(
          formDialogContentCls,
          "max-h-[min(86dvh,680px)] sm:max-w-[480px]",
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
          icon={<KeyRound />}
          title={t(
            success
              ? "compte.passwordSuccessTitle"
              : resetEmailSent
                ? "compte.passwordResetEmailTitle"
                : "compte.passwordEditTitle",
          )}
        />

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {success ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
              {t("compte.passwordSuccessBody")}
            </p>
          ) : resetEmailSent ? (
            <p className="text-sm leading-relaxed text-foreground">
              {t("compte.passwordResetEmailBody", { email })}
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label
                  className={fieldLabelCls}
                  htmlFor="change-password-current"
                >
                  {t("compte.passwordCurrent")}
                </Label>
                <Input
                  id="change-password-current"
                  type="password"
                  autoComplete="current-password"
                  maxLength={PASSWORD_MAX_LENGTH}
                  value={currentPassword}
                  disabled={saving}
                  aria-invalid={Boolean(currentError)}
                  className={modalFieldCls}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (currentError) setCurrentError(null);
                  }}
                />
                {currentError ? (
                  <p className={cn(hintTextCls, "text-destructive")}>
                    {currentError}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label className={fieldLabelCls} htmlFor="change-password-new">
                  {t("compte.passwordNew")}
                </Label>
                <Input
                  id="change-password-new"
                  type="password"
                  autoComplete="new-password"
                  maxLength={PASSWORD_MAX_LENGTH}
                  value={newPassword}
                  disabled={saving}
                  aria-invalid={Boolean(newError)}
                  className={modalFieldCls}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (newError) setNewError(null);
                  }}
                />
                <p className={hintTextCls}>
                  {t("compte.passwordRules", {
                    min: PASSWORD_MIN_LENGTH,
                    max: PASSWORD_MAX_LENGTH,
                  })}
                </p>
                {newError ? (
                  <p className={cn(hintTextCls, "text-destructive")}>
                    {newError}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label
                  className={fieldLabelCls}
                  htmlFor="change-password-confirm"
                >
                  {t("compte.passwordConfirm")}
                </Label>
                <Input
                  id="change-password-confirm"
                  type="password"
                  autoComplete="new-password"
                  maxLength={PASSWORD_MAX_LENGTH}
                  value={confirmPassword}
                  disabled={saving}
                  aria-invalid={Boolean(confirmError)}
                  className={modalFieldCls}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmError) setConfirmError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleSubmit();
                    }
                  }}
                />
                {confirmError ? (
                  <p className={cn(hintTextCls, "text-destructive")}>
                    {confirmError}
                  </p>
                ) : null}
              </div>
              <div className="border-t border-border pt-3">
                <p className={hintTextCls}>{t("compte.passwordResetHint")}</p>
                <Button
                  type="button"
                  variant="link"
                  disabled={saving || resetEmailPending}
                  className="mt-1 h-auto cursor-pointer p-0 text-sm"
                  onClick={() => void handleSendResetEmail()}
                >
                  {resetEmailPending
                    ? t("compte.passwordResetEmailSending")
                    : t("compte.passwordResetEmailAction")}
                </Button>
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
            disabled={saving || resetEmailPending}
            onClick={() => {
              if (success) {
                window.location.assign(getAuthLoginPath("password_changed=1"));
                return;
              }
              handleClose();
            }}
            className="cursor-pointer"
          >
            {t(
              success || resetEmailSent ? "dialog.close" : "common.cancel",
            )}
          </Button>
          {success || resetEmailSent ? null : (
            <Button
              type="button"
              variant="default"
              disabled={saving}
              onClick={() => void handleSubmit()}
              className="cursor-pointer"
            >
              {saving ? t("dialog.saving") : t("compte.passwordSubmit")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
