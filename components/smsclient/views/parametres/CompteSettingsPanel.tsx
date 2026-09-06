"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingLabel } from "@/components/ui/loading-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  cancelPendingEmailChange,
  resendPendingEmailChange,
} from "@/lib/supabase/changeEmail";
import { createClient } from "@/lib/supabase/client";
import {
  Info,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  User,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useState, type ChangeEvent, type ReactNode } from "react";

const rowCls =
  "grid min-h-[3.25rem] grid-cols-[7rem_minmax(0,1fr)] items-center gap-3 border-b border-border py-2 last:border-b-0 max-[480px]:grid-cols-[5.5rem_minmax(0,1fr)]";
const labelCls = "text-sm font-medium text-muted-foreground";
const valueClusterCls =
  "flex min-w-0 w-full items-center gap-1.5";
const valueTextCls =
  "min-w-0 flex-1 truncate text-left text-sm font-normal text-foreground";
const valueIconCls = "h-4 w-4 shrink-0";
const fieldHintCls = "text-xs font-normal leading-snug text-muted-foreground";
const phoneInputCls =
  "focus-visible:outline-none focus-visible:ring-0 aria-invalid:ring-0";

type EditableKey = "firstName" | "lastName" | "phone" | "language";

type CompteSettingsPanelProps = {
  form: UserProfileForm;
  loading?: boolean;
  saving?: boolean;
  saveError?: string | null;
  onSaveField: <K extends keyof UserProfileForm>(
    key: K,
    value: UserProfileForm[K],
  ) => void | Promise<void>;
};

/** Drapeaux SVG — pas d’emoji (Windows / certains navigateurs). */
function LanguageFlag({
  lang,
  className,
}: {
  lang: ProfileLanguage | string;
  className?: string;
}) {
  const isEn = lang === "en";
  return (
    <span
      className={cn(
        "inline-flex h-4 w-[1.35rem] shrink-0 overflow-hidden rounded-[2px]",
        className,
      )}
      aria-hidden
    >
      {isEn ? (
        <svg viewBox="0 0 60 40" className="h-full w-full" focusable="false">
          <rect width="60" height="40" fill="#012169" />
          <path d="M0 0 L60 40 M60 0 L0 40" stroke="#fff" strokeWidth="8" />
          <path d="M0 0 L60 40 M60 0 L0 40" stroke="#C8102E" strokeWidth="5" />
          <path d="M30 0 V40 M0 20 H60" stroke="#fff" strokeWidth="14" />
          <path d="M30 0 V40 M0 20 H60" stroke="#C8102E" strokeWidth="8" />
        </svg>
      ) : (
        <svg viewBox="0 0 60 40" className="h-full w-full" focusable="false">
          <rect width="20" height="40" fill="#002395" />
          <rect x="20" width="20" height="40" fill="#fff" />
          <rect x="40" width="20" height="40" fill="#ED2939" />
        </svg>
      )}
    </span>
  );
}

export function CompteSettingsPanel({
  form,
  loading = false,
  saving = false,
  saveError = null,
  onSaveField,
}: CompteSettingsPanelProps) {
  const { t } = useI18n();
  const [editKey, setEditKey] = useState<EditableKey | null>(null);
  const [draft, setDraft] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [emailActionPending, setEmailActionPending] = useState(false);
  const [emailActionNotice, setEmailActionNotice] = useState<string | null>(
    null,
  );
  const [emailActionIsError, setEmailActionIsError] = useState(false);
  const [phoneFieldError, setPhoneFieldError] = useState<string | null>(null);
  const [phoneBlurred, setPhoneBlurred] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!cancelled) {
          setPendingEmail(data.user?.new_email ?? null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const languageLabel = (lang: ProfileLanguage) =>
    lang === "en" ? t("compte.lang.en") : t("compte.lang.fr");

  const openEdit = (key: EditableKey) => {
    if (saving || loading) return;
    setEditKey(key);
    setDraft(form[key]);
    setFieldError(null);
    setPhoneFieldError(null);
    setPhoneBlurred(false);
  };

  const closeEdit = () => {
    if (saving) return;
    setEditKey(null);
    setDraft("");
    setFieldError(null);
    setPhoneFieldError(null);
    setPhoneBlurred(false);
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
    setPhoneFieldError(null);
  }, []);

  const handleSaveEdit = async () => {
    if (!editKey) return;
    if (editKey === "firstName" && !draft.trim()) {
      setFieldError(t("parametres.firstNameRequired"));
      return;
    }
    if (editKey === "phone") {
      const digits = draft.replace(/\D/g, "");
      if (digits.length > 0 && !isValidFrMobile(draft)) {
        setPhoneFieldError(t("contact.modal.phoneHint"));
        return;
      }
    }
    setFieldError(null);
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
    } catch (e) {
      setFieldError(
        e instanceof Error ? e.message : t("parametres.saveFailed"),
      );
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
    setPendingEmail(null);
    setEmailActionNotice(null);
  };

  return (
    <div className="w-full max-w-md">
      {loading ? (
        <p className="py-4 text-sm font-normal text-muted-foreground">
          <LoadingLabel>{t("parametres.loading")}</LoadingLabel>
        </p>
      ) : null}
      {saveError ? (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      ) : null}
      {fieldError ? (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>{fieldError}</AlertDescription>
        </Alert>
      ) : null}

      <CompteDisplayRow
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
      <CompteDisplayRow
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
      <CompteDisplayRow
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
      <CompteDisplayRow
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
      <CompteDisplayRow
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
        phoneMode
        phoneError={phoneFieldError}
        phoneInvalid={
          Boolean(phoneFieldError) ||
          (phoneBlurred &&
            draft.replace(/\D/g, "").length > 0 &&
            !isValidFrMobile(draft))
        }
        onPhoneChange={handlePhoneChange}
        onPhoneBlur={() => setPhoneBlurred(true)}
        onEdit={() => openEdit("phone")}
        onSubmit={() => void handleSaveEdit()}
        onCancel={closeEdit}
      />
      <CompteDisplayRow
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
        onRequested={(next) => setPendingEmail(next)}
      />
      <ChangePasswordModal
        open={passwordModalOpen}
        email={form.email.trim()}
        onClose={() => setPasswordModalOpen(false)}
      />
    </div>
  );
}

