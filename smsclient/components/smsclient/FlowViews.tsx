"use client";

import { cn } from "@/lib/cn";
import { ProtoBtn } from "@/components/smsclient/ui";
import {
  formatInt,
  normalizeFRPhone,
  sanitizeSender,
  smsPartsFor,
  isUnicode,
} from "@/lib/proto/smsUtils";
import { formatContactGroups } from "@/lib/types/contact";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

const fieldBox =
  "rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]";
const fieldLabel = "flex justify-between gap-2 text-[13px] font-black text-slate-900";
const innerInput =
  "mt-2.5 flex h-[46px] items-center gap-2.5 rounded-[14px] border border-[#dfe6f2] bg-slate-50 px-3.5";
const innerInp =
  "w-full border-none bg-transparent text-sm font-extrabold text-slate-900 outline-none";

type StepTabProps = { active: boolean; num: string; label: string; onClick?: () => void };

function StepTab({ active, num, label, onClick }: StepTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-2xl border border-transparent bg-slate-100 px-3 py-2.5 text-[13px] font-extrabold text-slate-700",
        active && "border-slate-200 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]",
      )}
    >
      <span
        className={cn(
          "grid h-[26px] w-[26px] place-items-center rounded-[10px] bg-slate-200 text-xs font-black text-slate-900",
          active &&
            "bg-[#2f6fed] text-white shadow-[0_10px_18px_rgba(47,111,237,0.25)]",
        )}
      >
        {num}
      </span>
      {label}
    </button>
  );
}

/* ——— Ajouter contact (full-page wizard) ——— */

type ACProps = {
  step: 1 | 2;
  go: (h: string) => void;
  first: string;
  setFirst: (v: string) => void;
  last: string;
  setLast: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  groups: string[];
  setGroups: Dispatch<SetStateAction<string[]>>;
  groupOptions: string[];
};

