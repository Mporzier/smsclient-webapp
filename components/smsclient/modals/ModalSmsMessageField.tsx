"use client";

import { SmsMessageComposer } from "@/components/smsclient/CreateCampaign/SmsMessageComposer";
import { cn } from "@/lib/cn";
import type { SmsMergeValues } from "@/lib/proto/smsPersonalization";
import type { CustomFieldDef } from "@/lib/types/customFields";
import type { LinkRowData } from "@/lib/types/link";
import type { ReactNode } from "react";
import { dialogPopoverZCls } from "./modalChrome";

/** Label champ modale formulaire (aligné création automatisation). */
export const modalFieldLabelCls = "text-xs font-semibold text-foreground";

/** Texte d’aide / erreur sous un champ modale. */
export const modalHintTextCls =
  "text-xs font-normal leading-snug text-muted-foreground";

type ModalSmsMessageFieldProps = {
  label?: ReactNode;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  errorId?: string;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  compact?: boolean;
  customFieldDefs?: readonly CustomFieldDef[];
  estimateSample?: SmsMergeValues | null;
  estimateFirstName?: string;
  reserveStop?: boolean;
  popoverClassName?: string;
  savedLinks?: LinkRowData[];
  linksLoading?: boolean;
  onCreateLink?: (args: {
    originalUrl: string;
    label: string;
  }) => Promise<{ data: LinkRowData | null; error: string | null }>;
};

/**
 * Zone « Message SMS » des modales — même markup que CreateAutomationModal.
 */
export function ModalSmsMessageField({
  label = "Message SMS",
  required = true,
  value,
  onChange,
  error,
  errorId,
  placeholder,
  disabled,
  hasError,
  compact,
  customFieldDefs,
  estimateSample,
  estimateFirstName,
  reserveStop = true,
  popoverClassName = dialogPopoverZCls,
  savedLinks,
  linksLoading,
  onCreateLink,
}: ModalSmsMessageFieldProps) {
  const showError = Boolean(error);

  return (
    <div className="space-y-1.5">
      <span className={cn(modalFieldLabelCls, "block")}>
        {label}
        {required ? (
          <>
            {" "}
            <span className="text-destructive" aria-hidden>
              *
            </span>
          </>
        ) : null}
      </span>
      <SmsMessageComposer
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        hasError={hasError ?? showError}
        disabled={disabled}
        compact={compact}
        customFieldDefs={customFieldDefs}
        estimateSample={estimateSample}
        estimateFirstName={estimateFirstName}
        reserveStop={reserveStop}
        popoverClassName={popoverClassName}
        savedLinks={savedLinks}
        linksLoading={linksLoading}
        onCreateLink={onCreateLink}
      />
      {showError ? (
        <p
          id={errorId}
          role="alert"
          className={cn(modalHintTextCls, "text-destructive")}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
