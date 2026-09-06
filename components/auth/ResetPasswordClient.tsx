"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import { getAuthLoginPath } from "@/lib/auth/siteUrl";
import { AppLoadingOverlay } from "@/components/ui/AppLoadingOverlay";
import {
  completePasswordReset,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  type PasswordChangeErrorCode,
} from "@/lib/supabase/changePassword";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const fieldLabelCls = "text-xs font-semibold text-foreground";
const hintTextCls = "text-xs font-normal leading-snug text-muted-foreground";
const inputCls =
  "focus-visible:outline-none focus-visible:ring-0 aria-invalid:ring-0";

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

export function ResetPasswordClient() {
  const { t } = useI18n();
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newError, setNewError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void createClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (!session) {
          router.replace(getAuthLoginPath("password_reset_expired=1"));
          return;
        }
        setCheckingSession(false);
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewError(null);
    setConfirmError(null);
    setSaveError(null);
    setSaving(true);
    const result = await completePasswordReset({
      newPassword,
      confirmPassword,
    });
    setSaving(false);
    if (!result.ok) {
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
    router.replace(getAuthLoginPath("password_changed=1"));
  };

  if (checkingSession) {
    return <AppLoadingOverlay />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4 py-12">
      <div className="mx-auto w-full max-w-[400px] rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <h1 className="text-2xl font-black text-slate-900">
          {t("compte.passwordResetPageTitle")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {t("compte.passwordResetPageDesc")}
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label className={fieldLabelCls} htmlFor="reset-password-new">
              {t("compte.passwordNew")}
            </Label>
            <Input
              id="reset-password-new"
              type="password"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              value={newPassword}
              disabled={saving}
              aria-invalid={Boolean(newError)}
              className={inputCls}
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
              <p className={cn(hintTextCls, "text-destructive")}>{newError}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label className={fieldLabelCls} htmlFor="reset-password-confirm">
              {t("compte.passwordConfirm")}
            </Label>
            <Input
              id="reset-password-confirm"
              type="password"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              value={confirmPassword}
              disabled={saving}
              aria-invalid={Boolean(confirmError)}
              className={inputCls}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmError) setConfirmError(null);
              }}
            />
            {confirmError ? (
              <p className={cn(hintTextCls, "text-destructive")}>
                {confirmError}
              </p>
            ) : null}
          </div>
          {saveError ? (
            <p className="text-sm text-destructive">{saveError}</p>
          ) : null}
          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={saving}
          >
            {saving ? t("dialog.saving") : t("compte.passwordResetPageSubmit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
