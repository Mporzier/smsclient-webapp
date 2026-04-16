"use client";

import { cn } from "@/lib/cn";

type Props = {
  screen: "home" | "features";
  onOpenFeatures: () => void;
  onOpenMvp: () => void;
  onBackHome: () => void;
  onMvpFromFeatures: () => void;
};

export function LandingScreens({
  screen,
  onOpenFeatures,
  onOpenMvp,
  onBackHome,
  onMvpFromFeatures,
}: Props) {
  return (
    <>
      <section
        className={cn(
          "box-border min-h-screen flex-col items-center justify-center bg-white px-6 py-10",
          screen === "home" ? "flex" : "hidden",
        )}
      >
        <div className="w-full max-w-[760px] rounded-[28px] border border-slate-300/40 bg-white px-10 py-14 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[900px]:px-6 max-[900px]:py-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-blue-700">
            SMSClient.fr · Vision produit
          </div>
          <h1 className="mt-4 text-[54px] font-black leading-[1.02] tracking-tight text-slate-900 max-[900px]:text-[40px]">
            Un SaaS SMS pensé pour les commerçants
          </h1>
          <p className="mx-auto mt-3 max-w-[620px] text-lg leading-relaxed text-slate-500">
            Choisis entre le résumé produit et le prototype. La partie features
            reprend le condensé du MVP indispensable et des éléments
            différenciants pour transformer SMSClient.fr en véritable assistant
            marketing.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <button
              type="button"
              onClick={onOpenFeatures}
              className="h-[52px] cursor-pointer rounded-2xl border border-slate-300/70 bg-white px-6 text-base font-black text-slate-900"
            >
              Détails des features
            </button>
            <button
              type="button"
              onClick={onOpenMvp}
              className="h-[52px] cursor-pointer rounded-2xl border-none bg-gradient-to-br from-blue-600 to-blue-700 px-6 text-base font-black text-white shadow-[0_14px_30px_rgba(37,99,235,0.28)]"
            >
              MVP
            </button>
          </div>
        </div>
      </section>

      <section
        className={cn(
          "box-border min-h-screen flex-col items-start justify-center bg-gradient-to-b from-[#f8fbff] to-[#eff4ff] px-6 py-10",
          screen === "features" ? "flex" : "hidden",
        )}
      >
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5 rounded-[28px] border border-slate-300/40 bg-white px-8 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[900px]:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[42px] font-black leading-tight tracking-tight text-slate-900 max-[900px]:text-[32px]">
                Résumé produit de SMSClient.fr
              </h1>
              <p className="mt-1 max-w-[820px] text-[17px] leading-relaxed text-slate-500">
                Le produit ne doit pas être seulement un outil d&apos;envoi de
                SMS, mais un assistant marketing pour commerçants. Voici le
                résumé des deux axes clés : le MVP indispensable et les
                fonctionnalités qui créent la différence.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onBackHome}
                className="h-[52px] cursor-pointer rounded-2xl border border-slate-300/70 bg-white px-6 text-base font-black text-slate-900"
              >
                Accueil
              </button>
              <button
                type="button"
                onClick={onMvpFromFeatures}
                className="h-[52px] cursor-pointer rounded-2xl border-none bg-gradient-to-br from-blue-600 to-blue-700 px-6 text-base font-black text-white shadow-[0_14px_30px_rgba(37,99,235,0.28)]"
              >
                Voir le MVP
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-[900px]:grid-cols-1">
            <article className="rounded-[22px] border border-slate-200 bg-gradient-to-b from-white to-[#f8fbff] p-[22px]">
              <h3 className="text-[22px] font-bold leading-snug tracking-tight">
                1. Les 20 features indispensables pour le MVP
              </h3>
              <ul className="mt-3.5 list-disc pl-[18px] leading-loose text-slate-700">
                <li>Gestion des contacts</li>
                <li>Import CSV</li>
                <li>Groupes de contacts</li>
                <li>Recherche de contacts</li>
                <li>Gestion des STOP</li>
                <li>Création de campagnes</li>
                <li>Envoi immédiat</li>
                <li>Programmation d&apos;envoi</li>
                <li>Envoi par groupe</li>
                <li>Brouillons de campagnes</li>
                <li>Éditeur de SMS</li>
                <li>Compteur de caractères</li>
                <li>Calcul des segments SMS</li>
                <li>Aperçu avant envoi</li>
                <li>Variables dynamiques</li>
                <li>Templates de messages</li>
                <li>Historique des campagnes</li>
                <li>Statistiques simples</li>
                <li>Achat de crédits SMS</li>
                <li>Estimation du coût avant envoi</li>
              </ul>
            </article>
            <article className="rounded-[22px] border border-slate-200 bg-gradient-to-b from-white to-[#f8fbff] p-[22px]">
              <h3 className="text-[22px] font-bold leading-snug tracking-tight">
                2. Les features qui font vraiment la différence
              </h3>
              <ul className="mt-3.5 list-disc pl-[18px] leading-loose text-slate-700">
                <li>Copilote marketing avec IA</li>
                <li>Analyse automatique des clients</li>
                <li>Classement VIP, fidèles, nouveaux, inactifs</li>
                <li>Automations SMS</li>
                <li>SMS d&apos;anniversaire, après achat, relance client</li>
                <li>Campagnes prêtes en 1 clic</li>
                <li>Préparation automatique du segment, du message et de l&apos;envoi</li>
                <li>Score de performance marketing</li>
                <li>Analyse de la qualité du SMS</li>
                <li>Recommandation sur quoi envoyer, à qui et quand</li>
              </ul>
            </article>
          </div>

          <div className="rounded-[22px] bg-slate-900 p-6 text-white">
            <h3 className="text-2xl font-bold">L&apos;idée clé</h3>
            <p className="mt-2.5 leading-relaxed text-white/80">
              Ton produit doit être perçu comme un assistant marketing pour
              commerçants, pas comme un simple routeur SMS. Il aide à décider
              quoi envoyer, à quel segment et au bon moment, tout en restant
              simple à utiliser.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
