"use client";

import {
  parametresRowCls,
  parametresRowHintCls,
  parametresRowInputCls,
  parametresRowLabelCls,
  parametresRowValueCls,
  parametresDirtyInp,
} from "@/components/smsclient/views/parametres/parametresSettings";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function parametresControlCls(dirty?: boolean) {
  return cn(parametresRowInputCls, dirty && parametresDirtyInp);
}

type ParametresInputRowProps = {
  id?: string;
  label: string;
  hint?: string | null;
  leading?: ReactNode;
  alignTop?: boolean;
  children: ReactNode;
};

/** Ligne label | contrôle — même grille que `CompteSettingsPanel`. */
export function ParametresInputRow({
  id,
  label,
  hint,
  leading,
  alignTop = false,
  children,
}: ParametresInputRowProps) {
  const labelEl = id ? (
    <label htmlFor={id} className={parametresRowLabelCls}>
      {label}
    </label>
  ) : (
    <span className={parametresRowLabelCls}>{label}</span>
  );

  return (
    <div className={parametresRowCls}>
      {labelEl}
      <div
        className={cn(
          parametresRowValueCls,
          (alignTop || hint) && "items-start pt-0.5",
        )}
      >
        {leading}
        <div className="min-w-0 flex-1 space-y-1">
          {children}
          {hint ? <p className={parametresRowHintCls}>{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}
