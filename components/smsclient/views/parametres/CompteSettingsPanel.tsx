"use client";

import { Button } from "@/components/ui/button";
import { LoadingLabel } from "@/components/ui/loading-label";
import {
  LanguageFlag,
  ParametresDisplayRow,
  valueIconCls,
} from "@/components/smsclient/views/parametres/ParametresDisplayRow";
import { cn } from "@/lib/cn";
import { ChangeEmailModal } from "@/components/smsclient/modals/ChangeEmailModal";
import { ChangePasswordModal } from "@/components/smsclient/modals/ChangePasswordModal";
import {
  ConfirmInfoCard,
  confirmCardBlueCls,
  confirmCardBlueIconCls,
} from "@/components/smsclient/modals/ConfirmInfoCard";
import {
  PERSON_NAME_MAX_LENGTH,
  PHONE_DISPLAY_MAX_LENGTH,
} from "@/lib/forms/fieldLimits";
import type { ProfileLanguage, UserProfileForm } from "@/lib/types/profile";
import { useI18n } from "@/lib/i18n";
import {
  caretAfterPhoneFormat,
  formatFrPhoneInput,
  isValidFrMobile,
} from "@/lib/proto/smsUtils";
import { useAuth } from "@/components/auth/AuthProvider";
import { peekPendingEmailChange } from "@/lib/auth/pendingEmailChange";
import {
  cancelPendingEmailChange,
  resendPendingEmailChange,
} from "@/lib/supabase/changeEmail";
import {
  Info,
  KeyRound,
  Mail,
  Phone,
  User,
  UserRound,
} from "lucide-react";
import {
  parametresFieldStackCls,
  parametresToastError,
} from "@/components/smsclient/views/parametres/parametresSettings";
import { useCallback, useState, type ChangeEvent } from "react";

type EditableKey = "firstName" | "lastName" | "phone" | "language";

type CompteSettingsPanelProps = {
  form: UserProfileForm;
  loading?: boolean;
  saving?: boolean;
  onSaveField: <K extends keyof UserProfileForm>(
    key: K,
    value: UserProfileForm[K],
  ) => void | Promise<void>;
};

