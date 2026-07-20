"use client";

import { ParametresSettingModal } from "@/components/smsclient/modals/ParametresSettingModal";
import { Button } from "@/components/ui/button";
import { parametresFieldInp } from "@/components/smsclient/views/parametres/parametresSettings";
import { cn } from "@/lib/cn";
import { contactInitials } from "@/lib/proto/contactDisplay";
import type { ProfileLanguage, UserProfileForm } from "@/lib/types/profile";
import { useI18n } from "@/lib/i18n";
import {
  Mail,
  Phone,
  User,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

const rowCls =
  "grid min-h-[3.25rem] grid-cols-[7rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-2 last:border-b-0 max-[480px]:grid-cols-[5.5rem_minmax(0,1fr)_auto]";
const labelCls = "text-sm font-extrabold text-foreground";
/** Colonne milieu centrée ; contenu aligné à gauche dedans */
const valueColCls = "flex min-w-0 justify-center";
const valueCls =
  "flex min-h-11 w-full max-w-[18rem] items-center gap-2.5 text-left text-sm font-bold text-foreground";
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

const FIELD_META: Record<
  EditableKey,
  {
    titleKey:
      | "compte.firstNameEditTitle"
      | "compte.lastNameEditTitle"
      | "compte.phoneEditTitle"
      | "compte.languageEditTitle";
    descKey:
      | "compte.firstNameEditDesc"
      | "compte.lastNameEditDesc"
      | "compte.phoneEditDesc"
      | "compte.languageEditDesc";
    icon: LucideIcon | null;
  }
> = {
  firstName: {
    titleKey: "compte.firstNameEditTitle",
    descKey: "compte.firstNameEditDesc",
    icon: User,
  },
  lastName: {
    titleKey: "compte.lastNameEditTitle",
    descKey: "compte.lastNameEditDesc",
    icon: UserRound,
  },
  phone: {
    titleKey: "compte.phoneEditTitle",
    descKey: "compte.phoneEditDesc",
    icon: Phone,
  },
  language: {
    titleKey: "compte.languageEditTitle",
    descKey: "compte.languageEditDesc",
    icon: null,
  },
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

  const meta = editKey ? FIELD_META[editKey] : null;
  const MetaIcon = meta?.icon;
  const dirty = editKey !== null && draft !== form[editKey];

  const modalIcon =
    editKey === "language" ? (
      <LanguageFlag lang={draft || form.language} className="h-5 w-[1.7rem]" />
    ) : MetaIcon ? (
      <MetaIcon className="h-5 w-5 text-ring" strokeWidth={2.25} />
    ) : null;

  return (
    <>
      <div className="w-full rounded-xl border border-border bg-card px-4">
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

        <CompteDisplayRow
          label={t("compte.icon")}
          editLabel={t("compte.edit")}
          leading={
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ring text-sm font-black text-white"
              aria-hidden
            >
              {initials}
            </span>
          }
          display=""
          hideDisplay
        />
        <CompteDisplayRow
          label={t("compte.firstName")}
          editLabel={t("compte.edit")}
          leading={
            <User
              className={cn(valueIconCls, "text-sky-600")}
              strokeWidth={2.25}
              aria-hidden
            />
          }
          display={form.firstName.trim() || "—"}
          disabled={saving || loading}
          onEdit={() => openEdit("firstName")}
        />
        <CompteDisplayRow
          label={t("compte.lastName")}
          editLabel={t("compte.edit")}
          leading={
            <UserRound
              className={cn(valueIconCls, "text-violet-600")}
              strokeWidth={2.25}
              aria-hidden
            />
          }
          display={form.lastName.trim() || "—"}
          disabled={saving || loading}
          onEdit={() => openEdit("lastName")}
        />
        <CompteDisplayRow
          label={t("compte.email")}
          editLabel={t("compte.edit")}
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
          editLabel={t("compte.edit")}
          leading={
            <Phone
              className={cn(valueIconCls, "text-emerald-600")}
              strokeWidth={2.25}
              aria-hidden
            />
          }
          display={form.phone.trim() || "—"}
          disabled={saving || loading}
          onEdit={() => openEdit("phone")}
        />
        <CompteDisplayRow
          label={t("compte.language")}
          editLabel={t("compte.edit")}
          leading={<LanguageFlag lang={form.language} />}
          display={languageLabel(form.language)}
          disabled={saving || loading}
          onEdit={() => openEdit("language")}
        />
      </div>

      {editKey && meta && modalIcon ? (
        <ParametresSettingModal
          open
          title={t(meta.titleKey)}
          description={t(meta.descKey)}
          icon={modalIcon}
          bareIcon={editKey === "language"}
          onClose={closeEdit}
          onSave={() => void handleSaveEdit()}
          saving={saving}
          dirty={dirty || Boolean(fieldError)}
        >
          {fieldError ? (
            <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
              {fieldError}
            </p>
          ) : null}
          {editKey === "language" ? (
            <div className="grid gap-2">
              {(
                [
                  { id: "fr" as const, label: t("compte.lang.fr") },
                  { id: "en" as const, label: t("compte.lang.en") },
                ]
              ).map((opt) => {
                const selected = draft === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDraft(opt.id)}
                    className={cn(
                      "flex h-11 w-full cursor-pointer items-center gap-3 rounded-[14px] border px-3.5 text-left text-[15px] font-bold transition-colors",
                      selected
                        ? "border-ring bg-ring/10 text-foreground"
                        : "border-border bg-card text-foreground hover:bg-muted/50",
                    )}
                  >
                    <LanguageFlag lang={opt.id} className="pointer-events-none" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <input
              className={cn(parametresFieldInp, "h-11 w-full")}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (fieldError) setFieldError(null);
              }}
              autoFocus
              autoComplete={
                editKey === "firstName"
                  ? "given-name"
                  : editKey === "lastName"
                    ? "family-name"
                    : "tel"
              }
            />
          )}
        </ParametresSettingModal>
      ) : null}
    </>
  );
}

function CompteDisplayRow({
  label,
  editLabel,
  leading,
  display,
  hideDisplay = false,
  disabled = false,
  onEdit,
}: {
  label: string;
  editLabel: string;
  leading: ReactNode;
  display: string;
  hideDisplay?: boolean;
  disabled?: boolean;
  onEdit?: () => void;
}) {
  const editControl = onEdit ? (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={onEdit}
    >
      {editLabel}
    </Button>
  ) : (
    <span className="invisible pointer-events-none select-none" aria-hidden>
      <Button type="button" variant="outline" size="sm" tabIndex={-1}>
        {editLabel}
      </Button>
    </span>
  );

  return (
    <div className={rowCls}>
      <span className={labelCls}>{label}</span>
      <div className={valueColCls}>
        <div className={valueCls}>
          {leading}
          {hideDisplay ? null : (
            <span className="truncate">{display}</span>
          )}
        </div>
      </div>
      {editControl}
    </div>
  );
}
