"use client";

import { cn } from "@/lib/cn";
import { ProtoBtn } from "@/components/smsclient/ui";
import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { modalCard, overlayCls } from "./modalChrome";

const PACKS = [
  {
    code: "starter",
    pack: "Starter",
    credits: 500,
    price: 39,
    badge: "Idéal pour tester",
    best: false,
  },
  {
    code: "business",
    pack: "Business",
    credits: 2000,
    price: 129,
    badge: "Le plus populaire",
    best: true,
  },
  {
    code: "pro",
    pack: "Pro",
    credits: 5000,
    price: 299,
    badge: "Meilleur ratio",
    best: false,
  },
] as const;

type CreditsModalProps = {
  open: boolean;
  onClose: () => void;
  onBought?: (selection: (typeof PACKS)[number]) => Promise<void> | void;
};

export function CreditsModal({ open, onClose, onBought }: CreditsModalProps) {
  const [sel, setSel] = useState<(typeof PACKS)[number] | null>(null);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSel(null);
      setBuyError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleBuy = useCallback(async () => {
    if (!sel) return;
    setBuyError(null);
    setBuying(true);
    try {
      await onBought?.(sel);
      onClose();
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : "Achat impossible.");
    } finally {
      setBuying(false);
    }
  }, [sel, onBought, onClose]);

  if (!open) return null;

  return (
    <div
      className={overlayCls}
      role="dialog"
      aria-modal
      aria-label="Acheter des crédits"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cn(modalCard, "max-w-[860px]")}>
        <div className="sticky top-0 z-[1] flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-[18px] py-4">
          <div>
            <div className="text-lg font-black text-slate-900">
              Ajouter des crédits
            </div>
            <div className="text-xs font-bold text-slate-500">
              Choisis un pack, puis clique sur &quot;Acheter&quot;.
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

        <div className="bg-slate-50 p-[18px]">
          <div className="grid grid-cols-3 gap-3.5 max-[900px]:grid-cols-1">
            {PACKS.map((p) => (
              <button
                key={p.pack}
                type="button"
                onClick={() => setSel(p)}
                aria-pressed={sel?.pack === p.pack}
                className={cn(
                  "cursor-pointer rounded-[18px] border border-slate-300/50 bg-white p-3.5 text-left transition hover:-translate-y-px hover:shadow-[0_16px_34px_rgba(15,23,42,0.10)]",
                  sel?.pack === p.pack &&
                    "border-blue-500 bg-blue-50/60 shadow-[0_18px_40px_rgba(59,130,246,0.18)] ring-2 ring-blue-300/60"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-lg font-black">{p.pack}</div>
                    {sel?.pack === p.pack && (
                      <div className="mt-1 text-xs font-black text-blue-700">
                        Pack sélectionné
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "whitespace-nowrap rounded-full border border-slate-300/60 bg-slate-200/70 px-2.5 py-1.5 text-xs font-black text-slate-800",
                        p.best &&
                          "border-blue-300/70 bg-blue-500/10 text-blue-800"
                      )}
                    >
                      {p.badge}
                    </span>
                    {sel?.pack === p.pack && (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-blue-300 bg-blue-600 text-xs font-black text-white">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3.5 flex items-baseline gap-2">
                  <span className="text-[34px] font-black leading-none tracking-tight">
                    {new Intl.NumberFormat("fr-FR").format(p.credits)}
                  </span>
                  <span className="font-black text-slate-600">crédits</span>
                </div>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className="text-lg font-black">{p.price} €</span>
                  <span className="text-xs font-extrabold text-slate-500">
                    ≈ {new Intl.NumberFormat("fr-FR").format(p.credits)} SMS
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 rounded-[18px] border border-slate-300/40 bg-slate-50/80 p-3.5">
            <div>
              <div className="font-black">Récap</div>
              {!sel && (
                <p className="mt-1 text-xs font-bold text-slate-500">
                  Sélectionne un pack pour afficher le récapitulatif.
                </p>
              )}
              <div className="mt-2 flex justify-between gap-3 text-sm font-extrabold text-slate-600">
                <span>Pack</span>
                <strong className="text-slate-900">{sel?.pack ?? "—"}</strong>
              </div>
              <div className="mt-1 flex justify-between gap-3 text-sm font-extrabold text-slate-600">
                <span>Crédits</span>
                <strong className="text-slate-900">
                  {sel
                    ? `${new Intl.NumberFormat("fr-FR").format(
                        sel.credits
                      )} crédits`
                    : "—"}
                </strong>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[22px] font-black text-slate-900">
                {sel ? `${sel.price} €` : "—"}
              </div>
              <div className="mt-1 text-xs font-extrabold text-slate-500">
                Paiement sécurisé (prototype)
              </div>
            </div>
          </div>
          {buyError && (
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
              {buyError}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white px-[18px] py-3.5">
          <ProtoBtn onClick={onClose}>Annuler</ProtoBtn>
          <ProtoBtn primary disabled={!sel || buying} onClick={handleBuy}>
            {buying ? "Achat…" : "Acheter"}
          </ProtoBtn>
        </div>
      </div>
    </div>
  );
}
