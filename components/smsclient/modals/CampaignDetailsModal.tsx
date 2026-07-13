"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CampaignRowData, SmsCampaignStatus } from "@/lib/types/campaign";
import { Users, X } from "lucide-react";
import {
  brandBtnCls,
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  modalCloseBtn,
} from "./modalChrome";

const GROUP_COLORS: { bg: string; border: string; text: string }[] = [
  { bg: "bg-indigo-50", border: "border-indigo-100", text: "text-indigo-700" },
  { bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700" },
  { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-50", border: "border-rose-100", text: "text-rose-700" },
  { bg: "bg-sky-50", border: "border-sky-100", text: "text-sky-700" },
  { bg: "bg-violet-50", border: "border-violet-100", text: "text-violet-700" },
  { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-700" },
  { bg: "bg-cyan-50", border: "border-cyan-100", text: "text-cyan-700" },
  { bg: "bg-fuchsia-50", border: "border-fuchsia-100", text: "text-fuchsia-700" },
  { bg: "bg-lime-50", border: "border-lime-100", text: "text-lime-700" },
];

function groupColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length];
}

function campaignStatusLabel(status: SmsCampaignStatus): string {
  switch (status) {
    case "sent":
      return "Envoyée";
    case "scheduled":
      return "Programmée";
    case "draft":
      return "Brouillon";
    case "failed":
      return "Échec";
    case "cancelled":
      return "Annulée";
    default:
      return status;
  }
}

type CampaignDetailsModalProps = {
  open: boolean;
  campaign: CampaignRowData | null;
  onClose: () => void;
};

export function CampaignDetailsModal({
  open,
  campaign,
  onClose,
}: CampaignDetailsModalProps) {
  const hasContacts =
    campaign?.targetContacts && campaign.targetContacts.length > 0;
  const hasGroups =
    campaign?.targetGroups && campaign.targetGroups.length > 0;

  return (
    <Dialog
      open={open && !!campaign}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName={dialogOverlayCls}
        className={cn(
          formDialogContentCls,
          "h-[min(88dvh,820px)] max-h-[min(88dvh,820px)] sm:max-w-[860px]",
          dialogContentZCls
        )}
      >
        {campaign && (
          <>
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-[18px] py-4">
              <div>
                <DialogTitle className="text-lg font-black text-foreground">
                  Détails de campagne
                </DialogTitle>
                <DialogDescription className="text-xs font-bold">
                  Consultation uniquement (lecture seule)
                </DialogDescription>
              </div>
              <button
                type="button"
                className={modalCloseBtn}
                aria-label="Fermer"
                onClick={onClose}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden bg-muted/50 p-[18px]">
              <div className="shrink-0 rounded-2xl border border-border bg-card p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/90">
                  Campagne
                </div>
                <div className="mt-1.5 text-lg font-black text-foreground">
                  {campaign.name}
                </div>
                <div className="mt-1.5 text-sm font-semibold text-muted-foreground">
                  Statut : <strong>{campaignStatusLabel(campaign.status)}</strong>
                </div>
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-3 max-[900px]:grid-cols-1">
                <div className="rounded-2xl border border-border bg-card p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                  <div className="text-xs font-bold text-muted-foreground">
                    Date de création
                  </div>
                  <div className="mt-1 text-sm font-black text-foreground">
                    {campaign.createdLabel}
                  </div>
                  <div className="mt-2.5 text-xs font-bold text-muted-foreground">
                    Envoi
                  </div>
                  <div className="mt-1 text-sm font-black text-foreground">
                    {campaign.sendLabel}
                  </div>
                  <div className="mt-2.5 text-xs font-bold text-muted-foreground">
                    Mode
                  </div>
                  <div className="mt-1 text-sm font-black text-foreground">
                    {campaign.sendMode === "sched" ? "Programmé" : "Immédiat"}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                  <div className="text-xs font-bold text-muted-foreground">
                    Expéditeur
                  </div>
                  <div className="mt-1 text-sm font-black text-foreground">
                    {campaign.sender?.trim() || "—"}
                  </div>
                  <div className="mt-2.5 text-xs font-bold text-muted-foreground">
                    Destinataires
                  </div>
                  <div className="mt-1 text-sm font-black text-foreground">
                    {campaign.recipients}
                  </div>
                  <div className="mt-2.5 text-xs font-bold text-muted-foreground">
                    Crédits estimés
                  </div>
                  <div className="mt-1 text-sm font-black text-foreground">
                    {campaign.creditsLabel}
                  </div>
                </div>
              </div>

              <div className="shrink-0 rounded-2xl border border-border bg-card p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                <div className="text-xs font-bold text-muted-foreground">Message</div>
                <div className="mt-1.5 whitespace-pre-wrap rounded-xl border border-border bg-muted/50 p-2.5 text-sm font-semibold text-foreground/90">
                  {campaign.body?.trim() || "—"}
                </div>
              </div>

              {(hasContacts || hasGroups) && (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                  <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-3.5 py-2.5">
                    <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <span className="text-xs font-black text-foreground/80">
                      Destinataires ciblés
                    </span>
                    {hasGroups && (
                      <div className="ml-auto flex flex-wrap items-center gap-1.5">
                        {campaign.targetGroups!.map((g) => {
                          const c = groupColor(g);
                          return (
                            <span
                              key={g}
                              className={cn(
                                "inline-flex items-center rounded-[10px] border px-2.5 py-1 text-[12px] font-bold",
                                c.bg,
                                c.border,
                                c.text
                              )}
                            >
                              {g}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {hasContacts ? (
                    <div className="min-h-0 flex-1 overflow-auto">
                      <table className="w-full border-separate border-spacing-0 text-left text-[13px]">
                        <thead className="sticky top-0 z-[1] bg-muted/50">
                          <tr>
                            <th className="border-b border-border px-3 py-2 font-extrabold text-foreground/80">
                              Prénom
                            </th>
                            <th className="border-b border-border px-3 py-2 font-extrabold text-foreground/80">
                              Nom
                            </th>
                            <th className="border-b border-border px-3 py-2 font-extrabold text-foreground/80">
                              Téléphone
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaign.targetContacts!.map((c, i) => (
                            <tr key={i} className="border-b border-border/50">
                              <td className="px-3 py-2 font-semibold text-foreground">
                                {c.firstName || "—"}
                              </td>
                              <td className="px-3 py-2 font-semibold text-foreground">
                                {c.lastName || "—"}
                              </td>
                              <td className="px-3 py-2 font-semibold text-muted-foreground">
                                {c.phone}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex min-h-[60px] items-center justify-center px-3 py-4 text-sm font-semibold text-muted-foreground">
                      Pas de détail individuel disponible.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex shrink-0 justify-end border-t border-border bg-card px-[18px] py-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className={brandBtnCls}
                onClick={onClose}
              >
                Fermer
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
