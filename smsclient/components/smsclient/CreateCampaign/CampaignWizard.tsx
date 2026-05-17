"use client";

import { cn } from "@/lib/cn";
import { ProtoBtn } from "@/components/smsclient/ui";
import {
  formatInt,
  sanitizeSender,
  smsPartsFor,
  isUnicode,
} from "@/lib/proto/smsUtils";
import { isParisDateInPast } from "@/lib/proto/timezone";
import { formatContactGroups, type ContactRowData } from "@/lib/types/contact";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Gift,
  Heart,
  PartyPopper,
  Star,
  Users,
  MessageSquare,
  Send,
} from "lucide-react";
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

function parseScheduleValue(val: string): {
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
} {
  if (!val) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);
    return {
      day: String(now.getDate()).padStart(2, "0"),
      month: String(now.getMonth() + 1).padStart(2, "0"),
      year: String(now.getFullYear()),
      hour: String(now.getHours()).padStart(2, "0"),
      minute: String(now.getMinutes()).padStart(2, "0"),
    };
  }
  const [datePart, timePart] = val.split("T");
  const [y, m, d] = datePart.split("-");
  const [h, min] = (timePart ?? "00:00").split(":");
  return { day: d, month: m, year: y, hour: h, minute: min };
}

function buildScheduleValue(parts: {
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
}): string {
  const d = parts.day.padStart(2, "0");
  const m = parts.month.padStart(2, "0");
  const y = parts.year.padStart(4, "0");
  const h = parts.hour.padStart(2, "0");
  const min = parts.minute.padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}

