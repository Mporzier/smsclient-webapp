"use client";

import { ProtoBtn, PlusIcon } from "@/components/smsclient/ui";
import type { CreditPurchaseRowData } from "@/lib/types/credits";
import { Pager } from "./Pager";

type CreditsProps = {
  balanceLabel: string;
  loading: boolean;
  error: string | null;
  purchases: CreditPurchaseRowData[];
  onBuyCredits: () => void;
  onEditBillingInfo: () => void;
  onEditPaymentMethod: () => void;
  onInvoiceClick: (id: string) => void;
};

export function CreditsView({
  balanceLabel,
  loading,
  error,
  purchases,
  onBuyCredits,
  onEditBillingInfo,
  onEditPaymentMethod,
  onInvoiceClick,
}: CreditsProps) {
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
          <div className="mt-1 text-[34px] font-black text-slate-900">
            {loading ? "…" : balanceLabel}
          </div>
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
          <ProtoBtn green className="mt-3 text-sm" onClick={onEditBillingInfo}>
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
          <ProtoBtn green className="mt-3 text-sm" onClick={onEditPaymentMethod}>
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
            {loading && (
              <tr className="border-t border-slate-300/25 text-[14px]">
                <td className="px-4 py-6 text-slate-500" colSpan={6}>
                  Chargement des achats…
                </td>
              </tr>
            )}
            {!loading && purchases.length === 0 && (
              <tr className="border-t border-slate-300/25 text-[14px]">
                <td className="px-4 py-6 text-slate-500" colSpan={6}>
                  Aucun achat de crédit pour l’instant.
                </td>
              </tr>
            )}
            {!loading && purchases.map((row) => (
              <tr key={row.id} className="border-t border-slate-300/25 text-[14px]">
                <td className="px-4 py-3.5">{row.createdLabel}</td>
                <td className="px-4 py-3.5 font-bold">{row.packLabel}</td>
                <td className="px-4 py-3.5">{row.amountLabel}</td>
                <td className="px-4 py-3.5">
                  {row.status === "paid" ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-500/12 px-2.5 py-1 text-[13px] font-black text-emerald-800">
                      Payée
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-400/15 px-2.5 py-1 text-[13px] font-black text-slate-700">
                      Remboursée
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5">{row.creditsLabel}</td>
                <td className="px-4 py-3.5 text-right">
                  <ProtoBtn
                    className="h-9 px-3 text-sm"
                    onClick={() => onInvoiceClick(row.invoiceRef)}
                    data-dl={row.invoiceRef}
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
            {loading
              ? "Chargement des factures…"
              : `${purchases.length} facture${purchases.length > 1 ? "s" : ""} disponible${purchases.length > 1 ? "s" : ""}`}
          </span>
          <Pager />
        </div>
      </div>
      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
          {error}
        </p>
      )}
    </div>
  );
}
