"use client";

import { cn } from "@/lib/cn";
import { brandBtnPrimaryCls } from "@/components/smsclient/modals/modalChrome";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCallback, useState } from "react";
import {
  Check,
  Layers,
  Sparkles,
  TriangleAlert,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

const TVA_RATE = 0.2;

type BillingPeriod = "once" | "monthly";

/** Prix packs = TTC (10 / 35 / 100 €). Tarif SMS pack = 0,12 / 0,11 / 0,10 €. */
const PACKS: ReadonlyArray<{
  code: "starter" | "business" | "pro";
  name: string;
  credits: number;
  priceTTC: number;
  perSmsEur: number;
  badge: string;
  best: boolean;
  volumeDiscountPct: number;
  monthlyVolumeDiscountPct: number;
  monthlyBonusPct: number;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  features: readonly string[];
}> = [
  {
    code: "starter",
    name: "Découverte",
    credits: 83,
    priceTTC: 10,
    perSmsEur: 0.12,
    badge: "Idéal pour débuter",
    best: false,
    volumeDiscountPct: 0,
    monthlyVolumeDiscountPct: 5,
    monthlyBonusPct: 0.05,
    icon: Sparkles,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    features: ["Envoi SMS campagne", "Statistiques de base", "Support e-mail"],
  },
  {
    code: "business",
    name: "Croissance",
    credits: 318,
    priceTTC: 35,
    perSmsEur: 0.11,
    badge: "Le plus populaire",
    best: true,
    volumeDiscountPct: 5,
    monthlyVolumeDiscountPct: 10,
    monthlyBonusPct: 0.1,
    icon: TrendingUp,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
    features: [
      "Tout Découverte",
      "Rédaction IA",
      "Modèles SMS illimités",
      "Groupes avancés",
    ],
  },
  {
    code: "pro",
    name: "Expansion",
    credits: 1000,
    priceTTC: 100,
    perSmsEur: 0.1,
    badge: "Meilleur rapport volume",
    best: false,
    volumeDiscountPct: 10,
    monthlyVolumeDiscountPct: 15,
    monthlyBonusPct: 0.15,
    icon: Layers,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-700",
    features: [
      "Tout Croissance",
      "Priorité support",
      "Multi-utilisateurs",
      "Exports avancés",
    ],
  },
];

type Pack = (typeof PACKS)[number];

function packTitle(pack: Pack, billing: BillingPeriod): string {
  return billing === "monthly"
    ? `Abonnement ${pack.name}`
    : `Pack ${pack.name}`;
}

export type CreditBuySelection = {
  code: Pack["code"];
  pack: string;
  credits: number;
  priceHT: number;
  billing: BillingPeriod;
};

function fmtEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function fmtInt(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function priceTTCFor(pack: Pack): number {
  return pack.priceTTC;
}

/** HT envoyé à l’API achat (settingsRoutes re-applique TVA 20 %). */
function priceHTFromTTC(ttc: number): number {
  return Math.round((ttc / (1 + TVA_RATE)) * 100) / 100;
}

function creditsFor(pack: Pack, billing: BillingPeriod): number {
  const bonusPct = bonusPctFor(pack, billing);
  if (bonusPct === 0) return pack.credits;
  return Math.round(pack.credits * (1 + bonusPct));
}

function bonusPctFor(pack: Pack, billing: BillingPeriod): number {
  return billing === "monthly"
    ? pack.monthlyBonusPct
    : pack.volumeDiscountPct / 100;
}

function volumeDiscountFor(pack: Pack, billing: BillingPeriod): number {
  return billing === "monthly"
    ? pack.monthlyVolumeDiscountPct
    : pack.volumeDiscountPct;
}

function perSmsFor(pack: Pack, billing: BillingPeriod): number {
  const bonusPct = bonusPctFor(pack, billing);
  if (billing === "once" && bonusPct === 0) return pack.perSmsEur;
  const credits = creditsFor(pack, billing);
  return Math.round((pack.priceTTC / credits) * 100) / 100;
}

const cardShadowCls = "shadow-[0_10px_22px_rgba(15,23,42,0.08)]";

export type AcheterCreditsViewProps = {
  creditsAvailable: number;
  onCancel: () => void;
  onBuy?: (selection: CreditBuySelection) => Promise<void> | void;
};

export function AcheterCreditsView({
  creditsAvailable,
  onCancel,
  onBuy,
}: AcheterCreditsViewProps) {
  const [billing, setBilling] = useState<BillingPeriod>("once");
  const [buyingCode, setBuyingCode] = useState<Pack["code"] | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [bought, setBought] = useState<CreditBuySelection | null>(null);

  const handleBuy = useCallback(
    async (pack: Pack) => {
      const selection: CreditBuySelection = {
        code: pack.code,
        pack: packTitle(pack, billing),
        credits: creditsFor(pack, billing),
        priceHT: priceHTFromTTC(priceTTCFor(pack)),
        billing,
      };
      setBuyError(null);
      setBuyingCode(pack.code);
      try {
        await onBuy?.(selection);
        setBought(selection);
      } catch (e) {
        setBuyError(e instanceof Error ? e.message : "Achat impossible.");
      } finally {
        setBuyingCode(null);
      }
    },
    [billing, onBuy]
  );

  if (bought) {
    const ttc = Math.round(bought.priceHT * (1 + TVA_RATE) * 100) / 100;
    const newBalance = creditsAvailable + bought.credits;
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className={cn("max-w-md text-center", cardShadowCls)}>
          <CardContent className="pt-2">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100">
              <Check className="h-8 w-8 text-emerald-600" strokeWidth={2.5} />
            </div>
            <h2 className="mt-4 text-xl font-black text-slate-900">
              Achat confirmé
            </h2>
            <p className="mt-2 text-sm font-bold text-slate-600">
              {fmtInt(bought.credits)} crédits ont été ajoutés à votre compte.
            </p>
            <p className="mt-1 text-sm font-bold text-slate-600">
              Nouveau solde :{" "}
              <strong className="text-slate-900">
                {fmtInt(newBalance)} crédits
              </strong>
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Facture : {fmtEur(ttc)} TTC
              {bought.billing === "monthly" ? " / mois" : ""}
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="text-center">
        <h1 className="m-0 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Envoyez plus. Payez moins.
        </h1>
        <p className="m-0 mx-auto mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-slate-500">
          Rechargez vos crédits en un clic, pour un prix accessible à tous.
        </p>
      </header>

      <div
        role="group"
        aria-label="Mode de facturation"
        className="mx-auto grid w-full max-w-sm grid-cols-2 rounded-full bg-muted ring-1 ring-foreground/10"
      >
        {(
          [
            { id: "once", label: "Paiement unique" },
            { id: "monthly", label: "Mensuel" },
          ] as const
        ).map((opt) => {
          const active = billing === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setBilling(opt.id);
                setBuyError(null);
              }}
              className={cn(
                "cursor-pointer rounded-full px-4 py-2 text-sm font-bold transition-all outline-none focus-visible:outline-none focus-visible:ring-0",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {buyError && (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden />
          <AlertDescription className="font-bold">{buyError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-3 items-stretch gap-4 max-[900px]:grid-cols-1">
        {PACKS.map((p) => {
          const ttc = priceTTCFor(p);
          const credits = creditsFor(p, billing);
          const bonusPct = bonusPctFor(p, billing);
          const perSms = perSmsFor(p, billing);
          const volumeDiscountPct = volumeDiscountFor(p, billing);
          const busy = buyingCode === p.code;
          const anyBusy = buyingCode != null;

          return (
            <Card
              key={p.code}
              className={cn(
                "relative flex flex-col py-0 transition-all",
                p.best
                  ? "z-[1] shadow-[0_18px_40px_rgba(59,130,246,0.18)] ring-2 ring-[#2f6fed]/50 max-[900px]:scale-100 min-[900px]:-my-2 min-[900px]:scale-[1.03]"
                  : cardShadowCls
              )}
            >
              <CardContent className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                      p.iconBg
                    )}
                  >
                    <p.icon
                      className={cn("h-5 w-5", p.iconColor)}
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  </span>
                  {volumeDiscountPct > 0 && (
                    <Badge
                      variant="outline"
                      className="h-auto shrink-0 rounded-full border-emerald-200 bg-emerald-50 px-2.5 text-[11px] font-black text-emerald-700"
                    >
                      −{volumeDiscountPct} %
                    </Badge>
                  )}
                </div>
                <h2 className="m-0 mt-3 text-lg font-black text-slate-900">
                  {packTitle(p, billing)}
                </h2>
                <p
                  className={cn(
                    "mt-1 text-xs font-bold",
                    p.best ? "text-blue-700" : "text-slate-500"
                  )}
                >
                  {p.badge}
                </p>

                <div className="mt-4 flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-black leading-none tracking-tight text-slate-900">
                    {fmtEur(ttc)}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    TTC{billing === "monthly" ? " / mois" : ""}
                  </span>
                </div>

                <p className="mt-3 text-sm font-bold text-slate-700">
                  {fmtInt(credits)} crédits
                  {bonusPct > 0 && (
                    <span className="ml-1.5 font-semibold text-emerald-700">
                      (+{Math.round(bonusPct * 100)} % offerts)
                    </span>
                  )}
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {fmtEur(perSms)} / SMS
                </p>

                <div className="mt-4 h-px bg-slate-100" />

                <ul className="mt-4 m-0 flex list-none flex-col gap-2 p-0">
                  {p.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm font-semibold text-slate-700"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="flex-1" />

                <Button
                  variant="default"
                  size="lg"
                  className={cn(
                    brandBtnPrimaryCls,
                    "mt-5 w-full justify-center"
                  )}
                  disabled={anyBusy}
                  onClick={() => handleBuy(p)}
                >
                  {busy
                    ? "Traitement…"
                    : billing === "monthly"
                    ? `S’abonner ${p.name}`
                    : `Acheter ${p.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
