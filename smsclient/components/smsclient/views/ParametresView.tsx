"use client";

import { BadgeSent, ProtoBtn } from "@/components/smsclient/ui";

export function ParametresView() {
  const inp =
    "h-11 w-full rounded-[14px] border border-slate-300/50 bg-white px-3.5 text-[15px] font-bold text-slate-900 outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]";
  const lbl = "mb-1.5 block text-xs font-black text-slate-600";
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[34px] font-extrabold text-slate-900">Paramètres</h1>
          <p className="mt-1.5 text-slate-600">
            Gère les informations de ton compte et ta facturation.
          </p>
        </div>
        <div className="flex gap-3">
          <ProtoBtn>Annuler</ProtoBtn>
          <ProtoBtn primary>Enregistrer</ProtoBtn>
        </div>
      </div>

      <div className="grid grid-cols-[1.2fr_0.8fr] items-start gap-4 max-[1100px]:grid-cols-1">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <h2 className="m-0 text-base font-black text-slate-900">Compte</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
            <div>
              <label className={lbl}>Prénom</label>
              <input className={inp} defaultValue="Sophie" placeholder="Ex : Patrick" />
            </div>
            <div>
              <label className={lbl}>Nom</label>
              <input className={inp} defaultValue="Durand" placeholder="Ex : Azevedo" />
            </div>
            <div className="col-span-2 max-[600px]:col-span-1">
              <label className={lbl}>Email</label>
              <input
                className={inp}
                defaultValue="Sophie.durand@gmail.com"
                placeholder="email@domaine.fr"
              />
            </div>
            <div className="col-span-2 max-[600px]:col-span-1">
              <label className={lbl}>Téléphone</label>
              <input
                className={inp}
                defaultValue="06 12 34 56 78"
                placeholder="06 00 00 00 00"
              />
            </div>
          </div>

          <div className="my-4 h-px bg-slate-300/40" />

          <h2 className="m-0 text-base font-black text-slate-900">Entreprise</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
            <div className="col-span-2">
              <label className={lbl}>Nom de l&apos;entreprise</label>
              <input className={inp} defaultValue="SMSClient" />
            </div>
            <div>
              <label className={lbl}>SIRET</label>
              <input className={inp} defaultValue="912 345 678 00019" />
            </div>
            <div>
              <label className={lbl}>TVA</label>
              <input className={inp} defaultValue="FRXX123456789" />
            </div>
          </div>

          <div className="my-4 h-px bg-slate-300/40" />

          <h2 className="m-0 text-base font-black text-slate-900">
            Adresse de facturation
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
            <div className="col-span-2">
              <label className={lbl}>Adresse</label>
              <input className={inp} defaultValue="56 Rue Labat" />
            </div>
            <div>
              <label className={lbl}>Code postal</label>
              <input className={inp} defaultValue="75018" />
            </div>
            <div>
              <label className={lbl}>Ville</label>
              <input className={inp} defaultValue="Paris" />
            </div>
            <div>
              <label className={lbl}>Pays</label>
              <input className={inp} defaultValue="France" />
            </div>
            <div>
              <label className={lbl}>Contact facturation</label>
              <input className={inp} defaultValue="facturation@smsclient.fr" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <h2 className="m-0 text-base font-black text-slate-900">Plan & sécurité</h2>
            <div className="mt-3 grid gap-2.5">
              <div className="flex justify-between gap-3 text-sm font-extrabold">
                <span className="text-slate-600">Abonnement</span>
                <strong>Pay-as-you-go</strong>
              </div>
              <div className="flex justify-between gap-3 text-sm font-extrabold">
                <span className="text-slate-600">Mode de paiement</span>
                <strong>Carte (VISA •••• 8003)</strong>
              </div>
              <div className="flex justify-between gap-3 text-sm font-extrabold">
                <span className="text-slate-600">2FA</span>
                <BadgeSent>Activé</BadgeSent>
              </div>
            </div>
            <div className="mt-3.5 flex flex-wrap gap-2.5">
              <ProtoBtn>Modifier la carte</ProtoBtn>
              <ProtoBtn>Gérer la sécurité</ProtoBtn>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <h2 className="m-0 text-base font-black text-slate-900">Préférences</h2>
            <div className="mt-3 grid gap-2.5">
              <label className="flex items-center gap-2.5 text-sm font-extrabold text-slate-600">
                <input type="checkbox" defaultChecked className="h-[18px] w-[18px]" />
                Recevoir les notifications email (factures, alertes)
              </label>
              <label className="flex items-center gap-2.5 text-sm font-extrabold text-slate-600">
                <input type="checkbox" defaultChecked className="h-[18px] w-[18px]" />
                Résumé mensuel des campagnes
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <h2 className="m-0 text-base font-black text-slate-900">Zone sensible</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              <ProtoBtn>Exporter mes données</ProtoBtn>
              <ProtoBtn className="border-rose-200 text-rose-700">Supprimer le compte</ProtoBtn>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
