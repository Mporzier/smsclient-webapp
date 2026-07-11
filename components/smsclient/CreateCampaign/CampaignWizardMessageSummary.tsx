"use client";

import { cn } from "@/lib/cn";
import { formatInt, formatSmsPartsPerContact } from "@/lib/proto/smsUtils";
import { fieldBox } from "@/components/smsclient/flowFieldStyles";

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-2.5 py-2",
        highlight
          ? "border-[#2f6fed]/30 bg-[#eef4ff]"
          : "border-slate-200 bg-slate-50",
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span
          className={cn(
            "text-[11px] font-extrabold",
            highlight ? "text-[#1f3b77]" : "text-slate-600",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "text-sm font-black tabular-nums",
            highlight ? "text-[#1f3b77]" : "text-slate-900",
          )}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

export function CampaignWizardMessageSummary({
  destinatairesLabel,
  parts,
  partsMin,
  partsMax,
  totalCredits,
  creditsAvailable,
  hasEnoughCredits,
  indicative = false,
}: {
  destinatairesLabel: string;
  parts: number;
  partsMin?: number;
  partsMax?: number;
  totalCredits: number;
  creditsAvailable: number;
  hasEnoughCredits: boolean;
  indicative?: boolean;
}) {
  const creditsLabel = `${formatInt(totalCredits)} crédit${
    totalCredits !== 1 ? "s" : ""
  }${indicative ? " (indicatif)" : ""}`;

  const smsPerContactLabel = formatSmsPartsPerContact(parts, partsMin, partsMax);

  return (
    <aside className={cn(fieldBox, "flex shrink-0 flex-col gap-1.5 py-2")}>
      <h3 className="m-0 shrink-0 text-xs font-black text-slate-900">Résumé</h3>

      <SummaryRow label="Destinataires" value={destinatairesLabel} />

      <SummaryRow label="SMS par contact" value={smsPerContactLabel} />

      <SummaryRow
        label={indicative ? "Coût estimé" : "Coût total"}
        value={creditsLabel}
        highlight
      />

      <SummaryRow
        label="Solde disponible"
        value={`${formatInt(creditsAvailable)} crédit${
          creditsAvailable !== 1 ? "s" : ""
        }`}
      />

      {!hasEnoughCredits && totalCredits > 0 && (
        <p className="m-0 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[10px] font-extrabold leading-snug text-rose-800">
          Crédits insuffisants pour cette campagne.
        </p>
      )}
    </aside>
  );
}
