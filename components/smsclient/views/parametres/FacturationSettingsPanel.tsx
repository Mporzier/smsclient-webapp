"use client";

import {
  ParametresDisplayRow,
  valueIconCls,
} from "@/components/smsclient/views/parametres/ParametresDisplayRow";
import {
  parametresFieldStackCls,
  parametresToastError,
} from "@/components/smsclient/views/parametres/parametresSettings";
import { cn } from "@/lib/cn";
import { BILLING_CONTACT_MAX_LENGTH, EMAIL_MAX_LENGTH } from "@/lib/forms/fieldLimits";
import { entrepriseFieldErrorKey } from "@/lib/forms/entrepriseValidation";
import { useI18n } from "@/lib/i18n";
import type { UserProfileForm } from "@/lib/types/profile";
import { FileText, Mail } from "lucide-react";
import { useState } from "react";

export const FACTURATION_SUBSECTION_FIELDS = {
  "contact-facturation": ["billingContact"],
} as const satisfies Record<string, readonly (keyof UserProfileForm)[]>;

export type FacturationSectionId = keyof typeof FACTURATION_SUBSECTION_FIELDS;

type FacturationSettingsPanelProps = {
  form: UserProfileForm;
  saving?: boolean;
  onSaveBillingContact: (billingContact: string) => Promise<void>;
};

export function FacturationSettingsPanel({
  form,
  saving = false,
  onSaveBillingContact,
}: FacturationSettingsPanelProps) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const openEdit = () => {
    if (saving) return;
    setDraft(form.billingContact);
    setEditing(true);
  };

  const closeEdit = () => {
    setEditing(false);
    setDraft("");
  };

  const handleSubmit = async () => {
    if (saving) return;
    const trimmed = draft.trim();
    const errorKey = entrepriseFieldErrorKey("billingContact", {
      ...form,
      billingContact: trimmed,
    });
    if (errorKey) {
      parametresToastError(t(errorKey));
      return;
    }
    try {
      await onSaveBillingContact(trimmed);
      closeEdit();
    } catch {
      /* toast déjà émis par persistProfileForm */
    }
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

      <div className={parametresFieldStackCls}>
        <ParametresDisplayRow
          label={t("parametres.field.billingContact")}
          leading={
            <Mail
              className={cn(valueIconCls, "text-sky-600")}
              strokeWidth={2.25}
              aria-hidden
            />
          }
          display={form.billingContact.trim() || "—"}
          editing={editing}
          draft={draft}
          onDraftChange={setDraft}
          maxLength={Math.min(BILLING_CONTACT_MAX_LENGTH, EMAIL_MAX_LENGTH)}
          disabled={saving}
          saving={saving}
          inputId="param-billing-contact"
          type="text"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          placeholder={t("parametres.field.billingContactPlaceholder")}
          onEdit={openEdit}
          onSubmit={() => void handleSubmit()}
          onCancel={closeEdit}
        />
      </div>
    </section>
  );
}
