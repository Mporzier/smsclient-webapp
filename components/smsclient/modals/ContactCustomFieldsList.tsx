"use client";

import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import { isAllowedNumberFieldDraft } from "@/lib/customFields/validate";
import type {
  CustomFieldDef,
  CustomFieldValues,
} from "@/lib/types/customFields";
import {
  memo,
  useCallback,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

const modalFieldCls =
  "focus-visible:border-ring focus-visible:ring-0 aria-invalid:ring-0";
const fieldErrorCls = "text-xs font-normal leading-snug text-destructive";

type ContactCustomFieldsListProps = {
  defs: CustomFieldDef[];
  values: CustomFieldValues;
  setValues: Dispatch<SetStateAction<CustomFieldValues>>;
  errors?: Record<string, string>;
  onClearError?: (fieldId: string) => void;
  className?: string;
};

type CustomFieldRowProps = {
  def: CustomFieldDef;
  value: string;
  error?: string;
  onChange: (fieldId: string, next: string) => void;
};

const CustomFieldRow = memo(function CustomFieldRow({
  def,
  value,
  error,
  onChange,
}: CustomFieldRowProps) {
  const inputId = `contact-custom-${def.id}`;
  const errId = `${inputId}-err`;

  let control: ReactNode;
  if (def.fieldType === "number") {
    control = (
      <Input
        id={inputId}
        name={`custom_${def.id}`}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={modalFieldCls}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errId : undefined}
        onChange={(e) => {
          const next = e.target.value;
          if (!isAllowedNumberFieldDraft(next)) return;
          onChange(def.id, next);
        }}
        onKeyDown={(e) => {
          if (e.key.length === 1 && /[eE+\s]/.test(e.key)) {
            e.preventDefault();
          }
        }}
      />
    );
  } else if (def.fieldType === "date") {
    control = (
      <DatePicker
        id={inputId}
        value={value}
        onChange={(iso) => onChange(def.id, iso)}
      />
    );
  } else {
    control = (
      <Input
        id={inputId}
        name={`custom_${def.id}`}
        type="text"
        className={modalFieldCls}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errId : undefined}
        onChange={(e) => onChange(def.id, e.target.value)}
      />
    );
  }

  return (
    <li className="grid grid-cols-[minmax(7rem,0.9fr)_minmax(0,1.1fr)] items-start gap-3 px-3 py-2">
      <Label
        htmlFor={inputId}
        className="min-w-0 truncate pt-2 text-xs font-semibold text-foreground"
      >
        {def.label}
      </Label>
      <div className="min-w-0 space-y-1">
        {control}
        {error && (
          <p id={errId} className={fieldErrorCls}>
            {error}
          </p>
        )}
      </div>
    </li>
  );
});

export function ContactCustomFieldsList({
  defs,
  values,
  setValues,
  errors,
  onClearError,
  className,
}: ContactCustomFieldsListProps) {
  const onChange = useCallback(
    (fieldId: string, next: string) => {
      setValues((prev) => {
        if ((prev[fieldId] ?? "") === next) return prev;
        return { ...prev, [fieldId]: next };
      });
      onClearError?.(fieldId);
    },
    [setValues, onClearError],
  );

  if (defs.length === 0) return null;

  return (
    <div className={cn("space-y-2 border-t border-border pt-3", className)}>
      <p className="m-0 text-xs font-semibold text-foreground">
        Champs personnalisés
      </p>
      <ul
        className="m-0 list-none divide-y divide-border overflow-hidden rounded-lg border border-border p-0"
        role="list"
        aria-label="Champs personnalisés"
      >
        {defs.map((def) => (
          <CustomFieldRow
            key={def.id}
            def={def}
            value={values[def.id] ?? ""}
            error={errors?.[def.id]}
            onChange={onChange}
          />
        ))}
      </ul>
    </div>
  );
};
