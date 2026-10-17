"use client";

import { FormDialogShell } from "@/components/smsclient/modals/FormDialogShell";
import { ModalSmsMessageField } from "@/components/smsclient/modals/ModalSmsMessageField";
import { Button } from "@/components/ui/button";
import { validateAutomationSmsBody } from "@/lib/automations/messageValidation";
import {
  buildEffectiveSms,
  hasStopMention,
  stripStopMention,
} from "@/lib/proto/smsStopMention";
import { buildDefaultQrWelcomeSmsTemplate } from "@/lib/qr/welcomeSmsDefaults";
import { useI18n } from "@/lib/i18n";
import {
  buildEstimateMergeValues,
  normalizePrenomTokens,
} from "@/lib/proto/smsPersonalization";
import { useModalFormDirty } from "@/components/smsclient/modals/modalFormGuard";
import { MessageCircle, RotateCcw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

type QrWelcomeSmsSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  template: string;
  companyName?: string;
  saving: boolean;
  onSave: (template: string) => Promise<void>;
};

export function QrWelcomeSmsSettingsModal({
  open,
  onClose,
  template,
  companyName,
  saving,
  onSave,
}: QrWelcomeSmsSettingsModalProps) {
  const { t } = useI18n();
  const [localTemplate, setLocalTemplate] = useState(template);
  const [commercialMessage, setCommercialMessage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevSync, setPrevSync] = useState({ open, template });

  if (open !== prevSync.open || template !== prevSync.template) {
    setPrevSync({ open, template });
    if (open) {
      const normalized = normalizePrenomTokens(template);
      setLocalTemplate(stripStopMention(normalized));
      setCommercialMessage(hasStopMention(normalized));
      setError(null);
    }
  }

  const estimateSample = useMemo(
    () => buildEstimateMergeValues([], []),
    [],
  );

  const resetTemplate = useMemo(
    () =>
      normalizePrenomTokens(
        buildDefaultQrWelcomeSmsTemplate(companyName ?? ""),
      ),
    [companyName],
  );

  const canReset =
    !saving && normalizePrenomTokens(localTemplate) !== resetTemplate;

  const isDirty = useModalFormDirty(
    open,
    localTemplate,
    (a, b) => a === b,
  );

  const handleClose = useCallback(() => {
    if (saving) return;
    setError(null);
    onClose();
  }, [onClose, saving]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    const normalized = normalizePrenomTokens(localTemplate);
    const validationError = validateAutomationSmsBody(normalized, {
      reserveStop: commercialMessage,
      estimateSample,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    try {
      await onSave(buildEffectiveSms(normalized, commercialMessage));
      handleClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Une erreur est survenue.",
      );
    }
  }, [
    commercialMessage,
    estimateSample,
    handleClose,
    localTemplate,
    onSave,
    saving,
  ]);

  const handleReset = useCallback(() => {
    setLocalTemplate(resetTemplate);
    setError(null);
  }, [resetTemplate]);

  return (
    <FormDialogShell
      open={open}
      onClose={handleClose}
      title={t("qr.mode.welcome.title")}
      description={t("qr.modal.welcome.desc")}
      icon={<MessageCircle className="size-4" aria-hidden />}
      onSave={handleSave}
      saving={saving}
      formDirty={isDirty}
      footerLeading={
        <Button
          type="button"
          variant="outline"
          disabled={!canReset}
          className="cursor-pointer"
          onClick={handleReset}
        >
          <RotateCcw aria-hidden />
          {t("qr.modal.welcome.reset")}
        </Button>
      }
    >
      <ModalSmsMessageField
        composerMode="plainText"
        label={t("qr.modal.welcome.messageLabel")}
        value={localTemplate}
        onChange={(next) => {
          setLocalTemplate(normalizePrenomTokens(next));
          setError(null);
        }}
        placeholder={t("qr.modal.welcome.placeholder")}
        error={error}
        estimateSample={estimateSample}
        customFieldDefs={[]}
        disabled={saving}
        commercialMessage={commercialMessage}
        onCommercialMessageChange={setCommercialMessage}
      />
    </FormDialogShell>
  );
}
