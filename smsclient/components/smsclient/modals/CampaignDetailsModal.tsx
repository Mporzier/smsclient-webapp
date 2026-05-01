"use client";

import { cn } from "@/lib/cn";
import { ProtoBtn } from "@/components/smsclient/ui";
import type { CampaignRowData, SmsCampaignStatus } from "@/lib/types/campaign";
import { useEffect } from "react";
import { X } from "lucide-react";
import { modalCard, overlayCls } from "./modalChrome";

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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !campaign) return null;

  return (
    <div
      className={overlayCls}
      role="dialog"
      aria-modal
      aria-label="Détails de la campagne"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cn(modalCard, "max-w-[860px]")}>
        <div className="sticky top-0 z-[1] flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-[18px] py-4">
          <div>
            <div className="text-lg font-black text-slate-900">
              Détails de campagne
            </div>
            <div className="text-xs font-bold text-slate-500">
              Consultation uniquement (lecture seule)
            </div>
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-lg font-black shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
            aria-label="Fermer"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-3 bg-slate-50 p-[18px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <div className="text-[11px] font-black uppercase tracking-widest text-slate-500/90">
              Campagne
            </div>
            <div className="mt-2 text-lg font-black text-slate-900">
              {campaign.name}
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-600">
              Statut : <strong>{campaignStatusLabel(campaign.status)}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
              <div className="text-xs font-bold text-slate-500">
                Date de création
              </div>
              <div className="mt-1 text-sm font-black text-slate-900">
                {campaign.createdLabel}
              </div>
              <div className="mt-3 text-xs font-bold text-slate-500">Envoi</div>
              <div className="mt-1 text-sm font-black text-slate-900">
                {campaign.sendLabel}
              </div>
              <div className="mt-3 text-xs font-bold text-slate-500">Mode</div>
              <div className="mt-1 text-sm font-black text-slate-900">
                {campaign.sendMode === "sched" ? "Programmé" : "Immédiat"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
              <div className="text-xs font-bold text-slate-500">Expéditeur</div>
              <div className="mt-1 text-sm font-black text-slate-900">
                {campaign.sender?.trim() || "—"}
              </div>
              <div className="mt-3 text-xs font-bold text-slate-500">
                Destinataires
              </div>
              <div className="mt-1 text-sm font-black text-slate-900">
                {campaign.recipients}
              </div>
              <div className="mt-3 text-xs font-bold text-slate-500">
                Crédits estimés
              </div>
              <div className="mt-1 text-sm font-black text-slate-900">
                {campaign.creditsLabel}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <div className="text-xs font-bold text-slate-500">Message</div>
            <div className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-800">
              {campaign.body?.trim() || "—"}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end border-t border-slate-200 bg-white px-[18px] py-3.5">
          <ProtoBtn onClick={onClose}>Fermer</ProtoBtn>
        </div>
      </div>
    </div>
  );
}
