"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parametresFieldInp } from "@/components/smsclient/views/parametres/parametresSettings";
import { cn } from "@/lib/cn";
import {
  PERSON_NAME_MAX_LENGTH,
  PHONE_DISPLAY_MAX_LENGTH,
} from "@/lib/forms/fieldLimits";
import { contactInitials } from "@/lib/proto/contactDisplay";
import type { ProfileLanguage, UserProfileForm } from "@/lib/types/profile";
import { useI18n } from "@/lib/i18n";
import {
  Check,
  Mail,
  Pencil,
  Phone,
  User,
  UserRound,
} from "lucide-react";
import { useState, type ReactNode } from "react";

const rowCls =
  "grid min-h-[3.25rem] grid-cols-[7rem_minmax(0,1fr)] items-center gap-3 border-b border-border py-2 last:border-b-0 max-[480px]:grid-cols-[5.5rem_minmax(0,1fr)]";
const labelCls = "text-sm font-extrabold text-foreground";
const valueClusterCls =
  "flex min-w-0 w-full items-center gap-1.5";
const valueTextCls =
  "min-w-0 flex-1 truncate text-left text-sm font-bold text-foreground";
const valueIconCls = "h-4 w-4 shrink-0";

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

  const initials = contactInitials({
    firstName: form.firstName,
    lastName: form.lastName,
  });

  const languageLabel = (lang: ProfileLanguage) =>
    lang === "en" ? t("compte.lang.en") : t("compte.lang.fr");

  const openEdit = (key: EditableKey) => {
    if (saving || loading) return;
    setEditKey(key);
    setDraft(form[key]);
    setFieldError(null);
  };

  const closeEdit = () => {
    if (saving) return;
    setEditKey(null);
    setDraft("");
    setFieldError(null);
  };

  const handleSaveEdit = async () => {
    if (!editKey) return;
    if (editKey === "firstName" && !draft.trim()) {
      setFieldError(t("parametres.firstNameRequired"));
      return;
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

  return (
    <div className="w-full max-w-[50%] min-w-[18rem] rounded-xl border border-border bg-card px-4">
      {loading ? (
        <p className="py-4 text-sm font-semibold text-muted-foreground">
          {t("parametres.loading")}
        </p>
      ) : null}
      {saveError ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
          {saveError}
        </p>
      ) : null}
      {fieldError ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
          {fieldError}
        </p>
      ) : null}

      <CompteDisplayRow
        label={t("compte.icon")}
        leading={
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ring text-sm font-black text-white"
            aria-hidden
          >
            {initials}
          </span>
        }
        hideDisplay
      />
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
        editAria={t("compte.edit")}
        saveAria={t("dialog.save")}
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
        editAria={t("compte.edit")}
        saveAria={t("dialog.save")}
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
        autoComplete="tel"
        onEdit={() => openEdit("phone")}
        onSubmit={() => void handleSaveEdit()}
        onCancel={closeEdit}
        editAria={t("compte.edit")}
        saveAria={t("dialog.save")}
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
        editAria={t("compte.edit")}
        saveAria={t("dialog.save")}
      />
    </div>
  );
}

function CompteDisplayRow({
  label,
  leading,
  display = "",
  hideDisplay = false,
  editing = false,
  draft = "",
  onDraftChange,
  maxLength,
  disabled = false,
  saving = false,
  autoComplete,
  languageMode = false,
  languageOptions,
  onEdit,
  onSubmit,
  onCancel,
  editAria,
  saveAria,
}: {
  label: string;
  leading: ReactNode;
  display?: string;
  hideDisplay?: boolean;
  editing?: boolean;
  draft?: string;
  onDraftChange?: (v: string) => void;
  maxLength?: number;
  disabled?: boolean;
  saving?: boolean;
  autoComplete?: string;
  languageMode?: boolean;
  languageOptions?: { id: "fr" | "en"; label: string }[];
  onEdit?: () => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  editAria?: string;
  saveAria?: string;
}) {
  return (
    <div className={rowCls}>
      <span className={labelCls}>{label}</span>
      <div className={valueClusterCls}>
        {leading}
        {hideDisplay ? null : editing ? (
          languageMode && languageOptions ? (
            <div className="flex min-w-0 flex-1 gap-1">
              {languageOptions.map((opt) => {
                const selected = draft === opt.id;
                return (
                  <Button
                    key={opt.id}
                    type="button"
                    size="sm"
                    variant={selected ? "secondary" : "outline"}
                    disabled={saving}
                    className="h-9 min-w-0 flex-1 gap-1.5 px-2"
                    onClick={() => onDraftChange?.(opt.id)}
                  >
                    <LanguageFlag lang={opt.id} />
                    <span className="truncate">{opt.label}</span>
                  </Button>
                );
              })}
            </div>
          ) : (
            <Input
              className={cn(parametresFieldInp, "h-9 min-w-0 flex-1 text-sm")}
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
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled || saving}
              aria-label={saveAria}
              onClick={onSubmit}
            >
              <Check aria-hidden />
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              aria-label={editAria}
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
