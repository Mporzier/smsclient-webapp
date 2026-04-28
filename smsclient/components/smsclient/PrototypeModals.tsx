"use client";

import { cn } from "@/lib/cn";
import { ProtoBtn } from "@/components/smsclient/ui";
import type { ContactFormSubmitPayload } from "@/lib/supabase/clients";
import type { CampaignRowData, SmsCampaignStatus } from "@/lib/types/campaign";
import type { GroupRowData } from "@/lib/types/group";
import { formatContactGroups } from "@/lib/types/contact";
import { isValidFrMobile, normalizeFRPhone } from "@/lib/proto/smsUtils";
import type { Dispatch, SetStateAction } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const overlayCls =
  "fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/55 p-6 backdrop-blur-sm";
const modalCard =
  "max-h-[min(82vh,760px)] w-full max-w-[980px] overflow-auto rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.20)]";

function campaignStatusLabel(status: SmsCampaignStatus): string {
  switch (status) {
    case "sent":
      return "Envoyée";
    case "scheduled":
      return "Programmée";
    case "draft":
      return "Brouillon";
    case "failed":
      return "Échec";
    case "cancelled":
      return "Annulée";
    default:
      return status;
  }
}

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
  const selectAllHeaderRef = useRef<HTMLInputElement>(null);

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

  const allFilteredSelected = useMemo(
    () =>
      filteredContacts.length > 0 &&
      filteredContacts.every((c) => selectedIds.includes(c.id)),
    [filteredContacts, selectedIds],
  );

  const toggleSelectAllFiltered = useCallback(() => {
    if (filteredContacts.length === 0) return;
    setSelectedIds((prev) => {
      const allIn = filteredContacts.every((c) => prev.includes(c.id));
      if (allIn) {
        const idSet = new Set(filteredContacts.map((c) => c.id));
        return prev.filter((id) => !idSet.has(id));
      }
      const next = new Set(prev);
      for (const c of filteredContacts) {
        next.add(c.id);
      }
      return Array.from(next);
    });
  }, [filteredContacts]);

  useEffect(() => {
    const el = selectAllHeaderRef.current;
    if (!el) return;
    const some = filteredContacts.some((c) => selectedIds.includes(c.id));
    el.indeterminate = some && !allFilteredSelected;
  }, [filteredContacts, selectedIds, allFilteredSelected]);

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

          <div className="mt-3.5 grid min-w-0 grid-cols-[1.15fr_0.85fr] gap-3.5 max-[980px]:grid-cols-1 [&>div]:min-w-0">
            {step === 1 && (
              <div className="min-w-0 space-y-3.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                  <label className="flex justify-between text-[13px] font-black">
                    <span>
                      Nom du groupe <span className="text-red-500">*</span>
                    </span>
                    <span className="text-xs text-slate-500">{name.length}/40</span>
                  </label>
                  <div className="mt-2.5 flex h-[46px] min-w-0 items-center rounded-[14px] border border-[#dfe6f2] bg-slate-50 px-3.5">
                    <input
                      className="min-w-0 w-full border-none bg-transparent text-sm font-extrabold outline-none"
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
                  <div className="mt-2.5 flex min-h-[120px] min-w-0 items-start rounded-[14px] border border-[#dfe6f2] bg-slate-50 px-3.5 py-2.5">
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
              </div>
            )}
            {step === 2 && (
              <div className="flex min-h-0 min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
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
                          <th
                            className="w-10 border-b border-slate-200 px-2 py-2.5 font-extrabold text-slate-700"
                            scope="col"
                          >
                            <input
                              ref={selectAllHeaderRef}
                              type="checkbox"
                              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#2f6fed] focus:ring-[#2f6fed] disabled:cursor-not-allowed disabled:opacity-40"
                              checked={allFilteredSelected}
                              onChange={toggleSelectAllFiltered}
                              disabled={
                                contactsLoading || filteredContacts.length === 0
                              }
                              aria-label="Tout sélectionner les contacts de la liste affichée"
                            />
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
            <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
              <h3 className="m-0 text-base font-black">Récap</h3>
              <p className="mt-2.5 min-w-0 break-words text-xs font-bold leading-relaxed text-slate-600">
                Groupe : <strong className="text-slate-900">{name.trim() || "—"}</strong>
                <br />
                <span className="inline-block min-w-0 max-w-full align-top">
                  Description :{" "}
                  <strong className="whitespace-pre-wrap break-words text-slate-900">
                    {desc.trim() || "—"}
                  </strong>
                </span>
                <br />
                Rattachement :{" "}
                <strong className="text-slate-900">
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
                aria-pressed={sel?.pack === p.pack}
                className={cn(
                  "cursor-pointer rounded-[18px] border border-slate-300/50 bg-white p-3.5 text-left transition hover:-translate-y-px hover:shadow-[0_16px_34px_rgba(15,23,42,0.10)]",
                  sel?.pack === p.pack &&
                    "border-blue-500 bg-blue-50/60 shadow-[0_18px_40px_rgba(59,130,246,0.18)] ring-2 ring-blue-300/60",
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
                        p.best && "border-blue-300/70 bg-blue-500/10 text-blue-800",
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
                    ? `${new Intl.NumberFormat("fr-FR").format(sel.credits)} crédits`
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

type CampaignDetailsModalProps = {
  open: boolean;
  campaign: CampaignRowData | null;
  onClose: () => void;
};

export function CampaignDetailsModal({
  open,
  campaign,
  onClose,
}: CampaignDetailsModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !campaign) return null;

  return (
    <div
      className={overlayCls}
      role="dialog"
      aria-modal
      aria-label="Détails de la campagne"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cn(modalCard, "max-w-[860px]")}>
        <div className="sticky top-0 z-[1] flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-[18px] py-4">
          <div>
            <div className="text-lg font-black text-slate-900">Détails de campagne</div>
            <div className="text-xs font-bold text-slate-500">
              Consultation uniquement (lecture seule)
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

        <div className="space-y-3 bg-slate-50 p-[18px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <div className="text-[11px] font-black uppercase tracking-widest text-slate-500/90">
              Campagne
            </div>
            <div className="mt-2 text-lg font-black text-slate-900">{campaign.name}</div>
            <div className="mt-2 text-sm font-semibold text-slate-600">
              Statut : <strong>{campaignStatusLabel(campaign.status)}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
              <div className="text-xs font-bold text-slate-500">Date de création</div>
              <div className="mt-1 text-sm font-black text-slate-900">
                {campaign.createdLabel}
              </div>
              <div className="mt-3 text-xs font-bold text-slate-500">Envoi</div>
              <div className="mt-1 text-sm font-black text-slate-900">
                {campaign.sendLabel}
              </div>
              <div className="mt-3 text-xs font-bold text-slate-500">Mode</div>
              <div className="mt-1 text-sm font-black text-slate-900">
                {campaign.sendMode === "sched" ? "Programmé" : "Immédiat"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
              <div className="text-xs font-bold text-slate-500">Expéditeur</div>
              <div className="mt-1 text-sm font-black text-slate-900">
                {campaign.sender?.trim() || "—"}
              </div>
              <div className="mt-3 text-xs font-bold text-slate-500">Destinataires</div>
              <div className="mt-1 text-sm font-black text-slate-900">
                {campaign.recipients}
              </div>
              <div className="mt-3 text-xs font-bold text-slate-500">Crédits estimés</div>
              <div className="mt-1 text-sm font-black text-slate-900">
                {campaign.creditsLabel}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <div className="text-xs font-bold text-slate-500">Message</div>
            <div className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-800">
              {campaign.body?.trim() || "—"}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end border-t border-slate-200 bg-white px-[18px] py-3.5">
          <ProtoBtn onClick={onClose}>Fermer</ProtoBtn>
        </div>
      </div>
    </div>
  );
}

type GroupEditModalProps = {
  open: boolean;
  group: GroupRowData | null;
  onClose: () => void;
  onSave: (payload: { id: string; name: string; description: string }) => Promise<void>;
  onImportToGroup: () => void;
  onLaunchCampaign: (groupName: string) => void;
};

export function GroupEditModal({
  open,
  group,
  onClose,
  onSave,
  onImportToGroup,
  onLaunchCampaign,
}: GroupEditModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !group) return;
    setName(group.name);
    setDescription(group.description ?? "");
    setError(null);
  }, [open, group]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSave = useCallback(async () => {
    if (!group?.id) return;
    if (!name.trim()) {
      setError("Le nom du groupe est obligatoire.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        id: group.id,
        name,
        description,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }, [group, name, description, onSave, onClose]);

  if (!open || !group) return null;

  return (
    <div
      className={overlayCls}
      role="dialog"
      aria-modal
      aria-label="Modifier le groupe"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cn(modalCard, "max-w-[720px]")}>
        <div className="sticky top-0 z-[1] flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-[18px] py-4">
          <div>
            <div className="text-lg font-black text-slate-900">Modifier le groupe</div>
            <div className="text-xs font-bold text-slate-500">
              Mets à jour le nom et la description du segment.
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
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
              <div className="text-[13px] font-black text-slate-900">
                Actions rapides
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <ProtoBtn
                  className="!h-10 !px-3.5 !text-[13px]"
                  onClick={onImportToGroup}
                >
                  Importer dans ce groupe
                </ProtoBtn>
                <ProtoBtn
                  className="!h-10 !px-3.5 !text-[13px]"
                  title="CTA présent, action non implémentée pour l’instant"
                  onClick={() => onLaunchCampaign(name.trim() || group.name)}
                >
                  Lancer une campagne
                </ProtoBtn>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
              <label className="flex justify-between text-[13px] font-black">
                <span>Nom du groupe</span>
                <span className="text-xs text-slate-500">{name.length}/40</span>
              </label>
              <div className="mt-2.5 flex h-11 items-center rounded-[14px] border border-[#dfe6f2] bg-slate-50 px-3.5">
                <input
                  className="w-full border-none bg-transparent text-sm font-extrabold outline-none"
                  maxLength={40}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
              <label className="flex justify-between text-[13px] font-black">
                <span>Description</span>
                <span className="text-xs text-slate-500">{description.length}/120</span>
              </label>
              <div className="mt-2.5 flex min-h-[120px] items-start rounded-[14px] border border-[#dfe6f2] bg-slate-50 px-3.5 py-2.5">
                <textarea
                  className="min-h-[96px] w-full resize-y border-none bg-transparent text-sm font-semibold leading-relaxed text-slate-900 outline-none placeholder:text-slate-400"
                  maxLength={120}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Ex : Clients fidèles à forte fréquence d'achat."
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="border-t border-rose-200 bg-rose-50 px-[18px] py-2.5 text-sm font-bold text-rose-900">
            {error}
          </div>
        )}

        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white px-[18px] py-3.5">
          <ProtoBtn disabled={saving} onClick={onClose}>
            Annuler
          </ProtoBtn>
          <ProtoBtn primary disabled={saving} onClick={() => void handleSave()}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </ProtoBtn>
        </div>
      </div>
    </div>
  );
}

