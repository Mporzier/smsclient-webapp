"use client";

import { cn } from "@/lib/cn";
import { ProtoBtn } from "@/components/smsclient/ui";
import type { ContactFormSubmitPayload } from "@/lib/supabase/clients";
import { formatContactGroups } from "@/lib/types/contact";
import { isValidFrMobile, normalizeFRPhone } from "@/lib/proto/smsUtils";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

const overlayCls =
  "fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/55 p-6 backdrop-blur-sm";
const modalCard =
  "max-h-[min(82vh,760px)] w-full max-w-[980px] overflow-auto rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.20)]";

export type GroupModalContactRow = {
  id: string;
  name: string;
  phone: string;
  groups: string[];
};

type GroupModalProps = {
  open: boolean;
  onClose: () => void;
  /** Contacts disponibles pour rattachement au nouveau groupe (étape 2). */
  contacts?: GroupModalContactRow[];
  contactsLoading?: boolean;
  onCreated?: (
    name: string,
    desc: string,
    selectedContactIds: string[],
  ) => void | Promise<void>;
};

export function GroupModal({
  open,
  onClose,
  contacts = [],
  contactsLoading = false,
  onCreated,
}: GroupModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [contactQuery, setContactQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filteredContacts = useMemo(() => {
    const q = contactQuery.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => {
      const hay = `${c.name} ${c.phone} ${c.groups.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [contacts, contactQuery]);

  const toggleContact = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const selectAllFiltered = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const c of filteredContacts) {
        next.add(c.id);
      }
      return Array.from(next);
    });
  }, [filteredContacts]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setName("");
      setDesc("");
      setContactQuery("");
      setSelectedIds([]);
      setSaving(false);
      setSaveError(null);
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
                      onChange={(e) => {
                        setName(e.target.value);
                        setSaveError(null);
                      }}
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
              <div className="flex min-h-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="m-0 text-base font-black">Ajouter des contacts</h3>
                    <p className="mt-1 text-xs font-bold text-slate-600">
                      Coche les contacts à rattacher au groupe{" "}
                      <strong className="text-slate-800">{name.trim() || "—"}</strong>. Tu pourras
                      modifier plus tard depuis Contacts.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ProtoBtn
                      className="!h-9 !px-3 !text-[13px]"
                      onClick={selectAllFiltered}
                      disabled={contactsLoading || filteredContacts.length === 0}
                    >
                      Tout sélectionner (liste)
                    </ProtoBtn>
                    <ProtoBtn
                      className="!h-9 !px-3 !text-[13px]"
                      onClick={clearSelection}
                      disabled={selectedIds.length === 0}
                    >
                      Effacer la sélection
                    </ProtoBtn>
                  </div>
                </div>

                <div className="flex h-10 max-w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500 shadow-[0_6px_14px_rgba(15,23,42,0.06)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="11" cy="11" r="7" stroke="#64748b" strokeWidth="2" />
                    <path
                      d="M20 20l-3.3-3.3"
                      stroke="#64748b"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <input
                    className="min-w-0 flex-1 border-none bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                    placeholder="Filtrer par nom, téléphone, groupe actuel…"
                    value={contactQuery}
                    onChange={(e) => setContactQuery(e.target.value)}
                    aria-label="Filtrer les contacts"
                  />
                </div>

                {contactsLoading ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-10 text-center text-sm font-bold text-slate-500">
                    Chargement des contacts…
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm font-bold text-slate-600">
                    Aucun contact enregistré. Ajoute des contacts depuis l’onglet{" "}
                    <strong>Contacts</strong>, puis reviens ici.
                  </div>
                ) : (
                  <div
                    className="max-h-[min(42vh,380px)] overflow-auto rounded-xl border border-slate-200"
                    role="listbox"
                    aria-label="Contacts à rattacher au groupe"
                    aria-multiselectable
                  >
                    <table className="w-full border-separate border-spacing-0 text-left text-[13px]">
                      <thead className="sticky top-0 z-[1] bg-slate-100">
                        <tr>
                          <th className="w-10 border-b border-slate-200 px-2 py-2.5 font-extrabold text-slate-700">
                            <span className="sr-only">Sélection</span>
                          </th>
                          <th className="border-b border-slate-200 px-2 py-2.5 font-extrabold text-slate-700">
                            Contact
                          </th>
                          <th className="border-b border-slate-200 px-2 py-2.5 font-extrabold text-slate-700">
                            Téléphone
                          </th>
                          <th className="hidden border-b border-slate-200 px-2 py-2.5 font-extrabold text-slate-700 sm:table-cell">
                            Groupes actuels
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContacts.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-3 py-8 text-center font-bold text-slate-500"
                            >
                              Aucun résultat pour cette recherche.
                            </td>
                          </tr>
                        ) : (
                          filteredContacts.map((c) => {
                            const checked = selectedIds.includes(c.id);
                            return (
                              <tr
                                key={c.id}
                                className="cursor-pointer border-b border-slate-100 bg-white hover:bg-slate-50/90"
                                onClick={() => toggleContact(c.id)}
                                role="option"
                                aria-selected={checked}
                              >
                                <td className="px-2 py-2.5 align-middle">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#2f6fed] focus:ring-[#2f6fed]"
                                    checked={checked}
                                    onChange={() => toggleContact(c.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label={`Sélectionner ${c.name}`}
                                  />
                                </td>
                                <td className="max-w-[200px] truncate px-2 py-2.5 font-extrabold text-slate-900 sm:max-w-none">
                                  {c.name}
                                </td>
                                <td className="whitespace-nowrap px-2 py-2.5 font-semibold text-slate-700">
                                  {c.phone}
                                </td>
                                <td className="hidden max-w-[min(100%,12rem)] px-2 py-2.5 text-slate-600 sm:table-cell">
                                  <span className="line-clamp-2 text-[12px] font-semibold leading-snug">
                                    {c.groups.length
                                      ? c.groups.join(", ")
                                      : "—"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {!contactsLoading && contacts.length > 0 && (
                  <p className="m-0 text-xs font-bold text-slate-600">
                    {selectedIds.length === 0 ? (
                      <>
                        <strong className="text-slate-900">Aucun</strong> contact sélectionné
                      </>
                    ) : (
                      <>
                        <strong className="text-slate-900">{selectedIds.length}</strong> contact
                        {selectedIds.length > 1 ? "s" : ""} sélectionné
                        {selectedIds.length > 1 ? "s" : ""}
                      </>
                    )}
                    {filteredContacts.length < contacts.length && (
                      <span className="text-slate-500">
                        {" "}
                        · {filteredContacts.length} affiché
                        {filteredContacts.length > 1 ? "s" : ""} sur {contacts.length}
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
              <h3 className="m-0 text-base font-black">Récap</h3>
              <p className="mt-2.5 text-xs font-bold leading-relaxed text-slate-600">
                Groupe : <strong>{name.trim() || "—"}</strong>
                <br />
                Description : <strong>{desc.trim() || "—"}</strong>
                <br />
                Rattachement :{" "}
                <strong>
                  {selectedIds.length === 0
                    ? "aucun contact"
                    : `${selectedIds.length} contact${selectedIds.length > 1 ? "s" : ""}`}
                </strong>
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-[1] flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-[18px] py-3.5">
          <ProtoBtn
            disabled={saving}
            onClick={() => {
              if (step === 1) onClose();
              else setStep(1);
            }}
          >
            Retour
          </ProtoBtn>
          <div className="flex min-w-0 flex-1 flex-col items-end gap-2 sm:flex-row sm:items-center sm:justify-end">
            {saveError && (
              <p className="m-0 max-w-full text-right text-xs font-bold text-rose-600 sm:mr-auto sm:max-w-[min(100%,420px)]">
                {saveError}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
            <ProtoBtn onClick={onClose} disabled={saving}>
              Annuler
            </ProtoBtn>
            {step === 1 ? (
              <ProtoBtn
                primary
                onClick={() => {
                  if (!name.trim()) {
                    setSaveError("Indique un nom de groupe.");
                    return;
                  }
                  setSaveError(null);
                  setStep(2);
                }}
              >
                Continuer
              </ProtoBtn>
            ) : (
              <ProtoBtn
                primary
                disabled={saving}
                onClick={async () => {
                  const n = name.trim();
                  if (!n) {
                    setSaveError("Indique un nom de groupe.");
                    return;
                  }
                  setSaveError(null);
                  setSaving(true);
                  try {
                    await onCreated?.(n, desc.trim(), selectedIds);
                    onClose();
                  } catch (e) {
                    setSaveError(e instanceof Error ? e.message : "Enregistrement impossible.");
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Enregistrement…" : "Créer le groupe"}
              </ProtoBtn>
            )}
            </div>
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
  groups: string[];
  setGroups: Dispatch<SetStateAction<string[]>>;
  groupOptions: string[];
  onCreateGroupRequest: () => void;
  /** Valeurs initiales consentement (édition) */
  consentDefaults?: { optIn: boolean; stop: boolean } | null;
  /** Enregistrement Supabase ; si absent, le bouton final ferme seulement la modale */
  onSaveContact?: (payload: ContactFormSubmitPayload) => Promise<void>;
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
  groups,
  setGroups,
  groupOptions,
  onCreateGroupRequest,
  consentDefaults,
  onSaveContact,
}: ContactModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [optIn, setOptIn] = useState(true);
  const [stop, setStop] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setStep(1);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setSaveError(null);
    setValidationError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setOptIn(consentDefaults?.optIn ?? true);
    setStop(consentDefaults?.stop ?? false);
  }, [open, consentDefaults]);

  useEffect(() => {
    setValidationError(null);
  }, [first, phone]);

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
    const gr = formatContactGroups(groups);
    const st = stop ? "Désinscrit (STOP)" : optIn ? "Opt-in" : "Non opt-in";
    return { name, ph, gr, st };
  }, [first, last, phone, groups, optIn, stop]);

  const toggleContactGroup = useCallback(
    (g: string) => {
      setGroups((prev) =>
        prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
      );
    },
    [setGroups],
  );

  const pv = syncPreview();

  const handleContinue = useCallback(() => {
    if (step === 1) {
      if (!first.trim()) {
        setValidationError("Le prénom est obligatoire.");
        return;
      }
      if (!isValidFrMobile(phone)) {
        setValidationError(
          "Indique un numéro mobile français à 10 chiffres (ex. 06 12 34 56 78).",
        );
        return;
      }
      setValidationError(null);
      setStep(2);
      return;
    }
    setStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
  }, [step, first, phone]);

  const handleFinalSave = useCallback(async () => {
    if (!onSaveContact) {
      onClose();
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      await onSaveContact({
        firstName: first.trim(),
        lastName: last.trim(),
        phoneDisplay: phone,
        groupLabels: groups,
        optIn,
        stop,
      });
      onClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }, [onSaveContact, onClose, first, last, phone, groups, optIn, stop]);

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
                {validationError && (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
                    {validationError}
                  </p>
                )}
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
                  <label className="text-[13px] font-black">Groupes</label>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    Un contact peut appartenir à plusieurs segments.
                  </p>
                  <div className="mt-2.5 max-h-[220px] space-y-2 overflow-auto rounded-[14px] border border-[#dfe6f2] bg-slate-50 p-3">
                    {groupOptions.length === 0 ? (
                      <p className="m-0 text-xs font-bold text-slate-500">
                        Aucun groupe défini — crée-en un ci-dessous.
                      </p>
                    ) : (
                      groupOptions.map((g) => (
                        <label
                          key={g}
                          className="flex cursor-pointer items-center gap-2.5 text-sm font-extrabold text-slate-800"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-[#2f6fed] focus:ring-[#2f6fed]"
                            checked={groups.includes(g)}
                            onChange={() => toggleContactGroup(g)}
                          />
                          {g}
                        </label>
                      ))
                    )}
                  </div>
                  <div className="mt-3">
                    <ProtoBtn
                      className="w-full !justify-center !text-[13px]"
                      onClick={() => {
                        onCreateGroupRequest();
                      }}
                    >
                      + Créer un nouveau groupe…
                    </ProtoBtn>
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
                  <div>Groupes</div>
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
                Groupes : <strong>{pv.gr}</strong>
                <br />
                Statut : <strong>{pv.st}</strong>
              </p>
            </div>
          </div>
        </div>

        {saveError && (
          <div className="border-t border-rose-200 bg-rose-50 px-[18px] py-2.5 text-sm font-bold text-rose-900">
            {saveError}
          </div>
        )}

        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-[18px] py-3.5">
          <ProtoBtn
            disabled={saving}
            onClick={() => {
              if (step === 1) onClose();
              else setStep((prev) => (prev - 1) as 1 | 2 | 3);
            }}
          >
            Retour
          </ProtoBtn>
          <div className="flex gap-2">
            <ProtoBtn disabled={saving} onClick={onClose}>
              Annuler
            </ProtoBtn>
            {step < 3 ? (
              <ProtoBtn primary disabled={saving} onClick={handleContinue}>
                Continuer
              </ProtoBtn>
            ) : (
              <ProtoBtn primary disabled={saving} onClick={() => void handleFinalSave()}>
                {saving
                  ? "Enregistrement…"
                  : mode === "edit"
                    ? "Enregistrer les modifications"
                    : "Enregistrer le contact"}
              </ProtoBtn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