function CompteDisplayRow({
  label,
  leading,
  display = "",
  editing = false,
  draft = "",
  onDraftChange,
  maxLength,
  disabled = false,
  saving = false,
  autoComplete,
  languageMode = false,
  languageOptions,
  phoneMode = false,
  phoneError = null,
  phoneInvalid = false,
  onPhoneChange,
  onPhoneBlur,
  onEdit,
  onSubmit,
  onCancel,
}: {
  label: string;
  leading: ReactNode;
  display?: string;
  editing?: boolean;
  draft?: string;
  onDraftChange?: (v: string) => void;
  maxLength?: number;
  disabled?: boolean;
  saving?: boolean;
  autoComplete?: string;
  languageMode?: boolean;
  languageOptions?: { id: "fr" | "en"; label: string }[];
  phoneMode?: boolean;
  phoneError?: string | null;
  phoneInvalid?: boolean;
  onPhoneChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onPhoneBlur?: () => void;
  onEdit?: () => void;
  onSubmit?: () => void;
  onCancel?: () => void;
}) {
  const { t } = useI18n();
  const draftLang = draft === "en" ? "en" : "fr";
  const phoneHint =
    phoneError ??
    (phoneInvalid ? t("contact.modal.phoneHint") : null);
  return (
    <div className={rowCls}>
      <span className={labelCls}>{label}</span>
      <div
        className={cn(
          valueClusterCls,
          editing && (languageMode || phoneMode) && "items-start pt-0.5",
        )}
      >
        {editing && (languageMode || phoneMode) ? null : leading}
        {editing ? (
          languageMode && languageOptions ? (
            <Select
              value={draftLang}
              disabled={saving}
              onValueChange={(value) => onDraftChange?.(value)}
            >
              <SelectTrigger className="h-9 min-w-0 flex-1 cursor-pointer text-sm font-normal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {languageOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id} textValue={opt.label}>
                    <span className="flex items-center gap-1.5">
                      <LanguageFlag lang={opt.id} />
                      <span>{opt.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : phoneMode ? (
            <div className="min-w-0 flex-1 space-y-1">
              <div className="relative">
                <Phone
                  className={cn(
                    "pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-emerald-600",
                    phoneInvalid && "text-destructive",
                  )}
                  strokeWidth={2.25}
                  aria-hidden
                />
                <Input
                  id="compte-edit-phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  enterKeyHint="done"
                  placeholder="Ex. 06 12 34 56 78"
                  className={cn(phoneInputCls, "h-9 pl-8 text-sm")}
                  value={draft}
                  maxLength={maxLength}
                  disabled={saving}
                  autoFocus
                  aria-invalid={phoneInvalid}
                  aria-describedby={
                    phoneHint ? "compte-edit-phone-err" : undefined
                  }
                  onChange={onPhoneChange}
                  onBlur={onPhoneBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onSubmit?.();
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      onCancel?.();
                    }
                  }}
                />
              </div>
              {phoneHint ? (
                <p
                  id="compte-edit-phone-err"
                  className={cn(fieldHintCls, "text-destructive")}
                >
                  {phoneHint}
                </p>
              ) : null}
            </div>
          ) : (
            <Input
              className="h-9 min-w-0 flex-1 text-sm"
              value={draft}
              maxLength={maxLength}
              disabled={saving}
              autoFocus
              autoComplete={autoComplete}
              onChange={(e) => onDraftChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSubmit?.();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  onCancel?.();
                }
              }}
            />
          )
        ) : (
          <span className={valueTextCls}>{display}</span>
        )}
        {onEdit ? (
          editing ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                size="sm"
                disabled={disabled || saving}
                onClick={onSubmit}
              >
                {t("common.ok")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={disabled || saving}
                onClick={onCancel}
              >
                {t("common.cancel")}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              aria-label={t("compte.edit")}
              onClick={onEdit}
            >
              <Pencil aria-hidden />
            </Button>
          )
        ) : null}
      </div>
    </div>
  );
}
