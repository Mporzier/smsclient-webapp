"use client";

import { BadgeSent, ProtoBtn } from "@/components/smsclient/ui";
import { cn } from "@/lib/cn";
import QRCode from "qrcode";
import Image from "next/image";
import { useEffect, useState } from "react";

type SettingsForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  siret: string;
  tva: string;
  address: string;
  zip: string;
  city: string;
  country: string;
  billingContact: string;
  sender: string;
  notifyInvoices: boolean;
  notifySummary: boolean;
};

function createInitialForm(sender: string): SettingsForm {
  return {
    firstName: "Sophie",
    lastName: "Durand",
    email: "Sophie.durand@gmail.com",
    phone: "06 12 34 56 78",
    companyName: "SMSClient",
    siret: "912 345 678 00019",
    tva: "FRXX123456789",
    address: "56 Rue Labat",
    zip: "75018",
    city: "Paris",
    country: "France",
    billingContact: "facturation@smsclient.fr",
    sender,
    notifyInvoices: true,
    notifySummary: true,
  };
}

export type ParametresViewProps = {
  smsSender: string;
  onSmsSenderChange: (v: string) => void | Promise<void>;
  qrPublicUrl: string;
  qrLoading: boolean;
  qrError: string | null;
  onRegenerateQr: () => Promise<void>;
};

