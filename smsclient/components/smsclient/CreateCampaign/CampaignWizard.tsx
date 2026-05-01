"use client";

import { cn } from "@/lib/cn";
import { ProtoBtn } from "@/components/smsclient/ui";
import {
  formatInt,
  sanitizeSender,
  smsPartsFor,
  isUnicode,
} from "@/lib/proto/smsUtils";
import { formatContactGroups, type ContactRowData } from "@/lib/types/contact";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, Flame, Gift, Heart, PartyPopper, Star } from "lucide-react";
import type { CampaignWizardProps } from "./campaignTypes";
import {
  buildDefaultCampaignTitle,
  generateAiVariants,
  normalizeUrl,
  removeExistingUrl,
  ensureStopMention,
} from "./campaignTextUtils";
import {
  fieldBox,
  fieldLabel,
  innerInput,
  innerInp,
} from "@/components/smsclient/flowFieldStyles";

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/** Normalise un mobile FR pour comparaison (0… depuis +33…, 9 chiffres 6/7, ou préfixe partiel). */
function frPhoneSearchKey(s: string): string {
  let d = digitsOnly(s);
  if (d.startsWith("33")) {
    const rest = d.slice(2);
    if (rest.length > 0) {
      d = `0${rest}`;
    }
  } else if (d.length === 9 && /^[67]/.test(d)) {
    d = `0${d}`;
  }
  return d;
}

/** Recherche sur nom affiché, prénom, nom de famille, téléphone (formats FR / +33) et libellés de groupes. */
function contactMatchesSearch(c: ContactRowData, rawQuery: string): boolean {
  const qTrim = rawQuery.trim();
  if (!qTrim) return true;

  const qLower = qTrim.toLowerCase();
  const groupsText = formatContactGroups(c.groups).toLowerCase();
  const nameHay = [c.name, c.firstName, c.lastName]
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  const textHay = `${nameHay} ${c.phone.toLowerCase()} ${groupsText}`;

  if (textHay.includes(qLower)) return true;

  const terms = qLower.split(/\s+/).filter(Boolean);
  if (terms.length > 1 && terms.every((t) => textHay.includes(t))) {
    return true;
  }

  const qDigits = digitsOnly(qTrim);
  const qPhoneKey = frPhoneSearchKey(qTrim);
  const phoneKey = frPhoneSearchKey(c.phone);
  if (
    qDigits.length >= 2 &&
    phoneKey.length > 0 &&
    phoneKey.includes(qPhoneKey)
  ) {
    return true;
  }

  return false;
}

export function CampaignWizard({
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
  goalPreset: _goalPreset,
  setGoalPreset: _setGoalPreset,
  goalFreeText: _goalFreeText,
  setGoalFreeText: _setGoalFreeText,
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
}: CampaignWizardProps) {
  void step;
  void _goalPreset;
  void _setGoalPreset;
  void _goalFreeText;
  void _setGoalFreeText;
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
    const q = contactSearch.trim();
    const base = !q
      ? contacts
      : contacts.filter((c) => contactMatchesSearch(c, contactSearch));

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

  const correctAndReformulateMessage = useCallback(() => {
    const corrected = (sms || "")
      .replace(/\s+/g, " ")
      .replace(/-20%/g, "-20 %")
      .replace(/bonjour/gi, "Bonjour")
      .replace(/sms/gi, "SMS")
      .trim();
    const base =
      corrected || "Bonjour {PRENOM}, profitez de notre offre en boutique.";
    const reformulated = base
      .replace("profitez de", "bénéficiez de")
      .replace("cette semaine", "en ce moment")
      .replace("dans votre boulangerie", "dans notre boutique")
      .trim();
    setSms(reformulated ? ensureStopMention(reformulated) : "");
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

  const destinatairesLabel =
    recipients === 1
      ? "1 destinataire"
      : `${formatInt(recipients)} destinataires`;

  return (
    <div className="flex flex-col gap-3.5">
      <header className="sticky top-[-20px] z-20 -mx-4 border-b border-slate-200/90 bg-white/95 px-4 py-3.5 backdrop-blur-md md:-mx-5 md:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="m-0 text-[22px] font-extrabold leading-tight tracking-tight text-slate-900 sm:text-[28px] lg:text-[34px]">
              Créer une campagne SMS
            </h1>
            <p className="mt-1.5 m-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm font-bold text-slate-600">
              <span className="whitespace-nowrap">
                Sélection :{" "}
                <strong className="font-extrabold text-slate-900">
                  {destinatairesLabel}
                </strong>
              </span>
              <span className="text-slate-300" aria-hidden>
                ·
              </span>
              <span className="whitespace-nowrap">
                Solde :{" "}
                <strong className="font-extrabold text-slate-900">
                  {formatInt(creditsAvailable)} crédits
                </strong>
              </span>
              <span className="text-slate-300" aria-hidden>
                ·
              </span>
              <span className="whitespace-nowrap">
                Coût estimé :{" "}
                <strong
                  className={cn(
                    "font-extrabold",
                    hasEnoughCredits ? "text-slate-900" : "text-rose-700"
                  )}
                >
                  {formatInt(totalCredits)} crédit
                  {totalCredits === 1 ? "" : "s"}
                </strong>
              </span>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 lg:pt-0.5">
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
      </header>

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
                  placeholder="Rechercher un contact par nom, téléphone ou groupe"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  disabled={recipientMode === "numbers"}
                  aria-label="Rechercher par nom, téléphone ou groupe"
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
                    onClick={correctAndReformulateMessage}
                  >
                    Corriger et reformuler
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
                {(
                  [
                    { char: "🔥", Icon: Flame },
                    { char: "🎁", Icon: Gift },
                    { char: "⭐", Icon: Star },
                    { char: "❤️", Icon: Heart },
                    { char: "🎉", Icon: PartyPopper },
                    { char: "⏰", Icon: Clock },
                  ] as const
                ).map(({ char, Icon }) => (
                  <button
                    key={char}
                    type="button"
                    title={char}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700"
                    onClick={() => insertEmoji(char)}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
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
