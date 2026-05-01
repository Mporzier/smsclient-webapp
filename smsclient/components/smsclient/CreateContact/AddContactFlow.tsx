"use client";

import { ProtoBtn } from "@/components/smsclient/ui";
import { formatContactGroups } from "@/lib/types/contact";
import { normalizeFRPhone } from "@/lib/proto/smsUtils";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useMemo } from "react";
import { cn } from "@/lib/cn";
import {
  fieldBox,
  fieldLabel,
  innerInput,
  innerInp,
} from "@/components/smsclient/flowFieldStyles";
import { StepTab } from "./StepTab";

export type AddContactFlowProps = {
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

export function AddContactFlow({
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
}: AddContactFlowProps) {
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
          <h1 className="m-0 text-[34px] font-extrabold text-slate-900">
            Ajouter un contact
          </h1>
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
              <ProtoBtn onClick={() => go("ajouter-contact-1")}>
                Retour
              </ProtoBtn>
              <ProtoBtn primary onClick={() => go("contacts")}>
                Enregistrer le contact
              </ProtoBtn>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
        <StepTab
          active={step === 1}
          num="1"
          label="Infos"
          onClick={() => go("ajouter-contact-1")}
        />
        <StepTab
          active={step === 2}
          num="2"
          label="Vérification"
          onClick={() => go("ajouter-contact-2")}
        />
      </div>

      {step === 1 && (
        <div className="grid grid-cols-2 gap-3.5 max-[900px]:grid-cols-1">
          <div className={fieldBox}>
            <label className={fieldLabel}>
              <span>
                Prénom <span className="text-red-500">*</span>
              </span>
              <span className="text-xs font-extrabold text-slate-500">
                {first.length}/30
              </span>
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
              <span className="text-xs font-extrabold text-slate-500">
                {last.length}/30
              </span>
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
              <span className="text-xs font-extrabold text-slate-500">
                {preview.phoneHint}
              </span>
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
              Astuce : on peut accepter +33… (conversion automatique en
              maquette).
            </p>
          </div>
          <div className={fieldBox}>
            <label className={fieldLabel}>
              <span>Groupes</span>
              <span className="text-xs font-extrabold text-slate-500">
                Optionnel
              </span>
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
              <span className="text-xs font-extrabold text-slate-500">
                Auto
              </span>
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
            Le statut SMS (opt-in, STOP) se mettra à jour après les envois de
            campagnes et est visible dans la colonne « Statut SMS » de la liste.
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
            <h2 className="m-0 text-base font-black">
              Ce que ça fera (prototype)
            </h2>
            <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600">
              • Ajoute une entrée dans la liste Contacts.
              <br />• Le contact pourra être ciblé comme destinataire une fois
              enregistré (flux modale + Supabase).
            </p>
          </div>
        </>
      )}
    </div>
  );
}