export function CompteSettingsPanel({
  form,
  loading = false,
  saving = false,
  onSaveField,
}: CompteSettingsPanelProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [editKey, setEditKey] = useState<EditableKey | null>(null);
  const [draft, setDraft] = useState("");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pendingEmailOverride, setPendingEmailOverride] = useState<
    string | null
  >(() => peekPendingEmailChange());
  const pendingEmail = user?.new_email ?? pendingEmailOverride;
  const [emailActionPending, setEmailActionPending] = useState(false);
  const [emailActionNotice, setEmailActionNotice] = useState<string | null>(
    null,
  );
  const [emailActionIsError, setEmailActionIsError] = useState(false);
  const languageLabel = (lang: ProfileLanguage) =>
    lang === "en" ? t("compte.lang.en") : t("compte.lang.fr");

  const openEdit = (key: EditableKey) => {
    if (saving || loading) return;
    setEditKey(key);
    setDraft(form[key]);
  };

  const closeEdit = () => {
    if (saving) return;
    setEditKey(null);
    setDraft("");
  };

  const handlePhoneChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const raw = input.value;
    const caret = input.selectionStart ?? raw.length;
    const formatted = formatFrPhoneInput(raw);
    const nextCaret = caretAfterPhoneFormat(raw, caret, formatted);
    input.value = formatted;
    input.setSelectionRange(nextCaret, nextCaret);
    setDraft(formatted);
  }, []);

  const handleSaveEdit = async () => {
    if (!editKey) return;
    if (editKey === "firstName" && !draft.trim()) {
      parametresToastError(t("parametres.firstNameRequired"));
      return;
    }
    if (editKey === "phone") {
      const digits = draft.replace(/\D/g, "");
      if (digits.length > 0 && !isValidFrMobile(draft)) {
        parametresToastError(t("contact.modal.phoneHint"));
        return;
      }
    }
    try {
      if (editKey === "language") {
        await onSaveField(
          "language",
          (draft === "en" ? "en" : "fr") as ProfileLanguage,
        );
      } else {
        await onSaveField(editKey, draft);
      }
      setEditKey(null);
      setDraft("");
    } catch {
      /* toast déjà émis par onSaveField */
    }
  };

  const handleResendEmailChange = async () => {
    if (!pendingEmail || emailActionPending) return;
    setEmailActionPending(true);
    setEmailActionNotice(null);
    const result = await resendPendingEmailChange(pendingEmail);
    setEmailActionPending(false);
    if (!result.ok) {
      setEmailActionIsError(true);
      setEmailActionNotice(result.message);
      return;
    }
    setEmailActionIsError(false);
    setEmailActionNotice(
      t("compte.emailResendSuccess", { email: pendingEmail }),
    );
  };

  const handleCancelEmailChange = async () => {
    if (!pendingEmail || emailActionPending) return;
    setEmailActionPending(true);
    setEmailActionNotice(null);
    const result = await cancelPendingEmailChange(form.email.trim());
    setEmailActionPending(false);
    if (!result.ok) {
      setEmailActionIsError(true);
      setEmailActionNotice(result.message);
      return;
    }
    setPendingEmailOverride(null);
    setEmailActionNotice(null);
  };

  return (
    <div className={parametresFieldStackCls}>
      {loading ? (
        <p className="py-4 text-sm font-normal text-muted-foreground">
          <LoadingLabel>{t("parametres.loading")}</LoadingLabel>
        </p>
      ) : null}
      <ParametresDisplayRow
        label={t("compte.firstName")}
        leading={
          <User
            className={cn(valueIconCls, "text-sky-600")}
            strokeWidth={2.25}
            aria-hidden
          />
        }
        display={form.firstName.trim() || "—"}
        editing={editKey === "firstName"}
        draft={draft}
        onDraftChange={setDraft}
        maxLength={PERSON_NAME_MAX_LENGTH}
        disabled={saving || loading}
        saving={saving}
        autoComplete="given-name"
        onEdit={() => openEdit("firstName")}
        onSubmit={() => void handleSaveEdit()}
        onCancel={closeEdit}
      />
      <ParametresDisplayRow
        label={t("compte.lastName")}
        leading={
          <UserRound
            className={cn(valueIconCls, "text-violet-600")}
            strokeWidth={2.25}
            aria-hidden
          />
        }
        display={form.lastName.trim() || "—"}
        editing={editKey === "lastName"}
        draft={draft}
        onDraftChange={setDraft}
        maxLength={PERSON_NAME_MAX_LENGTH}
        disabled={saving || loading}
        saving={saving}
        autoComplete="family-name"
        onEdit={() => openEdit("lastName")}
        onSubmit={() => void handleSaveEdit()}
        onCancel={closeEdit}
      />
      <ParametresDisplayRow
        label={t("compte.email")}
        leading={
          <Mail
            className={cn(valueIconCls, "text-amber-600")}
            strokeWidth={2.25}
            aria-hidden
          />
        }
        display={form.email.trim() || "—"}
        disabled={saving || loading}
        onEdit={() => {
          if (saving || loading) return;
          setEmailModalOpen(true);
        }}
      />
      <ParametresDisplayRow
        label={t("compte.password")}
        leading={
          <KeyRound
            className={cn(valueIconCls, "text-rose-600")}
            strokeWidth={2.25}
            aria-hidden
          />
        }
        display={t("compte.passwordMasked")}
        disabled={saving || loading}
        onEdit={() => {
          if (saving || loading) return;
          setPasswordModalOpen(true);
        }}
      />
      <ParametresDisplayRow
        label={t("compte.phone")}
        leading={
          <Phone
            className={cn(valueIconCls, "text-emerald-600")}
            strokeWidth={2.25}
            aria-hidden
          />
        }
        display={form.phone.trim() || "—"}
        editing={editKey === "phone"}
        draft={draft}
        onDraftChange={setDraft}
        maxLength={PHONE_DISPLAY_MAX_LENGTH}
        disabled={saving || loading}
        saving={saving}
        inputId="compte-edit-phone"
        phoneMode
        onPhoneChange={handlePhoneChange}
        onEdit={() => openEdit("phone")}
        onSubmit={() => void handleSaveEdit()}
        onCancel={closeEdit}
      />
      <ParametresDisplayRow
        label={t("compte.language")}
        leading={<LanguageFlag lang={form.language} />}
        display={languageLabel(form.language)}
        editing={editKey === "language"}
        draft={draft}
        onDraftChange={setDraft}
        disabled={saving || loading}
        saving={saving}
        languageMode
        languageOptions={[
          { id: "fr", label: t("compte.lang.fr") },
          { id: "en", label: t("compte.lang.en") },
        ]}
        onEdit={() => openEdit("language")}
        onSubmit={() => void handleSaveEdit()}
        onCancel={closeEdit}
      />
      {pendingEmail ? (
        <ConfirmInfoCard
          icon={Info}
          iconClassName={confirmCardBlueIconCls}
          className={cn("mt-3", confirmCardBlueCls)}
          title={t("compte.emailPendingTitle")}
        >
          <p>{t("compte.emailPendingHint", { email: pendingEmail })}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={emailActionPending || saving || loading}
              className="h-8 cursor-pointer bg-card/80"
              onClick={() => void handleResendEmailChange()}
            >
              {emailActionPending
                ? t("compte.emailResending")
                : t("compte.emailResend")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={emailActionPending || saving || loading}
              className="h-8 cursor-pointer"
              onClick={() => void handleCancelEmailChange()}
            >
              {t("compte.emailCancelChange")}
            </Button>
          </div>
          {emailActionNotice ? (
            <p
              className={cn(
                "mt-2 text-xs leading-snug",
                emailActionIsError ? "text-destructive" : "text-foreground",
              )}
            >
              {emailActionNotice}
            </p>
          ) : null}
        </ConfirmInfoCard>
      ) : null}
      <ChangeEmailModal
        open={emailModalOpen}
        currentEmail={form.email.trim()}
        onClose={() => setEmailModalOpen(false)}
        onRequested={(next) => setPendingEmailOverride(next)}
      />
      <ChangePasswordModal
        open={passwordModalOpen}
        email={form.email.trim()}
        onClose={() => setPasswordModalOpen(false)}
      />
    </div>
  );
}