export function AjouterContactFlow({
  step,
  go,
  first,
  setFirst,
  last,
  setLast,
  phone,
  setPhone,
  groups,
  setGroups,
  groupOptions,
}: ACProps) {
  const toggleGroup = useCallback(
    (g: string) => {
      setGroups((prev) =>
        prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
      );
    },
    [setGroups],
  );

  const preview = useMemo(() => {
    const f = first.trim();
    const l = last.trim();
    const name = `${f} ${l}`.trim() || "—";
    const norm = normalizeFRPhone(phone);
    const digits = norm.replace(/[^0-9]/g, "");
    const phoneHint = digits.length === 10 ? "OK" : "Format FR";
    return {
      name,
      phoneDisp: norm.trim() || "—",
      groupDisp: formatContactGroups(groups),
      phoneHint,
    };
  }, [first, last, phone, groups]);

  return (
    <div className="flex min-h-0 flex-col gap-3.5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[34px] font-extrabold text-slate-900">Ajouter un contact</h1>
          <div className="mt-1.5 text-xs font-bold text-slate-600">
            {step === 1 && "Étape 1/2 — Informations"}
            {step === 2 && "Étape 2/2 — Vérification"}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {step === 1 && (
            <>
              <ProtoBtn onClick={() => go("contacts")}>Annuler</ProtoBtn>
              <ProtoBtn primary onClick={() => go("ajouter-contact-2")}>
                Continuer
              </ProtoBtn>
            </>
          )}
          {step === 2 && (
            <>
              <ProtoBtn onClick={() => go("ajouter-contact-1")}>Retour</ProtoBtn>
              <ProtoBtn primary onClick={() => go("contacts")}>
                Enregistrer le contact
              </ProtoBtn>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
        <StepTab active={step === 1} num="1" label="Infos" onClick={() => go("ajouter-contact-1")} />
        <StepTab active={step === 2} num="2" label="Vérification" onClick={() => go("ajouter-contact-2")} />
      </div>

      {step === 1 && (
        <div className="grid grid-cols-2 gap-3.5 max-[900px]:grid-cols-1">
          <div className={fieldBox}>
            <label className={fieldLabel}>
              <span>
                Prénom <span className="text-red-500">*</span>
              </span>
              <span className="text-xs font-extrabold text-slate-500">{first.length}/30</span>
            </label>
            <div className={innerInput}>
              <input
                className={innerInp}
                maxLength={30}
                value={first}
                onChange={(e) => setFirst(e.target.value)}
                placeholder="Ex : Patrick"
              />
            </div>
            <p className="mt-2 text-xs font-bold leading-snug text-slate-500">
              Utilisé pour la personnalisation avec {"{PRENOM}"}.
            </p>
          </div>
          <div className={fieldBox}>
            <label className={fieldLabel}>
              <span>Nom (optionnel)</span>
              <span className="text-xs font-extrabold text-slate-500">{last.length}/30</span>
            </label>
            <div className={innerInput}>
              <input
                className={innerInp}
                maxLength={30}
                value={last}
                onChange={(e) => setLast(e.target.value)}
                placeholder="Ex : Dupont"
              />
            </div>
            <p className="mt-2 text-xs font-bold text-slate-500">Optionnel.</p>
          </div>
          <div className={fieldBox}>
            <label className={fieldLabel}>
              <span>
                Téléphone <span className="text-red-500">*</span>
              </span>
              <span className="text-xs font-extrabold text-slate-500">{preview.phoneHint}</span>
            </label>
            <div className={innerInput}>
              <input
                className={innerInp}
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(normalizeFRPhone(e.target.value))}
                placeholder="Ex : 06 12 34 56 78"
              />
            </div>
            <p className="mt-2 text-xs font-bold leading-snug text-slate-500">
              Astuce : on peut accepter +33… (conversion automatique en maquette).
            </p>
          </div>
          <div className={fieldBox}>
            <label className={fieldLabel}>
              <span>Groupes</span>
              <span className="text-xs font-extrabold text-slate-500">Optionnel</span>
            </label>
            <div className="mt-2.5 max-h-[200px] space-y-2 overflow-auto rounded-[14px] border border-[#dfe6f2] bg-slate-50 p-3">
              {groupOptions.length === 0 ? (
                <p className="m-0 text-xs font-bold text-slate-500">
                  Aucun segment — crée des groupes depuis l&apos;onglet Groupes.
                </p>
              ) : (
                groupOptions.map((g) => (
                  <label
                    key={g}
                    className="flex cursor-pointer items-center gap-2.5 text-sm font-extrabold text-slate-800"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-[#2f6fed]"
                      checked={groups.includes(g)}
                      onChange={() => toggleGroup(g)}
                    />
                    {g}
                  </label>
                ))
              )}
            </div>
            <p className="mt-2 text-xs font-bold text-slate-500">
              Plusieurs segments possibles ; modifiable plus tard.
            </p>
          </div>
          <div className={cn(fieldBox, "col-span-2 max-[900px]:col-span-1")}>
            <label className={fieldLabel}>
              <span>Source</span>
              <span className="text-xs font-extrabold text-slate-500">Auto</span>
            </label>
            <div className={innerInput}>
              <input className={innerInp} readOnly value="Ajout manuel" />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <>
          <p className="text-sm font-bold text-slate-600">
            Le statut SMS (opt-in, STOP) se mettra à jour après les envois de campagnes et est
            visible dans la colonne « Statut SMS » de la liste.
          </p>
          <div className="grid grid-cols-2 gap-3.5 max-[600px]:grid-cols-1">
            {[
              ["Nom", preview.name],
              ["Téléphone", preview.phoneDisp],
              ["Groupes", preview.groupDisp],
              ["Source", "Ajout manuel"],
            ].map(([k, v]) => (
              <div key={String(k)} className={fieldBox}>
                <div className="text-xs font-extrabold text-slate-500">{k}</div>
                <div className="mt-1.5 font-black text-slate-900">{v}</div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <h2 className="m-0 text-base font-black">Ce que ça fera (prototype)</h2>
            <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600">
              • Ajoute une entrée dans la liste Contacts.
              <br />
              • Le contact pourra être ciblé comme destinataire une fois enregistré (flux modale
              + Supabase).
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/* ——— Créer groupe (full page) ——— */

type CGProps = {
  step: 1 | 2;
  go: (h: string) => void;
  name: string;
  setName: (v: string) => void;
  desc: string;
  setDesc: (v: string) => void;
  colorId: string;
  setColorId: (v: string) => void;
  onOpenGroupModal: () => void;
};

const CHIP_COLORS = [
  { id: "blue", bg: "bg-blue-500" },
  { id: "violet", bg: "bg-violet-500" },
  { id: "emerald", bg: "bg-emerald-500" },
  { id: "amber", bg: "bg-amber-500" },
];

export function CreerGroupeFlow({
  step,
  go,
  name,
  setName,
  desc,
  setDesc,
  colorId,
  setColorId,
  onOpenGroupModal,
}: CGProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[34px] font-extrabold text-slate-900">Créer un groupe</h1>
          <div className="mt-1.5 text-xs font-bold text-slate-600">
            {step === 1 ? "Étape 1/2 — Informations" : "Étape 2/2 — Contacts"}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {step === 1 && (
            <>
              <ProtoBtn onClick={() => go("groupes")}>Annuler</ProtoBtn>
              <ProtoBtn primary onClick={() => go("creer-groupe-2")}>
                Continuer
              </ProtoBtn>
            </>
          )}
          {step === 2 && (
            <>
              <ProtoBtn
                onClick={() => {
                  onOpenGroupModal();
                }}
              >
                Retour
              </ProtoBtn>
              <ProtoBtn primary onClick={() => go("groupes")}>
                Créer le groupe
              </ProtoBtn>
            </>
          )}
        </div>
      </div>

      {step === 1 && (
        <div className="grid max-w-3xl grid-cols-1 gap-3.5">
          <div className={fieldBox}>
            <label className={fieldLabel}>
              <span>
                Nom du groupe <span className="text-red-500">*</span>
              </span>
              <span className="text-xs text-slate-500">{name.length}/40</span>
            </label>
            <div className={innerInput}>
              <input
                className={innerInp}
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex : Clients VIP"
              />
            </div>
            <p className="mt-2 text-xs font-bold text-slate-500">
              Utilisé pour segmenter tes contacts et lancer des campagnes plus vite.
            </p>
          </div>
          <div className={fieldBox}>
            <label className={fieldLabel}>
              <span>Description (optionnel)</span>
              <span className="text-xs text-slate-500">{desc.length}/120</span>
            </label>
            <div className="mt-2.5 flex min-h-[120px] min-w-0 items-start gap-2.5 rounded-[14px] border border-[#dfe6f2] bg-slate-50 px-3.5 py-2.5">
              <textarea
                className="min-h-[96px] w-full min-w-0 resize-y border-none bg-transparent text-sm font-extrabold leading-relaxed text-slate-900 outline-none placeholder:text-slate-400"
                maxLength={120}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={4}
                placeholder="Ex : Clients qui achètent au moins 1 fois par mois. (Entrée = nouvelle ligne.)"
              />
            </div>
          </div>
          <div className="chips flex flex-wrap gap-2.5">
            {CHIP_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColorId(c.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-black text-slate-700 shadow-[0_10px_22px_rgba(15,23,42,0.08)]",
                  colorId === c.id &&
                    "border-blue-200 shadow-[0_16px_26px_rgba(47,111,237,0.12)]",
                )}
              >
                <span
                  className={cn(
                    "h-3.5 w-3.5 rounded-md shadow-[inset_0_0_0_2px_rgba(15,23,42,0.06)]",
                    c.bg,
                  )}
                />
                Couleur
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <h2 className="m-0 text-base font-black">Ajouter des contacts</h2>
          <p className="mt-1.5 text-xs font-bold leading-relaxed text-slate-600">
            (Design prototype) Choisis ta source :
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {["Liste / segment", "Filtrer", "Import CSV", "Sélection manuelle"].map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-2 text-xs font-extrabold"
              >
                <span className="h-2 w-2 rounded-full bg-[#2f6fed]" />
                {t}
              </span>
            ))}
          </div>
          <p className="mt-3 min-w-0 break-words text-xs font-bold text-slate-500">
            Groupe : <strong className="text-slate-800">{name.trim() || "—"}</strong>
            <br />
            <span className="inline-block min-w-0 max-w-full">
              Description :{" "}
              <strong className="whitespace-pre-wrap break-words text-slate-800">
                {desc.trim() || "—"}
              </strong>
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

/* ——— Campagne wizard ——— */

type CampProps = {
  step: 1 | 2 | 3 | 4 | 5;
  go: (h: string) => void;
  title: string;
  setTitle: (v: string) => void;
  /** Libellé expéditeur (préférences compte), affiché en aperçu uniquement. */
  sender: string;
  sms: string;
  setSms: (v: string) => void;
  sendMode: "now" | "sched";
  setSendMode: (v: "now" | "sched") => void;
  aiOpen: boolean;
  setAiOpen: (v: boolean) => void;
  /** Nombre de contacts éligibles (opt-in, pas STOP) — cohérent avec la liste enregistrée. */
  recipientCount: number;
  /** Étape 5 : enregistrement en base puis retour liste. */
  onConfirmCampaign?: () => void | Promise<void>;
};

const AI_SUGGESTIONS = [
  {
    msg: "-10% ce week-end pour les VIP : {PRENOM}, passe en boutique avec ce SMS.",
    mini: "Promo courte",
  },
  {
    msg: "Bonjour {PRENOM}, ton panier t’attend : https://smsclient.fr",
    mini: "Relance e-commerce",
  },
  {
    msg: "🎂 Joyeux anniversaire {PRENOM} ! Un cadeau t’attend en caisse.",
    mini: "Anniversaire",
  },
];

export function CampagneWizard({
  step,
  go,
  title,
  setTitle,
  sender,
  sms,
  setSms,
  sendMode,
  setSendMode,
  aiOpen,
  setAiOpen,
  recipientCount,
  onConfirmCampaign,
}: CampProps) {
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const unicode = isUnicode(sms);
  const parts = smsPartsFor(sms);
  const len = [...sms].length;
  const recipients = Math.max(0, recipientCount);
  const totalCredits = parts * recipients;

  const displaySender = sanitizeSender(sender).trim() || "BOULANGERIE";
  const displayTitle = title.trim() || "Promo Janvier - VIP";

  useEffect(() => {
    if (step !== 5) setConfirmError(null);
  }, [step]);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[34px] font-extrabold text-slate-900">Nouvelle campagne</h1>
          <div className="mt-1 text-xs font-bold text-slate-600">
            Étape {step}/5 —{" "}
            {["Infos", "Destinataires", "Message", "Prévisualisation", "Envoi"][step - 1]}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {step === 1 && (
            <>
              <ProtoBtn onClick={() => go("campagnes")}>Annuler</ProtoBtn>
              <ProtoBtn primary onClick={() => go("nouvelle-campagne-2")}>
                Continuer
              </ProtoBtn>
            </>
          )}
          {step === 2 && (
            <>
              <ProtoBtn onClick={() => go("nouvelle-campagne-1")}>Retour</ProtoBtn>
              <ProtoBtn primary onClick={() => go("nouvelle-campagne-3")}>
                Continuer
              </ProtoBtn>
            </>
          )}
          {step === 3 && (
            <>
              <ProtoBtn onClick={() => go("nouvelle-campagne-2")}>Retour</ProtoBtn>
              <ProtoBtn primary onClick={() => go("nouvelle-campagne-4")}>
                Continuer
              </ProtoBtn>
            </>
          )}
          {step === 4 && (
            <>
              <ProtoBtn onClick={() => go("nouvelle-campagne-3")}>Retour</ProtoBtn>
              <ProtoBtn onClick={() => go("nouvelle-campagne-5")}>Envoyer maintenant</ProtoBtn>
              <ProtoBtn primary onClick={() => go("nouvelle-campagne-5")}>
                Continuer
              </ProtoBtn>
            </>
          )}
          {step === 5 && (
            <>
              <ProtoBtn onClick={() => go("nouvelle-campagne-4")} disabled={confirmLoading}>
                Retour
              </ProtoBtn>
              <ProtoBtn
                primary
                disabled={confirmLoading}
                onClick={async () => {
                  if (!onConfirmCampaign) {
                    go("campagnes");
                    return;
                  }
                  setConfirmError(null);
                  setConfirmLoading(true);
                  try {
                    await onConfirmCampaign();
                    go("campagnes");
                  } catch (e) {
                    setConfirmError(
                      e instanceof Error ? e.message : "Enregistrement impossible.",
                    );
                  } finally {
                    setConfirmLoading(false);
                  }
                }}
              >
                {confirmLoading ? "Enregistrement…" : "Confirmer l&apos;envoi"}
              </ProtoBtn>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            "nouvelle-campagne-1",
            "nouvelle-campagne-2",
            "nouvelle-campagne-3",
            "nouvelle-campagne-4",
            "nouvelle-campagne-5",
          ] as const
        ).map((h, i) => (
          <StepTab
            key={h}
            active={step === i + 1}
            num={String(i + 1)}
            label={["Infos", "Dest.", "SMS", "Aperçu", "Envoi"][i]}
            onClick={() => go(h)}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="grid max-w-3xl grid-cols-1 gap-3">
          <div className={fieldBox}>
            <label className={fieldLabel}>
              <span>Titre interne</span>
              <span className="text-xs text-slate-500">{Math.min(title.length, 60)}/60</span>
            </label>
            <div className={innerInput}>
              <input
                className={innerInp}
                maxLength={60}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-500">
            L&apos;expéditeur affiché sur les SMS se configure dans{" "}
            <strong>Paramètres</strong> → Préférences.
          </p>
        </div>
      )}

      {step === 2 && (
        <div className={fieldBox}>
          <h2 className="m-0 text-base font-black">Destinataires</h2>
          <p className="mt-2 text-sm font-bold text-slate-600">
            {recipients.toLocaleString("fr-FR")} contact
            {recipients > 1 ? "s" : ""} éligible
            {recipients > 1 ? "s" : ""} (opt-in SMS, sans STOP), d&apos;après ta base
            actuelle.
          </p>
          {recipients === 0 && (
            <p className="mt-2 text-sm font-extrabold text-amber-800">
              Aucun contact éligible : ajoute des contacts avec opt-in ou retire STOP avant
              d&apos;envoyer.
            </p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="grid grid-cols-[1.3fr_0.7fr] gap-3.5 max-[1100px]:grid-cols-1">
          <div className="space-y-3">
            <div className={fieldBox}>
              <label className={fieldLabel}>
                <span>Message SMS</span>
                <span className="text-xs text-slate-500">{len} car.</span>
              </label>
              <textarea
                className="mt-2 min-h-[140px] w-full resize-none rounded-2xl border border-[#dfe6f2] bg-slate-50 p-3.5 text-sm font-extrabold text-slate-900 outline-none"
                value={sms}
                onChange={(e) => setSms(e.target.value)}
              />
              <div className="mt-2.5 flex flex-wrap gap-2">
                <ProtoBtn
                  className="h-9 px-3 text-xs"
                  onClick={() => setSms(sms + "🎉")}
                >
                  Emoji
                </ProtoBtn>
                <ProtoBtn
                  className="h-9 px-3 text-xs"
                  onClick={() => setSms(`${sms} https://smsclient.fr`)}
                >
                  Lien
                </ProtoBtn>
                <ProtoBtn
                  className="h-9 px-3 text-xs"
                  onClick={() => setSms(`${sms}{PRENOM}`)}
                >
                  {"{PRENOM}"}
                </ProtoBtn>
                <ProtoBtn
                  className="h-9 px-3 text-xs"
                  onClick={() => setSms(`${sms}{NOM}`)}
                >
                  {"{NOM}"}
                </ProtoBtn>
                <ProtoBtn
                  className="h-9 px-3 text-xs"
                  onClick={() => setAiOpen(true)}
                >
                  Suggestions IA
                </ProtoBtn>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                <span className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5">
                  Encodage : {unicode ? "Unicode" : "GSM-7"}
                </span>
                <span className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5">
                  Segments : {parts}
                </span>
                <span className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5">
                  Crédits estimés : {formatInt(totalCredits)}
                </span>
              </div>
            </div>
            {aiOpen && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between border-b border-slate-200 px-3.5 py-3">
                  <h3 className="m-0 text-sm font-black">Suggestions IA</h3>
                  <button
                    type="button"
                    className="text-sm font-black text-slate-600"
                    onClick={() => setAiOpen(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 p-3 max-[900px]:grid-cols-1">
                  {AI_SUGGESTIONS.map((a) => (
                    <div
                      key={a.mini}
                      className="flex min-h-[150px] flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
                    >
                      <p className="text-[13px] font-extrabold leading-snug text-slate-900">{a.msg}</p>
                      <span className="text-xs font-extrabold text-slate-500">{a.mini}</span>
                      <ProtoBtn
                        className="mt-auto h-9 text-xs"
                        onClick={() => {
                          setSms(a.msg);
                          setAiOpen(false);
                        }}
                      >
                        Utiliser
                      </ProtoBtn>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="mx-auto max-w-[360px] rounded-2xl border border-[#dfe6f2] bg-slate-50 p-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-[13px] font-extrabold leading-snug text-slate-900 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                {sms || "—"}
              </div>
              <div className="mt-2 text-center text-xs font-extrabold text-slate-500">
                {displaySender}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="grid grid-cols-2 gap-3.5 max-[900px]:grid-cols-1">
          <div className={fieldBox}>
            <h2 className="m-0 text-base font-black">Prévisualisation</h2>
            <p className="mt-3 text-sm font-bold text-slate-600">
              Expéditeur : <strong>{displaySender}</strong>
            </p>
            <p className="mt-2 text-sm font-bold text-slate-600">
              Titre : <strong>{displayTitle}</strong>
            </p>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-extrabold">
              {sms || "—"}
            </div>
            <p className="mt-2 text-xs font-bold text-slate-500">
              {len} car. · {unicode ? "Unicode" : "GSM-7"} · {parts} seg. · Total{" "}
              {formatInt(totalCredits)} crédits
            </p>
          </div>
          <div className={fieldBox}>
            <h2 className="m-0 text-base font-black">Récap</h2>
            <p className="mt-3 text-sm font-bold">Destinataires : {recipients}</p>
            <p className="mt-2 text-sm font-bold">Coût estimé : {formatInt(totalCredits)} crédits</p>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="max-w-xl space-y-3">
          {confirmError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
              {confirmError}
            </div>
          )}
          <div className={fieldBox}>
            <h2 className="m-0 text-base font-black">Mode d&apos;envoi</h2>
            <div className="mt-3 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setSendMode("now")}
                className={cn(
                  "flex min-w-[220px] flex-1 cursor-pointer items-start gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-[0_10px_22px_rgba(15,23,42,0.08)]",
                  sendMode === "now" && "ring-2 ring-[#2f6fed]",
                )}
              >
                <span className="mt-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-[#2f6fed]">
                  {sendMode === "now" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2f6fed]" />
                  )}
                </span>
                <span>
                  <span className="block font-black">Immédiat</span>
                  <span className="mt-1 block text-xs font-bold text-slate-500">
                    Envoi dès validation
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSendMode("sched")}
                className={cn(
                  "flex min-w-[220px] flex-1 cursor-pointer items-start gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-[0_10px_22px_rgba(15,23,42,0.08)]",
                  sendMode === "sched" && "ring-2 ring-[#2f6fed]",
                )}
              >
                <span className="mt-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-[#2f6fed]">
                  {sendMode === "sched" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2f6fed]" />
                  )}
                </span>
                <span>
                  <span className="block font-black">Programmé</span>
                  <span className="mt-1 block text-xs font-bold text-slate-500">
                    Choisir date et heure (maquette)
                  </span>
                </span>
              </button>
            </div>
          </div>
          <div className={fieldBox}>
            <p className="text-sm font-bold text-slate-600">
              Campagne : <strong>{displayTitle}</strong> — Expéditeur :{" "}
              <strong>{displaySender}</strong>
            </p>
            <p className="mt-2 text-sm font-bold">
              Total crédits : {formatInt(totalCredits)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
