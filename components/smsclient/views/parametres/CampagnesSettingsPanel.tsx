"use client";

import { parametresDirtyInp } from "@/components/smsclient/views/parametres/parametresSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { SMS_SENDER_MAX_LENGTH } from "@/lib/forms/fieldLimits";
import { useI18n } from "@/lib/i18n";
import { sanitizeSender } from "@/lib/proto/smsUtils";
import type { UserProfileForm } from "@/lib/types/profile";
import { MessageSquare } from "lucide-react";

export const CAMPAGNES_SUBSECTION_FIELDS = {
  "expediteur-sms": ["sender"],
} as const satisfies Record<string, readonly (keyof UserProfileForm)[]>;

export type CampagnesSectionId = keyof typeof CAMPAGNES_SUBSECTION_FIELDS;

const invalidInputCls =
  "focus-visible:outline-none focus-visible:ring-0 aria-invalid:ring-0";

type CampagnesSettingsPanelProps = {
  form: UserProfileForm;
  saving?: boolean;
  changed: (key: keyof UserProfileForm) => boolean;
  onFieldChange: <K extends keyof UserProfileForm>(
    key: K,
    value: UserProfileForm[K],
  ) => void;
  onSaveSubsection: (sectionId: CampagnesSectionId) => void | Promise<void>;
};

export function CampagnesSettingsPanel({
  form,
  saving = false,
  changed,
  onFieldChange,
  onSaveSubsection,
}: CampagnesSettingsPanelProps) {
  const { t } = useI18n();
  const dirty = changed("sender");
  const senderLength = sanitizeSender(form.sender).length;

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

      <div className="flex min-w-0 items-end gap-2">
        <div className="flex w-40 min-w-0 flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">
            {senderLength}/{SMS_SENDER_MAX_LENGTH}
          </p>
          <Input
            id="param-sender"
            autoComplete="off"
            aria-label={t("parametres.field.sender")}
            className={cn(
              "w-full",
              invalidInputCls,
              changed("sender") && parametresDirtyInp,
            )}
            maxLength={SMS_SENDER_MAX_LENGTH}
            value={form.sender}
            onChange={(e) => onFieldChange("sender", e.target.value)}
            placeholder="Ex. BOULANGERIE"
          />
        </div>
        <Button
          type="button"
          size="sm"
          className="shrink-0"
          disabled={saving || !dirty}
          onClick={() => void onSaveSubsection("expediteur-sms")}
        >
          {saving ? t("dialog.saving") : t("dialog.save")}
        </Button>
      </div>
    </section>
  );
}
