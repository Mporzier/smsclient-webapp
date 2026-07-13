"use client";

import { cn } from "@/lib/cn";
import {
  brandBtnCls,
  brandBtnPrimaryCls,
} from "@/components/smsclient/modals/modalChrome";
import { Button } from "@/components/ui/button";
import { useCallback, useState } from "react";
import { Check, CreditCard, Lock, ShieldCheck } from "lucide-react";

const TVA_RATE = 0.2;

const PACKS = [
  {
    code: "starter",
    pack: "Starter",
    credits: 500,
    priceHT: 32.5,
    badge: "Idéal pour tester",
    best: false,
    perCredit: "0,065 €",
  },
  {
    code: "business",
    pack: "Business",
    credits: 2000,
    priceHT: 107.5,
    badge: "Le plus populaire",
    best: true,
    perCredit: "0,054 €",
  },
  {
    code: "pro",
    pack: "Pro",
    credits: 5000,
    priceHT: 249.17,
    badge: "Meilleur ratio",
    best: false,
    perCredit: "0,050 €",
  },
] as const;

type Pack = (typeof PACKS)[number];

function fmtEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function fmtInt(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

export type AcheterCreditsViewProps = {
  balanceLabel: string;
  creditsAvailable: number;
  onCancel: () => void;
  onBuy?: (selection: Pack) => Promise<void> | void;
};

export function AcheterCreditsView({
  balanceLabel,
  creditsAvailable,
  onCancel,
  onBuy,
}: AcheterCreditsViewProps) {
  const [sel, setSel] = useState<Pack | null>(null);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [buySuccess, setBuySuccess] = useState(false);

  const tva = sel ? sel.priceHT * TVA_RATE : 0;
  const ttc = sel ? sel.priceHT + tva : 0;
  const newBalance = sel ? creditsAvailable + sel.credits : creditsAvailable;

  const handleBuy = useCallback(async () => {
    if (!sel) return;
    setBuyError(null);
    setBuying(true);
    try {
      await onBuy?.(sel);
      setBuySuccess(true);
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : "Achat impossible.");
    } finally {
      setBuying(false);
    }
  }, [sel, onBuy]);

  if (buySuccess && sel) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100">
            <Check className="h-8 w-8 text-emerald-600" strokeWidth={2.5} />
          </div>
          <h2 className="mt-4 text-xl font-black text-slate-900">
            Achat confirmé
          </h2>
          <p className="mt-2 text-sm font-bold text-slate-600">
            {fmtInt(sel.credits)} crédits ont été ajoutés à votre compte.
          </p>
          <p className="mt-1 text-sm font-bold text-slate-600">
            Nouveau solde : <strong className="text-slate-900">{fmtInt(newBalance)} crédits</strong>
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Facture : {fmtEur(ttc)} TTC
          </p>
          <div className="mt-5">
            <Button
              variant="default"
              size="lg"
              className={brandBtnPrimaryCls}
              onClick={onCancel}
            >
              Retour
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Solde actuel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="m-0 text-sm font-bold text-slate-600">Solde actuel</p>
            <p className="m-0 mt-1 text-2xl font-black text-slate-900">
              {balanceLabel}
            </p>
          </div>
          <Button variant="outline" size="lg" className={brandBtnCls} onClick={onCancel}>
            Retour
          </Button>
        </div>
      </div>

      {/* Packs */}
      <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-1">
        {PACKS.map((p) => {
          const active = sel?.code === p.code;
          return (
            <button
              key={p.code}
              type="button"
              onClick={() => {
                setSel(p);
                setBuyError(null);
              }}
              aria-pressed={active}
              className={cn(
                "relative cursor-pointer rounded-2xl border bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(15,23,42,0.10)]",
                active
                  ? "border-[#2f6fed] shadow-[0_18px_40px_rgba(59,130,246,0.15)] ring-2 ring-blue-300/60"
                  : "border-slate-200 shadow-[0_10px_22px_rgba(15,23,42,0.08)]",
              )}
            >
              {active && (
                <div className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-[#2f6fed] text-white">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900">
                  {p.pack}
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] font-black",
                    p.best
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-slate-50 text-slate-600",
                  )}
                >
                  {p.badge}
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-[38px] font-black leading-none tracking-tight text-slate-900">
                  {fmtInt(p.credits)}
                </span>
                <span className="text-sm font-black text-slate-500">
                  crédits
                </span>
              </div>
              <div className="mt-3 text-xs font-bold text-slate-500">
                ≈ {fmtInt(p.credits)} SMS · {p.perCredit} / crédit
              </div>
              <div className="mt-4 h-px bg-slate-100" />
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">
                  {fmtEur(p.priceHT + p.priceHT * TVA_RATE)}
                </span>
                <span className="text-xs font-bold text-slate-500">TTC</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                {fmtEur(p.priceHT)} HT + {fmtEur(p.priceHT * TVA_RATE)} TVA (20 %)
              </p>
            </button>
          );
        })}
      </div>

      {/* Récap + paiement */}
      <div className="grid grid-cols-[1fr_1fr] gap-4 max-[900px]:grid-cols-1">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <h2 className="m-0 text-base font-black text-slate-900">
            Récapitulatif
          </h2>
          {!sel ? (
            <p className="mt-3 text-sm font-semibold text-slate-500">
              Sélectionnez un pack pour voir le détail.
            </p>
          ) : (
            <div className="mt-3 grid gap-2">
              <div className="flex justify-between text-sm font-extrabold">
                <span className="text-slate-600">Pack</span>
                <strong>{sel.pack}</strong>
              </div>
              <div className="flex justify-between text-sm font-extrabold">
                <span className="text-slate-600">Crédits</span>
                <strong>{fmtInt(sel.credits)}</strong>
              </div>
              <div className="my-1 h-px bg-slate-100" />
              <div className="flex justify-between text-sm font-extrabold">
                <span className="text-slate-600">Prix HT</span>
                <strong>{fmtEur(sel.priceHT)}</strong>
              </div>
              <div className="flex justify-between text-sm font-extrabold">
                <span className="text-slate-600">TVA (20 %)</span>
                <strong>{fmtEur(tva)}</strong>
              </div>
              <div className="my-1 h-px bg-slate-200" />
              <div className="flex justify-between text-base font-black">
                <span className="text-slate-900">Total TTC</span>
                <strong className="text-[#2f6fed]">{fmtEur(ttc)}</strong>
              </div>
              <div className="my-1 h-px bg-slate-100" />
              <div className="flex justify-between text-sm font-extrabold">
                <span className="text-slate-600">Solde actuel</span>
                <strong>{fmtInt(creditsAvailable)} crédits</strong>
              </div>
              <div className="flex justify-between text-sm font-extrabold">
                <span className="text-slate-600">Nouveau solde</span>
                <strong className="text-emerald-700">
                  {fmtInt(newBalance)} crédits
                </strong>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <h2 className="m-0 text-base font-black text-slate-900">
              Paiement
            </h2>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700">
              <CreditCard className="h-4 w-4 text-slate-500" />
              VISA •••• 8003 — Exp. 12/27
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Le paiement sera débité sur votre carte enregistrée.
            </p>

            {buyError && (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
                {buyError}
              </p>
            )}

            <Button
              variant="default"
              size="lg"
              className={cn(brandBtnPrimaryCls, "mt-4 w-full justify-center")}
              disabled={!sel || buying}
              onClick={handleBuy}
            >
              {buying
                ? "Traitement…"
                : sel
                  ? `Payer ${fmtEur(ttc)} TTC`
                  : "Sélectionnez un pack"}
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                Paiement sécurisé SSL 256-bit
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                Facture disponible immédiatement
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                Crédits ajoutés instantanément
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
