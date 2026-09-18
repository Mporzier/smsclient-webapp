"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import type { ProfileLanguage } from "@/lib/types/profile";
import {
  parametresRowCls,
  parametresRowInputCls,
  parametresRowLabelCls,
  parametresRowValueCls,
} from "@/components/smsclient/views/parametres/parametresSettings";
import { Pencil, Phone } from "lucide-react";
import type { ChangeEvent, HTMLInputTypeAttribute, ReactNode } from "react";

export const valueTextCls =
  "min-w-0 flex-1 truncate text-left text-sm font-normal text-foreground";
export const valueIconCls = "h-4 w-4 shrink-0";

export function LanguageFlag({
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

export type ParametresDisplayRowProps = {
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
  inputId?: string;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  spellCheck?: boolean;
  editHint?: ReactNode;
  languageMode?: boolean;
  languageOptions?: { id: "fr" | "en"; label: string }[];
  phoneMode?: boolean;
  onPhoneChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onEdit?: () => void;
  onSubmit?: () => void;
  onCancel?: () => void;
};

/** Ligne lecture seule + stylo + édition inline (onglet Compte et champs similaires). */
export function ParametresDisplayRow({
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
  inputId,
  placeholder,
  type = "text",
  inputMode,
  spellCheck,
  editHint = null,
  languageMode = false,
  languageOptions,
  phoneMode = false,
  onPhoneChange,
  onEdit,
  onSubmit,
  onCancel,
}: ParametresDisplayRowProps) {
  const { t } = useI18n();
  const draftLang = draft === "en" ? "en" : "fr";

  const textInput = (
    <Input
      id={inputId}
      type={type}
      inputMode={inputMode}
      spellCheck={spellCheck}
      placeholder={placeholder}
      className={parametresRowInputCls}
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
  );

  return (
    <div className={parametresRowCls}>
      <span className={parametresRowLabelCls}>{label}</span>
      <div
        className={cn(
          parametresRowValueCls,
          editing && (languageMode || phoneMode || editHint) && "items-start pt-0.5",
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
            <div className="relative min-w-0 flex-1">
              <Phone
                className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-emerald-600"
                strokeWidth={2.25}
                aria-hidden
              />
              <Input
                id={inputId ?? "compte-edit-phone"}
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                enterKeyHint="done"
                placeholder="Ex. 06 12 34 56 78"
                className={cn(parametresRowInputCls, "pl-8")}
                value={draft}
                maxLength={maxLength}
                disabled={saving}
                autoFocus
                onChange={onPhoneChange}
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
          ) : (
            <div className="min-w-0 flex-1 space-y-1">
              {textInput}
              {editHint}
            </div>
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