type GroupQuickAddContactsModalProps = {
  open: boolean;
  groupName: string;
  contacts: GroupModalContactRow[];
  contactsLoading?: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => Promise<void>;
};

export function GroupQuickAddContactsModal({
  open,
  groupName,
  contacts,
  contactsLoading = false,
  onClose,
  onConfirm,
}: GroupQuickAddContactsModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectAllHeaderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedIds([]);
      setSaving(false);
      setError(null);
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

  const normalizedGroupName = groupName.trim().toLowerCase();

  const eligibleContacts = useMemo(() => {
    if (!normalizedGroupName) return contacts;
    return contacts.filter(
      (c) =>
        !c.groups.some((g) => g.trim().toLowerCase() === normalizedGroupName),
    );
  }, [contacts, normalizedGroupName]);

  const filteredContacts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return eligibleContacts;
    return eligibleContacts.filter((c) => {
      const hay = `${c.name} ${c.phone} ${c.groups.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [eligibleContacts, query]);

  const toggleContact = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const allFilteredSelected = useMemo(
    () =>
      filteredContacts.length > 0 &&
      filteredContacts.every((c) => selectedIds.includes(c.id)),
    [filteredContacts, selectedIds],
  );

  useEffect(() => {
    const el = selectAllHeaderRef.current;
    if (!el) return;
    const some = filteredContacts.some((c) => selectedIds.includes(c.id));
    el.indeterminate = some && !allFilteredSelected;
  }, [filteredContacts, selectedIds, allFilteredSelected]);

  const toggleSelectAllFiltered = useCallback(() => {
    if (filteredContacts.length === 0) return;
    setSelectedIds((prev) => {
      const allIn = filteredContacts.every((c) => prev.includes(c.id));
      if (allIn) {
        const idSet = new Set(filteredContacts.map((c) => c.id));
        return prev.filter((id) => !idSet.has(id));
      }
      const next = new Set(prev);
      for (const c of filteredContacts) next.add(c.id);
      return Array.from(next);
    });
  }, [filteredContacts]);

  const handleConfirm = useCallback(async () => {
    if (selectedIds.length === 0) {
      setError("Sélectionne au moins un contact.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onConfirm(selectedIds);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ajout impossible.");
    } finally {
      setSaving(false);
    }
  }, [selectedIds, onConfirm, onClose]);

  if (!open) return null;

  return (
    <div
      className={overlayCls}
      role="dialog"
      aria-modal
      aria-label="Ajouter des contacts au groupe"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div className={cn(modalCard, "max-w-[980px]")}>
        <div className="sticky top-0 z-[1] flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-[18px] py-4">
          <div>
            <div className="text-lg font-black text-slate-900">Ajouter des contacts</div>
            <div className="text-xs font-bold text-slate-500">
              Groupe cible : <span className="text-slate-800">{groupName || "—"}</span>
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

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-[18px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
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
                placeholder="Rechercher un contact..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Rechercher un contact"
              />
            </div>

            <div className="mt-3 min-h-[220px] overflow-auto rounded-xl border border-slate-200">
              {contactsLoading ? (
                <div className="px-3 py-10 text-center text-sm font-bold text-slate-500">
                  Chargement des contacts…
                </div>
              ) : eligibleContacts.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm font-bold text-slate-600">
                  Tous les contacts sont déjà présents dans ce groupe.
                </div>
              ) : contacts.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm font-bold text-slate-600">
                  Aucun contact disponible.
                </div>
              ) : (
                <table className="w-full border-separate border-spacing-0 text-left text-[13px]">
                  <thead className="sticky top-0 z-[1] bg-slate-100">
                    <tr>
                      <th className="w-10 border-b border-slate-200 px-2 py-2.5 font-extrabold text-slate-700">
                        <input
                          ref={selectAllHeaderRef}
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#2f6fed] focus:ring-[#2f6fed]"
                          checked={allFilteredSelected}
                          onChange={toggleSelectAllFiltered}
                          aria-label="Tout sélectionner"
                        />
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
                                {c.groups.length ? c.groups.join(", ") : "—"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="border-t border-rose-200 bg-rose-50 px-[18px] py-2.5 text-sm font-bold text-rose-900">
            {error}
          </div>
        )}

        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white px-[18px] py-3.5">
          <ProtoBtn disabled={saving} onClick={onClose}>
            Annuler
          </ProtoBtn>
          <ProtoBtn primary disabled={saving || selectedIds.length === 0} onClick={() => void handleConfirm()}>
            {saving
              ? "Ajout…"
              : `Ajouter ${selectedIds.length} contact${selectedIds.length > 1 ? "s" : ""}`}
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
  notes: string;
  setNotes: (v: string) => void;
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
  notes,
  setNotes,
  groups,
  setGroups,
  groupOptions,
  onCreateGroupRequest,
  consentDefaults,
  onSaveContact,
}: ContactModalProps) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSaveError(null);
    setValidationError(null);
  }, [open]);

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

  const consentSnapshot = useCallback((): { optIn: boolean; stop: boolean } => {
    if (mode === "edit" && consentDefaults) {
      return { optIn: consentDefaults.optIn, stop: consentDefaults.stop };
    }
    return { optIn: true, stop: false };
  }, [mode, consentDefaults]);

  const syncPreview = useCallback(() => {
    const name = `${first.trim()} ${last.trim()}`.trim() || "—";
    const ph = normalizeFRPhone(phone).trim() || "—";
    const gr = formatContactGroups(groups);
    const nt = notes.trim() || "—";
    const { optIn: oi, stop: stp } = consentSnapshot();
    const st = stp ? "STOP" : oi ? "Opt-in" : "Non opt-in";
    return { name, ph, gr, nt, st };
  }, [first, last, phone, notes, groups, consentSnapshot]);

  const toggleContactGroup = useCallback(
    (g: string) => {
      setGroups((prev) =>
        prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
      );
    },
    [setGroups],
  );

  const pv = syncPreview();

  const handleFinalSave = useCallback(async () => {
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
    if (!onSaveContact) {
      onClose();
      return;
    }
    const { optIn, stop } = consentSnapshot();
    setSaveError(null);
    setSaving(true);
    try {
      await onSaveContact({
        firstName: first.trim(),
        lastName: last.trim(),
        phoneDisplay: phone,
        groupLabels: groups,
        notes,
        optIn,
        stop,
      });
      onClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }, [onSaveContact, onClose, first, last, phone, notes, groups, consentSnapshot]);

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
              Saisis les infos puis enregistre.
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
          <div className="grid grid-cols-[1.1fr_0.9fr] gap-3.5 max-[980px]:grid-cols-1">
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
                  <label className="flex justify-between text-[13px] font-black">
                    <span>Notes (optionnel)</span>
                    <span className="text-xs text-slate-500">{notes.length}/280</span>
                  </label>
                  <div className="mt-2.5 flex min-h-[96px] items-start rounded-[14px] border border-[#dfe6f2] bg-slate-50 px-3.5 py-2.5">
                    <textarea
                      className="min-h-[78px] w-full resize-y border-none bg-transparent text-sm font-semibold leading-relaxed text-slate-900 outline-none placeholder:text-slate-400"
                      maxLength={280}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Infos utiles: préférences, contexte client, contraintes..."
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
                {mode === "add" && (
                  <p className="m-0 text-xs font-bold leading-relaxed text-slate-500">
                    Le statut SMS (opt-in, STOP) évolue après les campagnes et s’affiche dans la
                    liste.
                  </p>
                )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
              <h3 className="m-0 text-base font-black">Aperçu</h3>
              <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600">
                Contact : <strong>{pv.name}</strong>
                <br />
                Téléphone : <strong>{pv.ph}</strong>
                <br />
                Groupes : <strong>{pv.gr}</strong>
                <br />
                Notes : <strong className="whitespace-pre-wrap break-words">{pv.nt}</strong>
                {mode === "edit" && (
                  <>
                    <br />
                    Statut SMS : <strong>{pv.st}</strong>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {saveError && (
          <div className="border-t border-rose-200 bg-rose-50 px-[18px] py-2.5 text-sm font-bold text-rose-900">
            {saveError}
          </div>
        )}

        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white px-[18px] py-3.5">
          <ProtoBtn disabled={saving} onClick={onClose}>
            Annuler
          </ProtoBtn>
          <ProtoBtn primary disabled={saving} onClick={() => void handleFinalSave()}>
            {saving
              ? "Enregistrement…"
              : mode === "edit"
                ? "Enregistrer"
                : "Enregistrer le contact"}
          </ProtoBtn>
        </div>
      </div>
    </div>
  );
}
