"use client";

import { cn } from "@/lib/cn";
import { formatInt } from "@/lib/proto/smsUtils";
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
        "rounded-xl border px-3 py-2.5",
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
  unicode,
  totalCredits,
  creditsAvailable,
  hasEnoughCredits,
  indicative = false,
  hasPrenomTag = false,
}: {
  destinatairesLabel: string;
  parts: number;
  partsMin?: number;
  partsMax?: number;
  unicode: boolean;
  totalCredits: number;
  creditsAvailable: number;
  hasEnoughCredits: boolean;
  indicative?: boolean;
  hasPrenomTag?: boolean;
}) {
  const creditsLabel = `${formatInt(totalCredits)} crédit${
    totalCredits !== 1 ? "s" : ""
  }${indicative ? " (indicatif)" : ""}`;

  const segmentsLabel =
    !indicative &&
    hasPrenomTag &&
    partsMin != null &&
    partsMax != null &&
    partsMin !== partsMax
      ? `${partsMin}–${partsMax} · ${unicode ? "Unicode" : "GSM-7"}`
      : `${parts} · ${unicode ? "Unicode" : "GSM-7"}`;

  return (
    <aside
      className={cn(
        fieldBox,
        "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto py-3",
      )}
    >
      <h3 className="m-0 shrink-0 text-xs font-black text-slate-900">Résumé</h3>

      <SummaryRow label="Destinataires" value={destinatairesLabel} />

      <SummaryRow label="Segments SMS" value={segmentsLabel} />

      <SummaryRow
        label={indicative ? "Coût estimé" : "Coût total"}
        value={creditsLabel}
        highlight
      />

      {hasPrenomTag && indicative ? (
        <p className="m-0 text-[10px] font-semibold leading-snug text-slate-400">
          Estimation basée sur le prénom le plus long de vos destinataires.
        </p>
      ) : null}

      {hasPrenomTag && !indicative ? (
        <p className="m-0 text-[10px] font-semibold leading-snug text-slate-400">
          Coût définitif selon le prénom de chaque destinataire.
        </p>
      ) : null}

      <SummaryRow
        label="Solde disponible"
        value={`${formatInt(creditsAvailable)} crédit${
          creditsAvailable !== 1 ? "s" : ""
        }`}
      />

      {!hasEnoughCredits && totalCredits > 0 && (
        <p className="m-0 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-extrabold leading-snug text-rose-800">
          Crédits insuffisants pour cette campagne.
        </p>
      )}
    </aside>
  );
}