function SchedulePicker({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
}) {
  const initial = parseScheduleValue(value);
  const [day, setDay] = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const nativeRef = useRef<HTMLInputElement>(null);

  const flush = useCallback(() => {
    onChange(buildScheduleValue({ day, month, year, hour, minute }));
  }, [day, month, year, hour, minute, onChange]);

  const handleNativePick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (!v) return;
      const parsed = parseScheduleValue(v);
      setDay(parsed.day);
      setMonth(parsed.month);
      setYear(parsed.year);
      setHour(parsed.hour);
      setMinute(parsed.minute);
      onChange(buildScheduleValue(parsed));
    },
    [onChange],
  );

  const numInput =
    "h-10 rounded-lg border bg-white px-2 text-center text-sm font-bold text-slate-900 outline-none focus:border-[#2f6fed] focus:ring-2 focus:ring-blue-100";
  const sep = "text-sm font-black text-slate-400 self-center";
  const borderCls = hasError ? "border-rose-300" : "border-slate-200";

  return (
    <div className="mt-1 flex flex-wrap items-end gap-3">
      <div>
        <span className="mb-1 block text-[11px] font-bold text-slate-400">Date</span>
        <div className="flex items-center gap-1">
          <input
            className={cn(numInput, borderCls, "w-11")}
            maxLength={2}
            placeholder="JJ"
            value={day}
            onChange={(e) => setDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
            onBlur={flush}
          />
          <span className={sep}>/</span>
          <input
            className={cn(numInput, borderCls, "w-11")}
            maxLength={2}
            placeholder="MM"
            value={month}
            onChange={(e) => setMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
            onBlur={flush}
          />
          <span className={sep}>/</span>
          <input
            className={cn(numInput, borderCls, "w-16")}
            maxLength={4}
            placeholder="AAAA"
            value={year}
            onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
            onBlur={flush}
          />
        </div>
      </div>
      <div>
        <span className="mb-1 block text-[11px] font-bold text-slate-400">Heure</span>
        <div className="flex items-center gap-1">
          <input
            className={cn(numInput, borderCls, "w-11")}
            maxLength={2}
            placeholder="HH"
            value={hour}
            onChange={(e) => setHour(e.target.value.replace(/\D/g, "").slice(0, 2))}
            onBlur={flush}
          />
          <span className={sep}>:</span>
          <input
            className={cn(numInput, borderCls, "w-11")}
            maxLength={2}
            placeholder="MM"
            value={minute}
            onChange={(e) => setMinute(e.target.value.replace(/\D/g, "").slice(0, 2))}
            onBlur={flush}
          />
        </div>
      </div>
      <div className="self-end">
        <span className="mb-1 block text-[11px] font-bold text-slate-400">&nbsp;</span>
        <button
          type="button"
          title="Ouvrir le calendrier"
          onClick={() => nativeRef.current?.showPicker()}
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-[#2f6fed] hover:bg-blue-50 hover:text-[#2f6fed]"
        >
          <Calendar className="h-4 w-4" />
        </button>
        <input
          ref={nativeRef}
          type="datetime-local"
          className="invisible absolute h-0 w-0"
          tabIndex={-1}
          value={buildScheduleValue({ day, month, year, hour, minute })}
          onChange={handleNativePick}
        />
      </div>
    </div>
  );
}

const STEPS = [
  { id: 1 as const, label: "Destinataires", icon: Users },
  { id: 2 as const, label: "Message", icon: MessageSquare },
  { id: 3 as const, label: "Confirmation", icon: Send },
];

function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((s, idx) => {
        const done = s.id < current;
        const active = s.id === current;
        const Icon = s.icon;
        return (
          <div key={s.id} className="flex items-center gap-1">
            {idx > 0 && (
              <div
                className={cn(
                  "h-px w-6 transition-colors",
                  done ? "bg-[#2f6fed]" : "bg-slate-200",
                )}
              />
            )}
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                active
                  ? "bg-[#eef4ff] text-[#1f3b77]"
                  : done
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-400",
              )}
            >
              {done ? (
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
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
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [aiOffer, setAiOffer] = useState("");
  const [aiDuration, setAiDuration] = useState("");
  const [aiTone, setAiTone] = useState("amical");
  const [aiVariants, setAiVariants] = useState<string[]>([]);
  const [selectedAiVariant, setSelectedAiVariant] = useState<string | null>(
    null,
  );
  const [messageUrl, setMessageUrl] = useState("");

  const unicode = isUnicode(sms);
  const parts = smsPartsFor(sms);
  const len = [...sms].length;
  const recipients = Math.max(0, recipientCount);
  const totalCredits = parts * recipients;

  const displaySender = sanitizeSender(sender).trim() || "BOULANGERIE";
  const displayTitle = title.trim() || buildDefaultCampaignTitle();
  const hasEnoughCredits = totalCredits <= creditsAvailable;

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
    [filteredContacts],
  );

  useEffect(() => {
    setConfirmError(null);
  }, [sms, recipientCount, sendMode]);

  useEffect(() => {
    const match = sms.match(/https?:\/\/[^\s]+/i);
    setMessageUrl(match?.[0] ?? "");
  }, [sms]);

  const toggleGroup = useCallback(
    (groupName: string) => {
      setSelectedGroupNames((prev) =>
        prev.includes(groupName)
          ? prev.filter((x) => x !== groupName)
          : [...prev, groupName],
      );
    },
    [setSelectedGroupNames],
  );

  const toggleContact = useCallback(
    (id: string) => {
      setSelectedContactIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    },
    [setSelectedContactIds],
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
          .trim(),
      );
      return;
    }
    setSms(ensureStopMention(sms || ""));
  }, [sms, setSms]);

  const insertEmoji = useCallback(
    (emoji: string) => {
      setSms(`${sms}${emoji}`);
    },
    [sms, setSms],
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
        e instanceof Error ? e.message : "Enregistrement impossible.",
      );
    } finally {
      setConfirmLoading(false);
    }
  }, [onConfirmCampaign, go]);

  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [stepWarnings, setStepWarnings] = useState<string[]>([]);

  const destinatairesLabel =
    recipients === 1
      ? "1 destinataire"
      : `${formatInt(recipients)} destinataires`;

  const hasStopMention = /stop/i.test(sms);
  const maxSmsLen = 918;
  const scheduleInPast =
    sendMode === "sched" &&
    !!scheduleAt &&
    isParisDateInPast(scheduleAt);

  useEffect(() => {
    setStepErrors([]);
    setStepWarnings([]);
  }, [step, recipients, sms, sender, sendMode, scheduleAt]);

  const validateStep1 = useCallback((): boolean => {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!title.trim()) errors.push("Le nom de la campagne est requis.");
    if (recipients === 0)
      errors.push("Sélectionne au moins un destinataire éligible.");
    setStepErrors(errors);
    setStepWarnings(warnings);
    return errors.length === 0;
  }, [title, recipients]);

  const validateStep2 = useCallback((): boolean => {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!sms.trim()) errors.push("Le message SMS ne peut pas être vide.");
    if ([...sms].length > maxSmsLen)
      errors.push(`Le message dépasse la limite de ${maxSmsLen} caractères.`);
    if (!hasStopMention)
      warnings.push(
        "Le message ne contient pas de mention STOP. Elle est obligatoire en France.",
      );
    if (!hasEnoughCredits)
      errors.push(
        `Crédits insuffisants : ${formatInt(totalCredits)} nécessaires, ${formatInt(creditsAvailable)} disponibles.`,
      );
    setStepErrors(errors);
    setStepWarnings(warnings);
    return errors.length === 0;
  }, [sms, hasStopMention, hasEnoughCredits, totalCredits, creditsAvailable]);

  const validateStep3 = useCallback((): boolean => {
    const errors: string[] = [];
    if (!sanitizeSender(sender).trim())
      errors.push("Le nom d\u0027expéditeur est requis (11 car. max).");
    if (scheduleInPast)
      errors.push("La date de programmation est dans le passé.");
    if (!hasEnoughCredits)
      errors.push(
        `Crédits insuffisants : ${formatInt(totalCredits)} nécessaires, ${formatInt(creditsAvailable)} disponibles.`,
      );
    if (recipients === 0)
      errors.push("Aucun destinataire éligible sélectionné.");
    if (!sms.trim()) errors.push("Le message SMS est vide.");
    setStepErrors(errors);
    return errors.length === 0;
  }, [
    sender,
    scheduleInPast,
    hasEnoughCredits,
    totalCredits,
    creditsAvailable,
    recipients,
    sms,
  ]);

  const handleNext = useCallback(() => {
    if (step === 1 && validateStep1()) go("nouvelle-campagne-2");
    if (step === 2 && validateStep2()) go("nouvelle-campagne-3");
  }, [step, validateStep1, validateStep2, go]);

  const handleConfirmWithValidation = useCallback(async () => {
    if (!validateStep3()) return;
    await handleConfirm();
  }, [validateStep3, handleConfirm]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Header with stepper + nav */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Stepper current={step} />
        <div className="flex items-center gap-2">
          <ProtoBtn
            onClick={() => {
              if (step === 1) go("campagnes");
              else go(`nouvelle-campagne-${step - 1}`);
            }}
          >
            {step === 1 ? (
              "Annuler"
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </>
            )}
          </ProtoBtn>
          {step < 3 && (
            <ProtoBtn primary onClick={handleNext}>
              Suivant
              <ChevronRight className="h-4 w-4" />
            </ProtoBtn>
          )}
          {step === 3 && (
            <ProtoBtn
              primary
              disabled={confirmLoading}
              onClick={handleConfirmWithValidation}
            >
              {confirmLoading
                ? "Envoi…"
                : sendMode === "sched"
                  ? "Programmer l\u0027envoi"
                  : "Confirmer l\u0027envoi"}
            </ProtoBtn>
          )}
        </div>
      </div>

      {/* Errors & warnings */}
      {stepErrors.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          {stepErrors.map((e, i) => (
            <p key={i} className="m-0 text-sm font-bold text-rose-800">
              {e}
            </p>
          ))}
        </div>
      )}
      {stepWarnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          {stepWarnings.map((w, i) => (
            <p key={i} className="m-0 text-sm font-bold text-amber-800">
              {w}
            </p>
          ))}
        </div>
      )}

      {/* Step 1 — Destinataires */}
      {step === 1 && (
        <div className="flex flex-col gap-3">
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
              <div
                className={cn(
                  innerInput,
                  stepErrors.length > 0 && !title.trim() && "border-rose-300 ring-2 ring-rose-100",
                )}
              >
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
                          m.id as "manual" | "lists" | "all" | "numbers",
                        )
                      }
                      className={cn(
                        "cursor-pointer rounded-xl border px-3 py-2 text-sm font-extrabold transition-colors",
                        recipientMode === m.id
                          ? "border-[#2f6fed] bg-[#eef4ff] text-[#1f3b77]"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
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
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
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
                <div className="mt-2.5 flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-transparent px-3 text-sm font-semibold text-slate-500">
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
                    className="mt-3 min-h-[150px] w-full resize-y rounded-xl border border-slate-200 bg-transparent p-3 text-sm font-semibold text-slate-900 outline-none"
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
                    <div className="mt-3 max-h-[320px] overflow-auto rounded-xl border border-slate-200">
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
                                : "cursor-pointer bg-white",
                            )}
                          >
                            <span className="min-w-0">
                              <span
                                className={cn(
                                  "block truncate font-extrabold",
                                  isUnsubscribed
                                    ? "text-slate-400"
                                    : "text-slate-900",
                                )}
                              >
                                {c.name}
                              </span>
                              <span
                                className={cn(
                                  "block truncate text-xs font-semibold",
                                  isUnsubscribed
                                    ? "text-slate-400"
                                    : "text-slate-500",
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
                              disabled={
                                recipientMode === "all" || isUnsubscribed
                              }
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
              <h2 className="m-0 text-base font-black">
                Confiance de ciblage
              </h2>
              <p className="mt-3 text-sm font-bold text-slate-600">
                Sélection brute :{" "}
                <strong>{recipientSelectedRaw}</strong>
              </p>
              <p className="mt-1 text-sm font-bold text-slate-600">
                Exclus STOP :{" "}
                <strong>{recipientExcludedStop}</strong>
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
        </div>
      )}

      {/* Step 2 — Message */}
      {step === 2 && (
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
                      : "border-slate-200 bg-white text-slate-700",
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
                      : "border-slate-200 bg-white text-slate-700",
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
                              : "border-slate-200",
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
                className={cn(
                  "mt-2 min-h-[140px] w-full resize-none rounded-2xl border bg-transparent p-3.5 text-sm font-extrabold text-slate-900 outline-none",
                  stepErrors.length > 0 && !sms.trim()
                    ? "border-rose-300 ring-2 ring-rose-100"
                    : "border-[#dfe6f2]",
                )}
                value={sms}
                onChange={(e) => setSms(e.target.value)}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  className="h-10 min-w-[260px] flex-1 rounded-xl border border-slate-200 bg-transparent px-3 text-sm font-semibold text-slate-900 outline-none"
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
                <ProtoBtn
                  className="h-9 px-3 text-xs"
                  onClick={toggleStopText}
                >
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

          {/* Phone preview */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="mx-auto max-w-[360px] rounded-[26px] border border-slate-300 bg-white p-3 shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
              <div className="mb-2 text-center text-[11px] font-black text-slate-400">
                Aperçu
              </div>
              <div className="rounded-2xl border border-slate-200 bg-[#f8fbff] p-3 text-[13px] font-extrabold leading-snug text-slate-900">
                {sms || "—"}
              </div>
              <div className="mt-2 text-center text-xs font-extrabold text-slate-500">
                {displaySender}
              </div>
            </div>
            <div className="mt-3 text-center text-sm font-bold text-slate-500">
              {destinatairesLabel}
            </div>
          </div>
        </div>
      )}

      {/* Step 3 — Confirmation */}
      {step === 3 && (
        <div className="flex flex-col gap-3">
          {confirmError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
              {confirmError}
            </div>
          )}

          <div className="grid grid-cols-[0.9fr_1.1fr] gap-3.5 max-[1100px]:grid-cols-1">
            {/* Phone preview */}
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

            {/* Recap */}
            <div className="space-y-3">
              <div className={fieldBox}>
                <h2 className="m-0 text-base font-black">Récapitulatif</h2>
                <div className="mt-3 grid gap-2">
                  <div className="flex justify-between gap-3 text-sm font-extrabold">
                    <span className="text-slate-600">Campagne</span>
                    <strong className="text-right">{displayTitle}</strong>
                  </div>
                  <div className="flex justify-between gap-3 text-sm font-extrabold">
                    <span className="text-slate-600">Expéditeur</span>
                    <strong>{displaySender}</strong>
                  </div>
                  <div className="flex justify-between gap-3 text-sm font-extrabold">
                    <span className="text-slate-600">Destinataires</span>
                    <strong>{destinatairesLabel}</strong>
                  </div>
                  <div className="flex justify-between gap-3 text-sm font-extrabold">
                    <span className="text-slate-600">Segments / SMS</span>
                    <strong>
                      {parts} ({unicode ? "Unicode" : "GSM-7"})
                    </strong>
                  </div>
                  <div className="my-1 h-px bg-slate-200" />
                  <div className="flex justify-between gap-3 text-sm font-extrabold">
                    <span className="text-slate-600">Coût total</span>
                    <strong
                      className={cn(
                        hasEnoughCredits ? "text-slate-900" : "text-rose-700",
                      )}
                    >
                      {formatInt(totalCredits)} crédit{totalCredits !== 1 && "s"}
                    </strong>
                  </div>
                  <div className="flex justify-between gap-3 text-sm font-extrabold">
                    <span className="text-slate-600">Solde disponible</span>
                    <strong>{formatInt(creditsAvailable)} crédit{creditsAvailable !== 1 && "s"}</strong>
                  </div>
                  <div className="flex justify-between gap-3 text-sm font-extrabold">
                    <span className="text-slate-600">Crédits restants après envoi</span>
                    <strong
                      className={cn(
                        hasEnoughCredits ? "text-emerald-700" : "text-rose-700",
                      )}
                    >
                      {formatInt(creditsAvailable - totalCredits)} crédit{(creditsAvailable - totalCredits) !== 1 && "s"}
                    </strong>
                  </div>
                </div>
                {!hasEnoughCredits && (
                  <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-extrabold text-rose-800">
                    Crédits insuffisants : recharge le compte avant
                    l&apos;envoi.
                  </p>
                )}
                {recipients === 0 && (
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-extrabold text-amber-800">
                    Aucun destinataire éligible sélectionné.
                  </p>
                )}
              </div>

              {/* Send mode + scheduling */}
              <div className={fieldBox}>
                <h2 className="m-0 text-base font-black">
                  Mode d&apos;envoi
                </h2>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSendMode("now")}
                    className={cn(
                      "flex min-w-[200px] flex-1 cursor-pointer items-start gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-[0_10px_22px_rgba(15,23,42,0.08)]",
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
                      "flex min-w-[200px] flex-1 cursor-pointer items-start gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-[0_10px_22px_rgba(15,23,42,0.08)]",
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
                        Choisir date et heure
                      </span>
                    </span>
                  </button>
                </div>
                {sendMode === "sched" && (
                  <div className="mt-3">
                    <label className="text-xs font-bold text-slate-500">
                      Date de programmation
                    </label>
                    <SchedulePicker
                      value={scheduleAt}
                      onChange={setScheduleAt}
                      hasError={stepErrors.length > 0 && scheduleInPast}
                    />
                    {scheduleInPast && (
                      <p className="mt-1.5 text-xs font-bold text-rose-600">
                        Cette date est dans le passé.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Sender */}
              <div className={fieldBox}>
                <label className={fieldLabel}>
                  <span>Expéditeur</span>
                  <span className="text-xs text-slate-500">
                    {sanitizeSender(sender).length}/11
                  </span>
                </label>
                <div
                  className={cn(
                    innerInput,
                    stepErrors.length > 0 && !sanitizeSender(sender).trim() && "border-rose-300 ring-2 ring-rose-100",
                  )}
                >
                  <input
                    className={innerInp}
                    maxLength={11}
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    placeholder="BOULANGERIE"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