export function ParametresView({
  smsSender,
  onSmsSenderChange,
  qrPublicUrl,
  qrLoading,
  qrError,
  onRegenerateQr,
}: ParametresViewProps) {
  const inp =
    "h-11 w-full rounded-[14px] border border-slate-300/50 bg-white px-3.5 text-[15px] font-bold text-slate-900 outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]";
  const lbl = "mb-1.5 block text-xs font-black text-slate-600";
  const [qrImage, setQrImage] = useState<string>("");
  const [regenLoading, setRegenLoading] = useState(false);
  const [savedForm, setSavedForm] = useState<SettingsForm>(() =>
    createInitialForm(smsSender)
  );
  const [draftForm, setDraftForm] = useState<SettingsForm>(() =>
    createInitialForm(smsSender)
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const dirty = JSON.stringify(draftForm) !== JSON.stringify(savedForm);
  const changed = <K extends keyof SettingsForm>(key: K) =>
    draftForm[key] !== savedForm[key];

  useEffect(() => {
    if (dirty) return;
    const next = createInitialForm(smsSender);
    setSavedForm(next);
    setDraftForm(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smsSender]);

  useEffect(() => {
    if (!saveFeedback) return;
    const t = window.setTimeout(() => setSaveFeedback(null), 2200);
    return () => window.clearTimeout(t);
  }, [saveFeedback]);

  const setField = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
    setDraftForm((prev) => ({ ...prev, [key]: value }));
  };

  const onCancelChanges = () => {
    if (!dirty) return;
    setDraftForm(savedForm);
    setSaveError(null);
    setSaveFeedback("Modifications annulées.");
  };

  const onSaveChanges = async () => {
    if (!dirty) return;
    const sender = draftForm.sender.trim();
    if (!sender) {
      setSaveError("Le nom d’expéditeur SMS est requis.");
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      await Promise.resolve(onSmsSenderChange(sender));
      setSavedForm({ ...draftForm, sender });
      setDraftForm((prev) => ({ ...prev, sender }));
      setSaveFeedback("Paramètres sauvegardés.");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Sauvegarde impossible.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (!qrPublicUrl) {
        setQrImage("");
        return;
      }
      void QRCode.toDataURL(qrPublicUrl, {
        margin: 1,
        width: 260,
        color: { dark: "#0f172a", light: "#ffffff" },
      }).then((src: string) => {
        if (!cancelled) setQrImage(src);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [qrPublicUrl]);

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
          <ProtoBtn
            onClick={onCancelChanges}
            disabled={!dirty || saving}
            className={cn(dirty && "border-amber-300 bg-amber-50 text-amber-900")}
          >
            Annuler
          </ProtoBtn>
          <ProtoBtn
            primary
            onClick={onSaveChanges}
            disabled={!dirty || saving}
            className={cn(
              dirty &&
                "ring-2 ring-blue-300/60 shadow-[0_20px_36px_rgba(47,111,237,0.32)]"
            )}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </ProtoBtn>
        </div>
      </div>
      {dirty && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
          Modifications en cours. Clique sur Enregistrer pour appliquer les changements.
        </p>
      )}
      {saveFeedback && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">
          {saveFeedback}
        </p>
      )}
      {saveError && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
          {saveError}
        </p>
      )}

      <div className="grid grid-cols-[1.2fr_0.8fr] items-start gap-4 max-[1100px]:grid-cols-1">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <h2 className="m-0 text-base font-black text-slate-900">Compte</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
            <div>
              <label className={lbl}>Prénom</label>
              <input
                className={cn(inp, changed("firstName") && "border-blue-400 ring-2 ring-blue-100")}
                value={draftForm.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
                placeholder="Ex : Patrick"
              />
            </div>
            <div>
              <label className={lbl}>Nom</label>
              <input
                className={cn(inp, changed("lastName") && "border-blue-400 ring-2 ring-blue-100")}
                value={draftForm.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
                placeholder="Ex : Azevedo"
              />
            </div>
            <div className="col-span-2 max-[600px]:col-span-1">
              <label className={lbl}>Email</label>
              <input
                className={cn(inp, changed("email") && "border-blue-400 ring-2 ring-blue-100")}
                value={draftForm.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="email@domaine.fr"
              />
            </div>
            <div className="col-span-2 max-[600px]:col-span-1">
              <label className={lbl}>Téléphone</label>
              <input
                className={cn(inp, changed("phone") && "border-blue-400 ring-2 ring-blue-100")}
                value={draftForm.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="06 00 00 00 00"
              />
            </div>
          </div>

          <div className="my-4 h-px bg-slate-300/40" />

          <h2 className="m-0 text-base font-black text-slate-900">Entreprise</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
            <div className="col-span-2">
              <label className={lbl}>Nom de l&apos;entreprise</label>
              <input
                className={cn(
                  inp,
                  changed("companyName") && "border-blue-400 ring-2 ring-blue-100"
                )}
                value={draftForm.companyName}
                onChange={(e) => setField("companyName", e.target.value)}
              />
            </div>
            <div>
              <label className={lbl}>SIRET</label>
              <input
                className={cn(inp, changed("siret") && "border-blue-400 ring-2 ring-blue-100")}
                value={draftForm.siret}
                onChange={(e) => setField("siret", e.target.value)}
              />
            </div>
            <div>
              <label className={lbl}>TVA</label>
              <input
                className={cn(inp, changed("tva") && "border-blue-400 ring-2 ring-blue-100")}
                value={draftForm.tva}
                onChange={(e) => setField("tva", e.target.value)}
              />
            </div>
          </div>

          <div className="my-4 h-px bg-slate-300/40" />

          <h2 className="m-0 text-base font-black text-slate-900">
            Adresse de facturation
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
            <div className="col-span-2">
              <label className={lbl}>Adresse</label>
              <input
                className={cn(inp, changed("address") && "border-blue-400 ring-2 ring-blue-100")}
                value={draftForm.address}
                onChange={(e) => setField("address", e.target.value)}
              />
            </div>
            <div>
              <label className={lbl}>Code postal</label>
              <input
                className={cn(inp, changed("zip") && "border-blue-400 ring-2 ring-blue-100")}
                value={draftForm.zip}
                onChange={(e) => setField("zip", e.target.value)}
              />
            </div>
            <div>
              <label className={lbl}>Ville</label>
              <input
                className={cn(inp, changed("city") && "border-blue-400 ring-2 ring-blue-100")}
                value={draftForm.city}
                onChange={(e) => setField("city", e.target.value)}
              />
            </div>
            <div>
              <label className={lbl}>Pays</label>
              <input
                className={cn(inp, changed("country") && "border-blue-400 ring-2 ring-blue-100")}
                value={draftForm.country}
                onChange={(e) => setField("country", e.target.value)}
              />
            </div>
            <div>
              <label className={lbl}>Contact facturation</label>
              <input
                className={cn(
                  inp,
                  changed("billingContact") && "border-blue-400 ring-2 ring-blue-100"
                )}
                value={draftForm.billingContact}
                onChange={(e) => setField("billingContact", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <h2 className="m-0 text-base font-black text-slate-900">QR code boutique</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Affiche ce QR en boutique pour collecter les contacts depuis un formulaire public.
            </p>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              {qrLoading ? (
                <div className="grid min-h-[220px] place-items-center text-sm font-bold text-slate-500">
                  Génération du QR…
                </div>
              ) : qrError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
                  {qrError}
                </div>
              ) : (
                <div className="grid gap-3">
                  <div className="grid place-items-center rounded-xl bg-white p-3">
                    {qrImage ? (
                      <Image
                        src={qrImage}
                        alt="QR code boutique"
                        width={220}
                        height={220}
                        unoptimized
                        className="h-[220px] w-[220px]"
                      />
                    ) : (
                      <div className="h-[220px] w-[220px] animate-pulse rounded-lg bg-slate-200" />
                    )}
                  </div>
                  <input
                    className={inp}
                    value={qrPublicUrl || ""}
                    readOnly
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <div className="flex flex-wrap gap-2">
                    <ProtoBtn
                      onClick={async () => {
                        if (!qrPublicUrl) return;
                        await navigator.clipboard.writeText(qrPublicUrl);
                      }}
                    >
                      Copier le lien
                    </ProtoBtn>
                    <ProtoBtn
                      onClick={async () => {
                        setRegenLoading(true);
                        try {
                          await onRegenerateQr();
                        } finally {
                          setRegenLoading(false);
                        }
                      }}
                      disabled={regenLoading || qrLoading}
                    >
                      {regenLoading ? "Régénération…" : "Régénérer le QR"}
                    </ProtoBtn>
                  </div>
                </div>
              )}
            </div>
          </div>

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
              <div>
                <label className={lbl}>
                  Nom d&apos;expéditeur SMS (11 car. max)
                </label>
                <input
                  className={cn(inp, changed("sender") && "border-blue-400 ring-2 ring-blue-100")}
                  maxLength={11}
                  value={draftForm.sender}
                  onChange={(e) => setField("sender", e.target.value)}
                  placeholder="BOULANGERIE"
                  autoComplete="off"
                />
                <p className="mt-1.5 text-xs font-bold text-slate-500">
                  Affiché comme expéditeur des campagnes. Modifiable ici à tout
                  moment.
                </p>
              </div>
              <label className="flex items-center gap-2.5 text-sm font-extrabold text-slate-600">
                <input
                  type="checkbox"
                  className="h-[18px] w-[18px]"
                  checked={draftForm.notifyInvoices}
                  onChange={(e) => setField("notifyInvoices", e.target.checked)}
                />
                Recevoir les notifications email (factures, alertes)
              </label>
              <label className="flex items-center gap-2.5 text-sm font-extrabold text-slate-600">
                <input
                  type="checkbox"
                  className="h-[18px] w-[18px]"
                  checked={draftForm.notifySummary}
                  onChange={(e) => setField("notifySummary", e.target.checked)}
                />
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
