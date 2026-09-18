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
import { SMS_SENDER_MAX_LENGTH } from "@/lib/forms/fieldLimits";
import { useI18n } from "@/lib/i18n";
import { sanitizeSender } from "@/lib/proto/smsUtils";
import type { UserProfileForm } from "@/lib/types/profile";
import { MessageSquare } from "lucide-react";
import { useState } from "react";

export const CAMPAGNES_SUBSECTION_FIELDS = {
  "expediteur-sms": ["sender"],
} as const satisfies Record<string, readonly (keyof UserProfileForm)[]>;

export type CampagnesSectionId = keyof typeof CAMPAGNES_SUBSECTION_FIELDS;

type CampagnesSettingsPanelProps = {
  form: UserProfileForm;
  saving?: boolean;
  onSaveSender: (sender: string) => Promise<void>;
};

export function CampagnesSettingsPanel({
  form,
  saving = false,
  onSaveSender,
}: CampagnesSettingsPanelProps) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const openEdit = () => {
    if (saving) return;
    setDraft(form.sender);
    setEditing(true);
  };

  const closeEdit = () => {
    setEditing(false);
    setDraft("");
  };

  const handleSubmit = async () => {
    if (saving) return;
    if (!draft.trim()) {
      parametresToastError(t("parametres.senderRequired"));
      return;
    }
    try {
      await onSaveSender(draft);
      closeEdit();
    } catch {
      /* toast déjà émis par persistProfileForm */
    }
  };

  const senderLength = sanitizeSender(editing ? draft : form.sender).length;

  return (
    <section className="grid gap-3 border-b border-border pb-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <div className="flex items-start gap-2.5">
        <MessageSquare
          className="mt-0.5 size-4 shrink-0 text-ring"
          strokeWidth={2.25}
          aria-hidden
        />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            {t("parametres.card.expediteur-sms.title")}
          </h3>
          <p className="mt-1 text-xs font-medium leading-snug text-muted-foreground">
            {t("parametres.card.expediteur-sms.description")}
          </p>
        </div>
      </div>

      <div className={parametresFieldStackCls}>
        <ParametresDisplayRow
          label={t("parametres.field.sender")}
          leading={
            <MessageSquare
              className={cn(valueIconCls, "text-ring")}
              strokeWidth={2.25}
              aria-hidden
            />
          }
          display={form.sender.trim() || "—"}
          editing={editing}
          draft={draft}
          onDraftChange={setDraft}
          maxLength={SMS_SENDER_MAX_LENGTH}
          disabled={saving}
          saving={saving}
          inputId="param-sender"
          placeholder="Ex. BOULANGERIE"
          editHint={
            editing ? (
              <p className="text-xs font-medium text-muted-foreground">
                {senderLength}/{SMS_SENDER_MAX_LENGTH}
              </p>
            ) : null
          }
          onEdit={openEdit}
          onSubmit={() => void handleSubmit()}
          onCancel={closeEdit}
        />
      </div>
    </section>
  );
}
