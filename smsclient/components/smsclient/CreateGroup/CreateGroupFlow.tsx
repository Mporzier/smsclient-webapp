"use client";

import { cn } from "@/lib/cn";
import { ProtoBtn } from "@/components/smsclient/ui";
import {
  fieldBox,
  fieldLabel,
  innerInput,
  innerInp,
} from "@/components/smsclient/flowFieldStyles";

export type CreateGroupFlowProps = {
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

export function CreateGroupFlow({
  step,
  go,
  name,
  setName,
  desc,
  setDesc,
  colorId,
  setColorId,
  onOpenGroupModal,
}: CreateGroupFlowProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[34px] font-extrabold text-slate-900">
            Créer un groupe
          </h1>
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
              Utilisé pour segmenter tes contacts et lancer des campagnes plus
              vite.
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
            {[
              "Liste / segment",
              "Filtrer",
              "Import CSV",
              "Sélection manuelle",
            ].map((t) => (
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
            Groupe :{" "}
            <strong className="text-slate-800">{name.trim() || "—"}</strong>
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
