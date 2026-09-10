"use client";

import { parametresDirtyInp } from "@/components/smsclient/views/parametres/parametresSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { BILLING_CONTACT_MAX_LENGTH, EMAIL_MAX_LENGTH } from "@/lib/forms/fieldLimits";
import {
  entrepriseFieldErrorKey,
  firstEntrepriseSubsectionErrorKey,
} from "@/lib/forms/entrepriseValidation";
import { useI18n } from "@/lib/i18n";
import type { UserProfileForm } from "@/lib/types/profile";
import { FileText } from "lucide-react";
import { useState } from "react";

export const FACTURATION_SUBSECTION_FIELDS = {
  "contact-facturation": ["billingContact"],
} as const satisfies Record<string, readonly (keyof UserProfileForm)[]>;

export type FacturationSectionId = keyof typeof FACTURATION_SUBSECTION_FIELDS;

const invalidInputCls =
  "focus-visible:outline-none focus-visible:ring-0 aria-invalid:ring-0";

type FacturationSettingsPanelProps = {
  form: UserProfileForm;
  saving?: boolean;
  changed: (key: keyof UserProfileForm) => boolean;
  onFieldChange: <K extends keyof UserProfileForm>(
    key: K,
    value: UserProfileForm[K],
  ) => void;
  onSaveSubsection: (sectionId: FacturationSectionId) => void | Promise<void>;
};

export function FacturationSettingsPanel({
  form,
  saving = false,
  changed,
  onFieldChange,
  onSaveSubsection,
}: FacturationSettingsPanelProps) {
  const { t } = useI18n();
  const [touched, setTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const dirty = changed("billingContact");
  const billingContactError =
    touched || submitAttempted
      ? entrepriseFieldErrorKey("billingContact", {
          ...form,
          billingContact: form.billingContact.trim(),
        })
      : null;

  const handleSave = () => {
    setSubmitAttempted(true);
    setTouched(true);
    const trimmedContact = form.billingContact.trim();
    const formForValidation = { ...form, billingContact: trimmedContact };
    const errorKey = firstEntrepriseSubsectionErrorKey(
      FACTURATION_SUBSECTION_FIELDS["contact-facturation"],
      formForValidation,
    );
    if (errorKey) return;
    if (trimmedContact !== form.billingContact) {
      onFieldChange("billingContact", trimmedContact);
    }
    void onSaveSubsection("contact-facturation");
  };

  return (
    <section className="grid gap-3 border-b border-border pb-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <div className="flex items-start gap-2.5">
        <FileText
          className="mt-0.5 size-4 shrink-0 text-ring"
          strokeWidth={2.25}
          aria-hidden
        />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            {t("parametres.card.contact-facturation.title")}
          </h3>
          <p className="mt-1 text-xs font-medium leading-snug text-muted-foreground">
            {t("parametres.card.contact-facturation.description")}
          </p>
        </div>
      </div>

      <div className="grid min-w-0 gap-1.5">
        <div className="flex min-w-0 items-start gap-2">
          <Input
            id="param-billing-contact"
            type="text"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            aria-label={t("parametres.card.contact-facturation.description")}
            className={cn(
              "min-w-0 flex-1",
              invalidInputCls,
              changed("billingContact") && parametresDirtyInp,
            )}
            maxLength={Math.min(BILLING_CONTACT_MAX_LENGTH, EMAIL_MAX_LENGTH)}
            aria-invalid={Boolean(billingContactError)}
            value={form.billingContact}
            onBlur={() => {
              setTouched(true);
              const trimmed = form.billingContact.trim();
              if (trimmed !== form.billingContact) {
                onFieldChange("billingContact", trimmed);
              }
            }}
            onChange={(e) => onFieldChange("billingContact", e.target.value)}
            placeholder={t("parametres.field.billingContactPlaceholder")}
          />
          <Button
            type="button"
            size="sm"
            className="shrink-0"
            disabled={saving || !dirty}
            onClick={handleSave}
          >
            {saving ? t("dialog.saving") : t("dialog.save")}
          </Button>
        </div>
        {billingContactError ? (
          <p className="m-0 text-xs font-medium text-destructive">
            {t(billingContactError)}
          </p>
        ) : null}
      </div>
    </section>
  );
}
