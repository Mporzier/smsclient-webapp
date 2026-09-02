"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatInt, formatSmsPartsPerContact } from "@/lib/proto/smsUtils";

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card size="sm" className="gap-0 py-0 shadow-none">
      <CardHeader className="px-3 py-2.5">
        <CardDescription className="text-xs">{label}</CardDescription>
        <CardTitle className="text-sm font-semibold tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

export function CampaignWizardMessageSummary({
  recipients,
  parts,
  partsMin,
  partsMax,
  totalCredits,
  creditsAvailable,
  hasEnoughCredits,
  pendingSms = false,
}: {
  recipients: number;
  parts: number;
  partsMin?: number;
  partsMax?: number;
  totalCredits: number;
  creditsAvailable: number;
  hasEnoughCredits: boolean;
  pendingSms?: boolean;
}) {
  const destinatairesLabel =
    recipients === 1
      ? "1 contact valide"
      : `${formatInt(recipients)} contacts valides`;

  const smsPerContactLabel = pendingSms
    ? "En attente"
    : formatSmsPartsPerContact(parts, partsMin, partsMax);

  const creditsCostLabel = pendingSms
    ? "Calculer à l'étape suivante"
    : `${formatInt(totalCredits)} crédit${totalCredits !== 1 ? "s" : ""}`;

  const creditsAvailableLabel = `${formatInt(creditsAvailable)} crédit${
    creditsAvailable !== 1 ? "s" : ""
  }`;

  return (
    <aside className="flex shrink-0 flex-col gap-2">
      <h3 className="m-0 shrink-0 text-xs font-medium text-muted-foreground">
        Résumé
      </h3>

      <div className="flex flex-col gap-2">
        <SummaryCard label="Destinataires" value={destinatairesLabel} />
        <SummaryCard label="SMS par contact" value={smsPerContactLabel} />
        <SummaryCard label="Coût en crédits total" value={creditsCostLabel} />
        <SummaryCard label="Crédits disponibles" value={creditsAvailableLabel} />
      </div>

      {!pendingSms && !hasEnoughCredits && totalCredits > 0 && (
        <p
          className={cn(
            "m-0 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[10px] font-medium leading-snug text-rose-800"
          )}
        >
          Crédits insuffisants pour cette campagne.
        </p>
      )}
    </aside>
  );
}
