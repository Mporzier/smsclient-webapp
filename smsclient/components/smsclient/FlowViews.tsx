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
import { formatContactGroups, type ContactRowData } from "@/lib/types/contact";
import type { GroupRowData } from "@/lib/types/group";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

const fieldBox =
  "rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]";
const fieldLabel =
  "flex justify-between gap-2 text-[13px] font-black text-slate-900";
const innerInput =
  "mt-2.5 flex h-[46px] items-center gap-2.5 rounded-[14px] border border-[#dfe6f2] bg-slate-50 px-3.5";
const innerInp =
  "w-full border-none bg-transparent text-sm font-extrabold text-slate-900 outline-none";

type StepTabProps = {
  active: boolean;
  num: string;
  label: string;
  onClick?: () => void;
};

function StepTab({ active, num, label, onClick }: StepTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-2xl border border-transparent bg-slate-100 px-3 py-2.5 text-[13px] font-extrabold text-slate-700",
        active &&
          "border-slate-200 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
      )}
    >
      <span
        className={cn(
          "grid h-[26px] w-[26px] place-items-center rounded-[10px] bg-slate-200 text-xs font-black text-slate-900",
          active &&
            "bg-[#2f6fed] text-white shadow-[0_10px_18px_rgba(47,111,237,0.25)]"
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
        prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
      );
    },
    [setGroups]
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
                    "border-blue-200 shadow-[0_16px_26px_rgba(47,111,237,0.12)]"
                )}
              >
                <span
                  className={cn(
                    "h-3.5 w-3.5 rounded-md shadow-[inset_0_0_0_2px_rgba(15,23,42,0.06)]",
                    c.bg
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

/* ——— Campagne wizard ——— */

type CampProps = {
  step: 1 | 2 | 3 | 4 | 5;
  go: (h: string) => void;
  title: string;
  setTitle: (v: string) => void;
  sender: string;
  setSender: (v: string) => void;
  sms: string;
  setSms: (v: string) => void;
  sendMode: "now" | "sched";
  setSendMode: (v: "now" | "sched") => void;
  scheduleAt: string;
  setScheduleAt: (v: string) => void;
  aiOpen: boolean;
  setAiOpen: (v: boolean) => void;
  goalPreset: "promotion" | "relance" | "nouveaute" | "fidelisation" | "libre";
  setGoalPreset: (
    v: "promotion" | "relance" | "nouveaute" | "fidelisation" | "libre"
  ) => void;
  goalFreeText: string;
  setGoalFreeText: (v: string) => void;
  groups: GroupRowData[];
  contacts: ContactRowData[];
  recipientMode: "manual" | "lists" | "all" | "numbers";
  setRecipientMode: (v: "manual" | "lists" | "all" | "numbers") => void;
  manualNumbers: string;
  setManualNumbers: (v: string) => void;
  selectedGroupNames: string[];
  setSelectedGroupNames: Dispatch<SetStateAction<string[]>>;
  selectedContactIds: string[];
  setSelectedContactIds: Dispatch<SetStateAction<string[]>>;
  recipientSelectedRaw: number;
  recipientExcludedStop: number;
  recipientExcludedInvalid: number;
  recipientCount: number;
  creditsAvailable: number;
  /** Étape 5 : enregistrement en base puis retour liste. */
  onConfirmCampaign?: () => void | Promise<void>;
};

function buildDefaultCampaignTitle(): string {
  const d = new Date().toLocaleDateString("fr-FR");
  return `Campagne · ${d}`.slice(0, 60);
}

function generateAiVariants(args: {
  objective: string;
  offer: string;
  duration: string;
  tone: string;
}): string[] {
  const objective = args.objective.trim() || "offre boutique";
  const offer = args.offer.trim() || "une offre exclusive";
  const duration = args.duration.trim() || "48h";
  const tone = args.tone.trim().toLowerCase();
  const opener =
    tone === "premium"
      ? "Bonjour {PRENOM},"
      : tone === "urgent"
      ? "{PRENOM},"
      : "Hello {PRENOM},";
  return [
    `${opener} ${objective} : ${offer}. Valable ${duration}. Réponds STOP pour ne plus recevoir nos SMS.`,
    `${opener} profite de ${offer} pour ${objective}. Fin de l’offre dans ${duration}.`,
    `${objective} 💬 ${offer} pendant ${duration}. Passe en boutique avec ce SMS !`,
  ].map((x) => x.slice(0, 320));
}

function normalizeUrl(url: string): string {
  const t = url.trim();
  if (!t) return "";
  if (!/^https?:\/\//i.test(t)) {
    return `https://${t}`;
  }
  return t;
}

function removeExistingUrl(text: string): string {
  return text.replace(/\s?https?:\/\/[^\s]+/gi, "").trim();
}

function ensureStopMention(text: string): string {
  return /stop/i.test(text)
    ? text
    : `${text.trim()} Répondez STOP pour ne plus recevoir nos SMS.`.trim();
}

export function CampagneWizard({
  step,
  go,
  title,
  setTitle,
  sender,
  setSender,
  sms,
  setSms,
  sendMode,
  setSendMode,
  scheduleAt,
  setScheduleAt,
  aiOpen,
  setAiOpen,
  groups,
  contacts,
  recipientMode,
  setRecipientMode,
  manualNumbers,
  setManualNumbers,
  selectedGroupNames,
  setSelectedGroupNames,
  selectedContactIds,
  setSelectedContactIds,
  recipientSelectedRaw,
  recipientExcludedStop,
  recipientExcludedInvalid,
  recipientCount,
  creditsAvailable,
  onConfirmCampaign,
}: CampProps) {
  void step;
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [aiOffer, setAiOffer] = useState("");
  const [aiDuration, setAiDuration] = useState("");
  const [aiTone, setAiTone] = useState("amical");
  const [aiVariants, setAiVariants] = useState<string[]>([]);
  const [selectedAiVariant, setSelectedAiVariant] = useState<string | null>(
    null
  );
  const [messageUrl, setMessageUrl] = useState("");
  const [settingsEditing, setSettingsEditing] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);
  const [settingsDraft, setSettingsDraft] = useState({
    sender,
    sendMode,
    scheduleAt,
  });

  const unicode = isUnicode(sms);
  const parts = smsPartsFor(sms);
  const len = [...sms].length;
  const recipients = Math.max(0, recipientCount);
  const totalCredits = parts * recipients;

  const displaySender = sanitizeSender(sender).trim() || "BOULANGERIE";
  const displayTitle = title.trim() || buildDefaultCampaignTitle();
  const hasEnoughCredits = totalCredits <= creditsAvailable;
  const settingsDirty =
    settingsDraft.sender.trim() !== sender.trim() ||
    settingsDraft.sendMode !== sendMode ||
    settingsDraft.scheduleAt !== scheduleAt;

  const selectedIdsFromGroups = useMemo(() => {
    if (selectedGroupNames.length === 0) return new Set<string>();
    const wanted = selectedGroupNames.map((x) => x.trim().toLowerCase());
    const ids = new Set<string>();
    for (const c of contacts) {
      if (c.groups.some((g) => wanted.includes(g.trim().toLowerCase()))) {
        ids.add(c.id);
      }
    }
    return ids;
  }, [contacts, selectedGroupNames]);

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    const base = !q
      ? contacts
      : contacts.filter((c) => {
          const hay = `${c.name} ${c.phone} ${formatContactGroups(
            c.groups
          )}`.toLowerCase();
          return hay.includes(q);
        });

    const subscribed: typeof base = [];
    const unsubscribed: typeof base = [];
    for (const c of base) {
      if (c.stopSms || !c.optIn) {
        unsubscribed.push(c);
      } else {
        subscribed.push(c);
      }
    }
    return [...subscribed, ...unsubscribed];
  }, [contacts, contactSearch]);

  const selectableFilteredContacts = useMemo(
    () => filteredContacts.filter((c) => !c.stopSms && c.optIn),
    [filteredContacts]
  );

  useEffect(() => {
    setConfirmError(null);
  }, [sms, recipientCount, sendMode]);

  useEffect(() => {
    const match = sms.match(/https?:\/\/[^\s]+/i);
    setMessageUrl(match?.[0] ?? "");
  }, [sms]);

  useEffect(() => {
    if (settingsEditing) return;
    setSettingsDraft({ sender, sendMode, scheduleAt });
  }, [sender, sendMode, scheduleAt, settingsEditing]);

  useEffect(() => {
    if (!settingsFeedback) return;
    const t = window.setTimeout(() => setSettingsFeedback(null), 2200);
    return () => window.clearTimeout(t);
  }, [settingsFeedback]);

  const toggleGroup = useCallback(
    (groupName: string) => {
      setSelectedGroupNames((prev) =>
        prev.includes(groupName)
          ? prev.filter((x) => x !== groupName)
          : [...prev, groupName]
      );
    },
    [setSelectedGroupNames]
  );

  const toggleContact = useCallback(
    (id: string) => {
      setSelectedContactIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    },
    [setSelectedContactIds]
  );

  const selectAllVisibleContacts = useCallback(() => {
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      for (const c of selectableFilteredContacts) {
        next.add(c.id);
      }
      return Array.from(next);
    });
  }, [selectableFilteredContacts, setSelectedContactIds]);

  const clearAllSelectedRecipients = useCallback(() => {
    setSelectedContactIds([]);
    setSelectedGroupNames([]);
  }, [setSelectedContactIds, setSelectedGroupNames]);

  const generateWithAi = useCallback(() => {
    const variants = generateAiVariants({
      objective: displayTitle,
      offer: aiOffer,
      duration: aiDuration,
      tone: aiTone,
    });
    setAiVariants(variants.slice(0, 3));
    setSelectedAiVariant(null);
    setAiOpen(true);
    if (!sms.trim()) {
      setSms(variants[0] ?? "");
    }
  }, [displayTitle, aiOffer, aiDuration, aiTone, setAiOpen, sms, setSms]);

  const correctCurrentMessage = useCallback(() => {
    const text = (sms || "")
      .replace(/\s+/g, " ")
      .replace(/-20%/g, "-20 %")
      .replace(/bonjour/gi, "Bonjour")
      .replace(/sms/gi, "SMS")
      .trim();
    setSms(text ? ensureStopMention(text) : "");
  }, [sms, setSms]);

  const reformulateMessage = useCallback(() => {
    const base =
      sms.trim() || "Bonjour {PRENOM}, profitez de notre offre en boutique.";
    const next = base
      .replace("profitez de", "bénéficiez de")
      .replace("cette semaine", "en ce moment")
      .replace("dans votre boulangerie", "dans notre boutique");
    setSms(next.trim());
  }, [sms, setSms]);

  const insertOrUpdateUrl = useCallback(() => {
    const normalized = normalizeUrl(messageUrl);
    const next = removeExistingUrl(sms);
    setSms(normalized ? `${next} ${normalized}`.trim() : next.trim());
  }, [messageUrl, sms, setSms]);

  const toggleStopText = useCallback(() => {
    if (/Répondez STOP pour ne plus recevoir nos SMS\./i.test(sms)) {
      setSms(
        sms
          .replace(/ ?Répondez STOP pour ne plus recevoir nos SMS\./i, "")
          .trim()
      );
      return;
    }
    setSms(ensureStopMention(sms || ""));
  }, [sms, setSms]);

  const insertEmoji = useCallback(
    (emoji: string) => {
      setSms(`${sms}${emoji}`);
    },
    [sms, setSms]
  );

  const handleConfirm = useCallback(async () => {
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
        e instanceof Error ? e.message : "Enregistrement impossible."
      );
    } finally {
      setConfirmLoading(false);
    }
  }, [onConfirmCampaign, go]);

  const saveSettings = useCallback(() => {
    const nextSender = sanitizeSender(settingsDraft.sender).trim();
    if (!nextSender) {
      setSettingsError("L’expéditeur ne peut pas être vide.");
      return;
    }
    if (settingsDraft.sendMode === "sched" && !settingsDraft.scheduleAt) {
      setSettingsError("Sélectionne une date de programmation.");
      return;
    }
    setSettingsError(null);
    setSender(nextSender);
    setSendMode(settingsDraft.sendMode);
    setScheduleAt(settingsDraft.scheduleAt);
    setSettingsEditing(false);
    setSettingsFeedback("Paramètres enregistrés.");
  }, [settingsDraft, setSender, setSendMode, setScheduleAt]);

  const cancelSettingsEdit = useCallback(() => {
    setSettingsDraft({ sender, sendMode, scheduleAt });
    setSettingsError(null);
    setSettingsEditing(false);
    setSettingsFeedback("Modifications annulées.");
  }, [sender, sendMode, scheduleAt]);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[34px] font-extrabold text-slate-900">
            Créer une campagne SMS
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <ProtoBtn onClick={() => go("campagnes")}>Annuler</ProtoBtn>
          <ProtoBtn
            primary
            disabled={
              confirmLoading ||
              !hasEnoughCredits ||
              recipients === 0 ||
              (settingsEditing && settingsDirty)
            }
            onClick={handleConfirm}
          >
            {confirmLoading ? "Enregistrement…" : "Confirmer l'envoi"}
          </ProtoBtn>
        </div>
      </div>

      {
        <div className="grid max-w-4xl grid-cols-1 gap-3">
          <div className={fieldBox}>
            <label className={fieldLabel}>
              <span className="inline-flex items-center gap-2">
                <span>Nom de la campagne</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-black text-blue-700">
                  Pré-rempli
                </span>
              </span>
              <span className="text-xs text-slate-500">
                {Math.min(title.length, 80)}/80
              </span>
            </label>
            <div className={innerInput}>
              <input
                className={innerInp}
                maxLength={80}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={buildDefaultCampaignTitle()}
              />
            </div>
          </div>
        </div>
      }

      {
        <div className="grid grid-cols-[1.1fr_0.9fr] gap-3.5 max-[1100px]:grid-cols-1">
          <div className="space-y-3">
            <div className={fieldBox}>
              <h2 className="m-0 text-base font-black">
                Choix des destinataires
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { id: "manual", label: "Sélection manuelle" },
                  { id: "lists", label: "Listes" },
                  { id: "all", label: "Tous les contacts" },
                  { id: "numbers", label: "Entrer vos numéros" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      setRecipientMode(
                        m.id as "manual" | "lists" | "all" | "numbers"
                      )
                    }
                    className={cn(
                      "cursor-pointer rounded-xl border px-3 py-2 text-sm font-extrabold transition-colors",
                      recipientMode === m.id
                        ? "border-[#2f6fed] bg-[#eef4ff] text-[#1f3b77]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {recipientMode === "lists" && (
              <div className={fieldBox}>
                <h2 className="m-0 text-base font-black">Listes</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGroup(g.name)}
                      className={cn(
                        "cursor-pointer rounded-xl border px-3 py-2 text-sm font-extrabold transition-colors",
                        selectedGroupNames.includes(g.name)
                          ? "border-[#2f6fed] bg-[#eef4ff] text-[#1f3b77]"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      )}
                    >
                      {g.name} · {g.contactCount}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={fieldBox}>
              <h2 className="m-0 text-base font-black">
                {recipientMode === "numbers"
                  ? "Numéros saisis"
                  : "Sélection de contacts"}
              </h2>
              <div className="mt-2.5 flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500">
                <input
                  className="min-w-0 flex-1 border-none bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Rechercher un contact..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  disabled={recipientMode === "numbers"}
                />
              </div>
              {recipientMode === "numbers" ? (
                <textarea
                  className="mt-3 min-h-[150px] w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 outline-none"
                  placeholder="Ex : 0612457890, 0677123456 ou un numéro par ligne"
                  value={manualNumbers}
                  onChange={(e) => setManualNumbers(e.target.value)}
                />
              ) : (
                <>
                  {recipientMode !== "all" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ProtoBtn
                        className="h-9 px-3 text-xs"
                        onClick={selectAllVisibleContacts}
                        disabled={selectableFilteredContacts.length === 0}
                      >
                        Tout sélectionner
                      </ProtoBtn>
                      <ProtoBtn
                        className="h-9 px-3 text-xs"
                        onClick={clearAllSelectedRecipients}
                        disabled={
                          selectedContactIds.length === 0 &&
                          selectedGroupNames.length === 0
                        }
                      >
                        Tout désélectionner
                      </ProtoBtn>
                    </div>
                  )}
                  <div className="mt-3 max-h-[260px] overflow-auto rounded-xl border border-slate-200">
                  {filteredContacts.map((c) => {
                    const isUnsubscribed = c.stopSms || !c.optIn;
                    const viaGroup = selectedIdsFromGroups.has(c.id);
                    const checked =
                      !isUnsubscribed &&
                      (recipientMode === "all" ||
                        (recipientMode === "lists" && viaGroup) ||
                        (recipientMode === "manual" &&
                          selectedContactIds.includes(c.id)) ||
                        (recipientMode === "lists" &&
                          selectedContactIds.includes(c.id)));
                    return (
                      <label
                        key={c.id}
                        className={cn(
                          "flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-sm",
                          isUnsubscribed
                            ? "cursor-not-allowed bg-slate-50 text-slate-400"
                            : "cursor-pointer bg-white"
                        )}
                      >
                        <span className="min-w-0">
                          <span
                            className={cn(
                              "block truncate font-extrabold",
                              isUnsubscribed
                                ? "text-slate-400"
                                : "text-slate-900"
                            )}
                          >
                            {c.name}
                          </span>
                          <span
                            className={cn(
                              "block truncate text-xs font-semibold",
                              isUnsubscribed
                                ? "text-slate-400"
                                : "text-slate-500"
                            )}
                          >
                            {c.phone} · {formatContactGroups(c.groups)}
                            {isUnsubscribed ? " · Désabonné" : ""}
                          </span>
                        </span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-[#2f6fed]"
                          checked={checked}
                          disabled={recipientMode === "all" || isUnsubscribed}
                          onChange={() => toggleContact(c.id)}
                        />
                      </label>
                    );
                  })}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className={fieldBox}>
            <h2 className="m-0 text-base font-black">Confiance de ciblage</h2>
            <p className="mt-3 text-sm font-bold text-slate-600">
              Sélection brute : <strong>{recipientSelectedRaw}</strong>
            </p>
            <p className="mt-1 text-sm font-bold text-slate-600">
              Exclus STOP : <strong>{recipientExcludedStop}</strong>
            </p>
            <p className="mt-1 text-sm font-bold text-slate-600">
              Exclus invalides/non opt-in :{" "}
              <strong>{recipientExcludedInvalid}</strong>
            </p>
            <p className="mt-2 text-base font-black text-slate-900">
              Destinataires éligibles : {recipients}
            </p>
            {recipients === 0 && (
              <p className="mt-2 text-sm font-extrabold text-amber-800">
                Aucun destinataire éligible pour le moment.
              </p>
            )}
          </div>
        </div>
      }

      {
        <div className="grid grid-cols-[1.35fr_0.65fr] gap-3.5 max-[1100px]:grid-cols-1">
          <div className="space-y-3">
            <div className={fieldBox}>
              <h2 className="m-0 text-base font-black">Message</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 max-[700px]:grid-cols-1">
                <button
                  type="button"
                  onClick={() => setAiOpen(false)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-sm font-extrabold transition-colors",
                    !aiOpen
                      ? "border-[#2f6fed] bg-[#eef4ff] text-[#1f3b77]"
                      : "border-slate-200 bg-white text-slate-700"
                  )}
                >
                  Écrire mon SMS
                </button>
                <button
                  type="button"
                  onClick={() => setAiOpen(true)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-sm font-extrabold transition-colors",
                    aiOpen
                      ? "border-[#2f6fed] bg-[#eef4ff] text-[#1f3b77]"
                      : "border-slate-200 bg-white text-slate-700"
                  )}
                >
                  Créer avec l&apos;IA
                </button>
              </div>

              {!aiOpen && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <ProtoBtn
                    className="h-9 px-3 text-xs"
                    onClick={correctCurrentMessage}
                  >
                    Corriger
                  </ProtoBtn>
                  <ProtoBtn
                    className="h-9 px-3 text-xs"
                    onClick={reformulateMessage}
                  >
                    Reformuler
                  </ProtoBtn>
                </div>
              )}

              {aiOpen && (
                <div className="mt-3">
                  <div className="grid grid-cols-3 gap-2 max-[900px]:grid-cols-1">
                    <input
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none"
                      value={aiOffer}
                      onChange={(e) => setAiOffer(e.target.value)}
                      placeholder="Offre (optionnel)"
                    />
                    <input
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none"
                      value={aiDuration}
                      onChange={(e) => setAiDuration(e.target.value)}
                      placeholder="Durée (optionnel)"
                    />
                    <select
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none"
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                    >
                      <option value="amical">Ton amical</option>
                      <option value="premium">Ton premium</option>
                      <option value="urgent">Ton urgent</option>
                    </select>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <ProtoBtn
                      className="h-9 px-3 text-xs"
                      onClick={generateWithAi}
                    >
                      Générer 1 à 3 variantes
                    </ProtoBtn>
                    <ProtoBtn
                      className="h-9 px-3 text-xs"
                      onClick={generateWithAi}
                    >
                      Régénérer
                    </ProtoBtn>
                  </div>
                  {aiVariants.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
                      {aiVariants.map((v, idx) => (
                        <div
                          key={`${idx}-${v.slice(0, 20)}`}
                          className={cn(
                            "flex min-h-[140px] flex-col gap-2 rounded-2xl border bg-white p-3",
                            selectedAiVariant === v || sms === v
                              ? "border-[#2f6fed] bg-[#eef4ff] ring-2 ring-[#2f6fed]/30"
                              : "border-slate-200"
                          )}
                        >
                          <p className="text-[13px] font-extrabold leading-snug text-slate-900">
                            {v}
                          </p>
                          <ProtoBtn
                            className="mt-auto h-9 text-xs"
                            onClick={() => {
                              setSms(v);
                              setSelectedAiVariant(v);
                            }}
                          >
                            Utiliser
                          </ProtoBtn>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={fieldBox}>
              <label className={fieldLabel}>
                <span>Message final (modifiable)</span>
                <span className="text-xs text-slate-500">{len} car.</span>
              </label>
              <textarea
                className="mt-2 min-h-[140px] w-full resize-none rounded-2xl border border-[#dfe6f2] bg-slate-50 p-3.5 text-sm font-extrabold text-slate-900 outline-none"
                value={sms}
                onChange={(e) => setSms(e.target.value)}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  className="h-10 min-w-[260px] flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none"
                  placeholder="Ajouter un lien URL (optionnel)"
                  value={messageUrl}
                  onChange={(e) => setMessageUrl(e.target.value)}
                />
                <ProtoBtn
                  className="h-10 px-3 text-xs"
                  onClick={insertOrUpdateUrl}
                >
                  Ajouter le lien
                </ProtoBtn>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {["🔥", "🎁", "⭐", "❤️", "🎉", "⏰"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-lg"
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
                <ProtoBtn className="h-9 px-3 text-xs" onClick={toggleStopText}>
                  Ajouter / retirer STOP
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
      }

      {
        <div className="grid grid-cols-[0.9fr_1.1fr] gap-3.5 max-[1100px]:grid-cols-1">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="mx-auto max-w-[360px] rounded-[26px] border border-slate-300 bg-white p-3 shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
              <div className="mb-2 text-center text-[11px] font-black text-slate-400">
                Smartphone preview
              </div>
              <div className="rounded-2xl border border-slate-200 bg-[#f8fbff] p-3 text-[13px] font-extrabold leading-snug text-slate-900">
                {sms || "—"}
              </div>
              <div className="mt-2 text-center text-xs font-extrabold text-slate-500">
                {displaySender}
              </div>
            </div>
          </div>
          <div className={fieldBox}>
            <h2 className="m-0 text-base font-black">Aperçu complet</h2>
            <p className="mt-3 text-sm font-bold text-slate-600">
              Campagne : <strong>{displayTitle}</strong>
            </p>
            <p className="mt-1 text-sm font-bold text-slate-600">
              Expéditeur : <strong>{displaySender}</strong>
            </p>
            <p className="mt-1 text-sm font-bold text-slate-600">
              Destinataires éligibles : <strong>{recipients}</strong>
            </p>
            <p className="mt-1 text-sm font-bold text-slate-600">
              Coût total estimé :{" "}
              <strong>{formatInt(totalCredits)} crédits</strong>
            </p>
            <p className="mt-2 text-xs font-bold text-slate-500">
              {len} car. · {unicode ? "Unicode" : "GSM-7"} · {parts} segments
            </p>
          </div>
        </div>
      }

      {
        <div className="max-w-xl space-y-3">
          {confirmError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
              {confirmError}
            </div>
          )}
          <div className={fieldBox}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="m-0 text-base font-black">
                Paramètres d&apos;envoi
              </h2>
              {!settingsEditing ? (
                <ProtoBtn
                  className="h-9 px-3 text-xs"
                  onClick={() => setSettingsEditing(true)}
                >
                  Modifier
                </ProtoBtn>
              ) : (
                <div className="flex gap-2">
                  <ProtoBtn
                    className="h-9 px-3 text-xs"
                    onClick={cancelSettingsEdit}
                  >
                    Annuler
                  </ProtoBtn>
                  <ProtoBtn
                    primary
                    className="h-9 px-3 text-xs"
                    onClick={saveSettings}
                  >
                    Enregistrer
                  </ProtoBtn>
                </div>
              )}
            </div>
            {settingsFeedback && (
              <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                {settingsFeedback}
              </p>
            )}
            {settingsError && (
              <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800">
                {settingsError}
              </p>
            )}
            {settingsEditing && settingsDirty && (
              <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                Modifications en cours : enregistre ou annule avant
                confirmation.
              </p>
            )}
            <div className="mt-3">
              <label className="text-xs font-bold text-slate-500">
                Expéditeur
              </label>
              <input
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                value={settingsDraft.sender}
                onChange={(e) =>
                  setSettingsDraft((prev) => ({
                    ...prev,
                    sender: e.target.value,
                  }))
                }
                disabled={!settingsEditing}
                maxLength={11}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() =>
                  settingsEditing &&
                  setSettingsDraft((prev) => ({ ...prev, sendMode: "now" }))
                }
                className={cn(
                  "flex min-w-[220px] flex-1 cursor-pointer items-start gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-[0_10px_22px_rgba(15,23,42,0.08)]",
                  settingsDraft.sendMode === "now" && "ring-2 ring-[#2f6fed]",
                  !settingsEditing && "cursor-default opacity-80"
                )}
              >
                <span className="mt-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-[#2f6fed]">
                  {settingsDraft.sendMode === "now" && (
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
                onClick={() =>
                  settingsEditing &&
                  setSettingsDraft((prev) => ({ ...prev, sendMode: "sched" }))
                }
                className={cn(
                  "flex min-w-[220px] flex-1 cursor-pointer items-start gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-[0_10px_22px_rgba(15,23,42,0.08)]",
                  settingsDraft.sendMode === "sched" && "ring-2 ring-[#2f6fed]",
                  !settingsEditing && "cursor-default opacity-80"
                )}
              >
                <span className="mt-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-[#2f6fed]">
                  {settingsDraft.sendMode === "sched" && (
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
            {settingsDraft.sendMode === "sched" && (
              <div className="mt-3">
                <label className="text-xs font-bold text-slate-500">
                  Date de programmation
                </label>
                <input
                  type="datetime-local"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  value={settingsDraft.scheduleAt}
                  onChange={(e) =>
                    setSettingsDraft((prev) => ({
                      ...prev,
                      scheduleAt: e.target.value,
                    }))
                  }
                  disabled={!settingsEditing}
                />
              </div>
            )}
          </div>
          <div className={fieldBox}>
            <p className="text-sm font-bold text-slate-600">
              Campagne : <strong>{displayTitle}</strong> — Expéditeur :{" "}
              <strong>{displaySender}</strong>
            </p>
            <p className="mt-2 text-sm font-bold">
              Total crédits : {formatInt(totalCredits)}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-600">
              Crédits disponibles : {formatInt(creditsAvailable)}
            </p>
            {!hasEnoughCredits && (
              <p className="mt-2 text-sm font-extrabold text-rose-800">
                Crédits insuffisants : recharge le compte avant l&apos;envoi.
              </p>
            )}
            {recipients === 0 && (
              <p className="mt-2 text-sm font-extrabold text-amber-800">
                Aucun destinataire éligible sélectionné.
              </p>
            )}
          </div>
        </div>
      }
    </div>
  );
}
