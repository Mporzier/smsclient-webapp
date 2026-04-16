"use client";

import { cn } from "@/lib/cn";
import { ProtoBtn } from "@/components/smsclient/ui";
import { normalizeFRPhone } from "@/lib/proto/smsUtils";
import { useCallback, useEffect, useState } from "react";

const overlayCls =
  "fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/55 p-6 backdrop-blur-sm";
const modalCard =
  "max-h-[min(82vh,760px)] w-full max-w-[980px] overflow-auto rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.20)]";

type GroupModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string, desc: string) => void;
};

export function GroupModal({ open, onClose, onCreated }: GroupModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    if (!open) {
      setStep(1);
      setName("");
      setDesc("");
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

  if (!open) return null;

  return (
    <div
      className={overlayCls}
      role="dialog"
      aria-modal
      aria-label="Créer un groupe"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={modalCard}>
        <div className="sticky top-0 z-[1] flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-[18px] py-4">
          <div>
            <div className="text-lg font-black text-slate-900">Créer un groupe</div>
            <div className="text-xs font-bold text-slate-500">
              {step === 1 ? "Étape 1/2 — Informations" : "Étape 2/2 — Contacts"}
            </div>
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-lg font-black shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
            aria-label="Fermer"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="bg-slate-50 p-[18px]">
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                "flex items-center gap-2 rounded-2xl border px-3 py-2 text-[13px] font-extrabold",
                step === 1
                  ? "border-slate-200 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
                  : "border-transparent bg-slate-100 text-slate-700",
              )}
            >
              <span className="grid h-[26px] w-[26px] place-items-center rounded-[10px] bg-[#2f6fed] text-xs font-black text-white">
                1
              </span>
              Infos
            </span>
            <span
              className={cn(
                "flex items-center gap-2 rounded-2xl border px-3 py-2 text-[13px] font-extrabold",
                step === 2
                  ? "border-slate-200 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
                  : "border-transparent bg-slate-100 text-slate-700",
              )}
            >
              <span
                className={cn(
                  "grid h-[26px] w-[26px] place-items-center rounded-[10px] text-xs font-black",
                  step === 2 ? "bg-[#2f6fed] text-white" : "bg-slate-200 text-slate-900",
                )}
              >
                2
              </span>
              Contacts
            </span>
          </div>

          <div className="mt-3.5 grid grid-cols-[1.15fr_0.85fr] gap-3.5 max-[980px]:grid-cols-1">
            {step === 1 && (
              <div className="space-y-3.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                  <label className="flex justify-between text-[13px] font-black">
                    <span>
                      Nom du groupe <span className="text-red-500">*</span>
                    </span>
                    <span className="text-xs text-slate-500">{name.length}/40</span>
                  </label>
                  <div className="mt-2.5 flex h-[46px] items-center rounded-[14px] border border-[#dfe6f2] bg-slate-50 px-3.5">
                    <input
                      className="w-full border-none bg-transparent text-sm font-extrabold outline-none"
                      maxLength={40}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex : Clients VIP"
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                  <label className="flex justify-between text-[13px] font-black">
                    <span>Description (optionnel)</span>
                    <span className="text-xs text-slate-500">{desc.length}/120</span>
                  </label>
                  <div className="mt-2.5 flex h-[46px] items-center rounded-[14px] border border-[#dfe6f2] bg-slate-50 px-3.5">
                    <input
                      className="w-full border-none bg-transparent text-sm font-extrabold outline-none"
                      maxLength={120}
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                <h3 className="m-0 text-base font-black">Ajouter des contacts</h3>
                <p className="mt-2 text-xs font-bold text-slate-600">
                  (Design prototype) Choisis ta source — tableau de sélection à venir.
                </p>
              </div>
            )}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
              <h3 className="m-0 text-base font-black">Récap</h3>
              <p className="mt-2.5 text-xs font-bold leading-relaxed text-slate-600">
                Groupe : <strong>{name.trim() || "—"}</strong>
                <br />
                Description : <strong>{desc.trim() || "—"}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-[1] flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-[18px] py-3.5">
          <ProtoBtn
            onClick={() => {
              if (step === 1) onClose();
              else setStep(1);
            }}
          >
            Retour
          </ProtoBtn>
          <div className="flex flex-wrap gap-2">
            <ProtoBtn onClick={onClose}>Annuler</ProtoBtn>
            {step === 1 ? (
              <ProtoBtn primary onClick={() => setStep(2)}>
                Continuer
              </ProtoBtn>
            ) : (
              <ProtoBtn
                primary
                onClick={() => {
                  onCreated?.(name.trim(), desc.trim());
                  onClose();
                }}
              >
                Créer le groupe
              </ProtoBtn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const PACKS = [
  { pack: "Starter", credits: "500", price: "39", badge: "Idéal pour tester", best: false },
  {
    pack: "Business",
    credits: "2 000",
    price: "129",
    badge: "Le plus populaire",
    best: true,
  },
  { pack: "Pro", credits: "5 000", price: "299", badge: "Meilleur ratio", best: false },
] as const;

type CreditsModalProps = {
  open: boolean;
  onClose: () => void;
  onBought?: () => void;
};

export function CreditsModal({ open, onClose, onBought }: CreditsModalProps) {
  const [sel, setSel] = useState<(typeof PACKS)[number] | null>(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!open) setSel(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleBuy = useCallback(() => {
    if (!sel) return;
    setBuying(true);
    setTimeout(() => {
      setBuying(false);
      onBought?.();
      onClose();
    }, 900);
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
            <div className="text-lg font-black text-slate-900">Ajouter des crédits</div>
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
            ✕
          </button>
        </div>

        <div className="bg-slate-50 p-[18px]">
          <div className="grid grid-cols-3 gap-3.5 max-[900px]:grid-cols-1">
            {PACKS.map((p) => (
              <button
                key={p.pack}
                type="button"
                onClick={() => setSel(p)}
                className={cn(
                  "cursor-pointer rounded-[18px] border border-slate-300/50 bg-white p-3.5 text-left transition hover:-translate-y-px hover:shadow-[0_16px_34px_rgba(15,23,42,0.10)]",
                  sel?.pack === p.pack &&
                    "border-blue-500 shadow-[0_18px_40px_rgba(59,130,246,0.18)]",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-lg font-black">{p.pack}</div>
                  <span
                    className={cn(
                      "whitespace-nowrap rounded-full border border-slate-300/60 bg-slate-200/70 px-2.5 py-1.5 text-xs font-black text-slate-800",
                      p.best && "border-blue-300/70 bg-blue-500/10 text-blue-800",
                    )}
                  >
                    {p.badge}
                  </span>
                </div>
                <div className="mt-3.5 flex items-baseline gap-2">
                  <span className="text-[34px] font-black leading-none tracking-tight">
                    {p.credits}
                  </span>
                  <span className="font-black text-slate-600">crédits</span>
                </div>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className="text-lg font-black">{p.price} €</span>
                  <span className="text-xs font-extrabold text-slate-500">≈ {p.credits} SMS</span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 rounded-[18px] border border-slate-300/40 bg-slate-50/80 p-3.5">
            <div>
              <div className="font-black">Récap</div>
              <div className="mt-2 flex justify-between gap-3 text-sm font-extrabold text-slate-600">
                <span>Pack</span>
                <strong className="text-slate-900">{sel?.pack ?? "—"}</strong>
              </div>
              <div className="mt-1 flex justify-between gap-3 text-sm font-extrabold text-slate-600">
                <span>Crédits</span>
                <strong className="text-slate-900">
                  {sel ? `${sel.credits} crédits` : "—"}
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

type ContactModalProps = {
  open: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  first: string;
  setFirst: (v: string) => void;
  last: string;
  setLast: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  group: string;
  setGroup: (v: string) => void;
  groupOptions: string[];
  onCreateGroupRequest: () => void;
};

export function ContactModal({
  open,
  onClose,
  mode,
  first,
  setFirst,
  last,
  setLast,
  phone,
  setPhone,
  group,
  setGroup,
  groupOptions,
  onCreateGroupRequest,
}: ContactModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [optIn, setOptIn] = useState(true);
  const [stop, setStop] = useState(false);

  useEffect(() => {
    if (!open) setStep(1);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const syncPreview = useCallback(() => {
    const name = `${first.trim()} ${last.trim()}`.trim() || "—";
    const ph = normalizeFRPhone(phone).trim() || "—";
    const gr = group || "Non classé";
    const st = stop ? "Désinscrit (STOP)" : optIn ? "Opt-in" : "Non opt-in";
    return { name, ph, gr, st };
  }, [first, last, phone, group, optIn, stop]);

  const pv = syncPreview();

  if (!open) return null;

  return (
    <div
      className={overlayCls}
      role="dialog"
      aria-modal
      aria-label="Ajouter un contact"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cn(modalCard, "max-w-[980px]")}>
        <div className="sticky top-0 z-[1] flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-[18px] py-4">
          <div>
            <div className="text-lg font-black text-slate-900">
              {mode === "edit" ? "Modifier le contact" : "Ajouter un contact"}
            </div>
            <div className="text-xs font-bold text-slate-500">
              {step === 1 && "Étape 1/3 — Informations"}
              {step === 2 && "Étape 2/3 — Consentement"}
              {step === 3 && "Étape 3/3 — Récap"}
            </div>
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-lg font-black shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
            aria-label="Fermer"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="bg-slate-50 p-[18px]">
          <div className="flex flex-wrap gap-2">
            {([1, 2, 3] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStep(s)}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border px-3 py-2 text-[13px] font-extrabold",
                  step === s
                    ? "border-slate-200 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
                    : "border-transparent bg-slate-100 text-slate-700",
                )}
              >
                <span
                  className={cn(
                    "grid h-[26px] w-[26px] place-items-center rounded-[10px] text-xs font-black",
                    step === s ? "bg-[#2f6fed] text-white" : "bg-slate-200",
                  )}
                >
                  {s}
                </span>
                {s === 1 ? "Infos" : s === 2 ? "Consentement" : "Récap"}
              </button>
            ))}
          </div>

          <div className="mt-3.5 grid grid-cols-[1.1fr_0.9fr] gap-3.5 max-[980px]:grid-cols-1">
            {step === 1 && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                  <label className="flex justify-between text-[13px] font-black">
                    <span>
                      Prénom <span className="text-red-500">*</span>
                    </span>
                    <span className="text-xs text-slate-500">{first.length}/30</span>
                  </label>
                  <div className="mt-2.5 flex h-11 items-center rounded-[14px] border border-[#dfe6f2] bg-slate-50 px-3.5">
                    <input
                      className="w-full border-none bg-transparent text-sm font-extrabold outline-none"
                      maxLength={30}
                      value={first}
                      onChange={(e) => setFirst(e.target.value)}
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                  <label className="flex justify-between text-[13px] font-black">
                    <span>Nom (optionnel)</span>
                    <span className="text-xs text-slate-500">{last.length}/30</span>
                  </label>
                  <div className="mt-2.5 flex h-11 items-center rounded-[14px] border border-[#dfe6f2] bg-slate-50 px-3.5">
                    <input
                      className="w-full border-none bg-transparent text-sm font-extrabold outline-none"
                      maxLength={30}
                      value={last}
                      onChange={(e) => setLast(e.target.value)}
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                  <label className="flex justify-between text-[13px] font-black">
                    <span>
                      Téléphone <span className="text-red-500">*</span>
                    </span>
                    <span className="text-xs text-slate-500">
                      {normalizeFRPhone(phone).replace(/[^0-9]/g, "").length === 10
                        ? "OK"
                        : "Format FR"}
                    </span>
                  </label>
                  <div className="mt-2.5 flex h-11 items-center rounded-[14px] border border-[#dfe6f2] bg-slate-50 px-3.5">
                    <input
                      className="w-full border-none bg-transparent text-sm font-extrabold outline-none"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(normalizeFRPhone(e.target.value))}
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                  <label className="text-[13px] font-black">Groupe</label>
                  <div className="mt-2.5 flex h-11 items-center rounded-[14px] border border-[#dfe6f2] bg-slate-50 px-3">
                    <select
                      className="w-full cursor-pointer appearance-none border-none bg-transparent text-sm font-extrabold outline-none"
                      value={group}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "__create__") {
                          onCreateGroupRequest();
                          return;
                        }
                        setGroup(v);
                      }}
                    >
                      <option value="">Non classé</option>
                      <option value="__create__">+ Créer un nouveau groupe…</option>
                      {groupOptions.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                <h3 className="m-0 text-base font-black">Consentement marketing</h3>
                <label className="mt-3 flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={optIn}
                    onChange={(e) => setOptIn(e.target.checked)}
                  />
                  <span className="text-sm font-bold text-slate-700">✅ Opt-in SMS</span>
                </label>
                <label className="mt-2 flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={stop}
                    onChange={(e) => setStop(e.target.checked)}
                  />
                  <span className="text-sm font-bold text-slate-700">STOP / désinscrit</span>
                </label>
              </div>
            )}
            {step === 3 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                <h3 className="m-0 text-base font-black">Récapitulatif</h3>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold">
                  <div>Nom</div>
                  <div>{pv.name}</div>
                  <div>Téléphone</div>
                  <div>{pv.ph}</div>
                  <div>Groupe</div>
                  <div>{pv.gr}</div>
                  <div>Statut</div>
                  <div>{pv.st}</div>
                </div>
              </div>
            )}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
              <h3 className="m-0 text-base font-black">Aperçu</h3>
              <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600">
                Contact : <strong>{pv.name}</strong>
                <br />
                Téléphone : <strong>{pv.ph}</strong>
                <br />
                Groupe : <strong>{pv.gr}</strong>
                <br />
                Statut : <strong>{pv.st}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-[18px] py-3.5">
          <ProtoBtn
            onClick={() => {
              if (step === 1) onClose();
              else setStep((prev) => (prev - 1) as 1 | 2 | 3);
            }}
          >
            Retour
          </ProtoBtn>
          <div className="flex gap-2">
            <ProtoBtn onClick={onClose}>Annuler</ProtoBtn>
            {step < 3 ? (
              <ProtoBtn
                primary
                onClick={() =>
                  setStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev))
                }
              >
                Continuer
              </ProtoBtn>
            ) : (
              <ProtoBtn primary onClick={onClose}>
                {mode === "edit" ? "Enregistrer les modifications" : "Enregistrer le contact"}
              </ProtoBtn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
