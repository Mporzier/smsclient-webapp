"use client";

import { ProtoBtn, PlusIcon } from "@/components/smsclient/ui";
import { Pager } from "./Pager";

type CreditsProps = {
  onBuyCredits: () => void;
  onInvoiceClick: (id: string) => void;
};

export function CreditsView({ onBuyCredits, onInvoiceClick }: CreditsProps) {
  return (
    <div className="relative flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-[40px] font-black tracking-tight text-slate-900">
          Crédit SMS
        </div>
        <ProtoBtn primary onClick={onBuyCredits}>
          <PlusIcon />
          Ajouter des crédits
        </ProtoBtn>
      </div>

      <div className="grid grid-cols-3 gap-3.5 max-[1100px]:grid-cols-1">
        <div className="rounded-2xl border border-slate-300/40 bg-white px-4 py-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)] max-w-[320px]">
          <div className="text-sm font-extrabold text-slate-500">Crédits restants</div>
          <div className="mt-1 text-[34px] font-black text-slate-900">490</div>
        </div>
        <div className="rounded-2xl border border-slate-300/40 bg-white px-4 py-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-500/90">
            Informations de facturation
          </div>
          <div className="mt-2.5 text-base font-black">BONNE MONTMARTRE SARL</div>
          <div className="mt-2.5 text-sm font-semibold leading-relaxed text-slate-600">
            56 RUE LABAT
            <br />
            75018 PARIS
          </div>
          <ProtoBtn green className="mt-3 text-sm">
            Modifier
          </ProtoBtn>
        </div>
        <div className="rounded-2xl border border-slate-300/40 bg-white px-4 py-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <div className="text-[11px] font-black text-transparent">.</div>
          <div className="mt-2.5 text-[28px] font-black tracking-wide text-slate-800">
            VISA
          </div>
          <div className="mt-2.5 text-sm font-semibold leading-relaxed text-slate-600">
            <strong>Visa :</strong> 8003
            <br />
            <strong>Date d&apos;expiration :</strong> 12/28
          </div>
          <ProtoBtn green className="mt-3 text-sm">
            Modifier
          </ProtoBtn>
        </div>
      </div>

      <div className="mt-2 text-base font-black text-slate-900">Historique d&apos;achats</div>
      <p className="-mt-1 text-[13px] font-bold text-slate-500">
        Retrouve ici tes achats et télécharge les factures.
      </p>

      <div className="mt-1 overflow-hidden rounded-2xl border border-slate-300/40 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-400/10">
              <th className="px-4 py-3.5 text-left font-extrabold">Date</th>
              <th className="px-4 py-3.5 text-left font-extrabold">Pack(s) acheté(s)</th>
              <th className="w-[110px] px-4 py-3.5 text-left font-extrabold">Prix</th>
              <th className="w-[140px] px-4 py-3.5 text-left font-extrabold">Statut</th>
              <th className="w-[110px] px-4 py-3.5 text-left font-extrabold">Crédit SMS</th>
              <th className="w-[170px] px-4 py-3.5 text-right font-extrabold">PDF</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["28/02/2026", "Starter", "15 €", "pay", "150", "FAC-2026-0006"],
              ["12/02/2026", "Business", "65 €", "pay", "5 000", "FAC-2026-0005"],
              ["02/01/2026", "Pro", "120 €", "pay", "10 000", "FAC-2026-0004"],
              ["15/12/2025", "Business", "65 €", "ref", "5 000", "FAC-2025-0019"],
            ].map(([date, pack, price, st, cred, fac]) => (
              <tr key={fac} className="border-t border-slate-300/25 text-[14px]">
                <td className="px-4 py-3.5">{date}</td>
                <td className="px-4 py-3.5 font-bold">{pack}</td>
                <td className="px-4 py-3.5">{price}</td>
                <td className="px-4 py-3.5">
                  {st === "pay" ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-500/12 px-2.5 py-1 text-[13px] font-black text-emerald-800">
                      Payée
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-400/15 px-2.5 py-1 text-[13px] font-black text-slate-700">
                      Remboursée
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5">{cred}</td>
                <td className="px-4 py-3.5 text-right">
                  <ProtoBtn
                    className="h-9 px-3 text-sm"
                    onClick={() => onInvoiceClick(fac)}
                    data-dl={fac}
                  >
                    Télécharger facture
                  </ProtoBtn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-300/25 px-3.5 py-3">
          <span className="text-sm font-extrabold text-slate-500">
            6 factures disponibles
          </span>
          <Pager />
        </div>
      </div>
    </div>
  );
}
