"use client";

import { cn } from "@/lib/cn";
import { ProtoBtn } from "@/components/smsclient/ui";
import type { ContactFormSubmitPayload } from "@/lib/supabase/clients";
import { formatFrPhoneInput, isValidFrMobile } from "@/lib/proto/smsUtils";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";
import { ConfirmUnsubscribeModal } from "./ConfirmUnsubscribeModal";
import {
  BellOff,
  Check,
  Phone,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  innerInputSm,
  innerTextareaSm,
} from "@/components/smsclient/flowFieldStyles";
import { modalCloseBtnCompact, overlayCls } from "./modalChrome";
import {
  contactFormSnapshotsEqual,
  handleModalBackdropClick,
  useModalFormDirty,
  type ContactFormSnapshot,
} from "./modalFormGuard";

export type ContactCreateModalProps = {
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
  consentDefaults?: { optIn: boolean; stop: boolean } | null;
  onSaveContact?: (payload: ContactFormSubmitPayload) => Promise<void>;
  onDeleteContact?: () => void;
  onUnsubscribeContact?: () => Promise<void>;
};

const shellCls =
  "flex h-[min(86dvh,760px)] max-h-[min(86dvh,760px)] w-full max-w-[640px] flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.20)]";

const fieldShell =
  "rounded-xl border border-slate-200 bg-white p-2.5 shadow-[0_8px_18px_rgba(15,23,42,0.06)]";

const inpText =
  "w-full border-none bg-transparent text-[13px] font-normal text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-normal";

const modalTitleCls = "text-base font-semibold tracking-tight text-slate-900";
const fieldLabelCls = "text-xs font-semibold text-slate-700";
const fieldMetaCls = "text-[11px] font-normal text-slate-500";
const labelIconBadgeCls =
  "grid h-6 w-6 shrink-0 place-items-center rounded-md border border-[#dfe6f2] bg-gradient-to-br from-blue-50 to-indigo-50 text-[#2f6fed]";
const hintTextCls = "text-[11px] font-normal leading-snug text-slate-600";
const errorTextCls = "text-xs font-medium text-rose-800";
const newGroupBtnCls =
  "w-full !h-9 !justify-center !gap-2 !text-xs !font-medium !border-[#2f6fed]/50 !bg-gradient-to-br !from-blue-50 !via-indigo-50/80 !to-blue-50/60 !text-[#2f6fed] !shadow-[0_0_0_1px_rgba(47,111,237,0.12),0_6px_18px_rgba(47,111,237,0.16)] hover:!border-[#2f6fed] hover:!from-blue-50 hover:!to-indigo-50 hover:!shadow-[0_0_0_1px_rgba(47,111,237,0.2),0_8px_22px_rgba(47,111,237,0.22)]";

function FrFlagIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 3 2"
      className={cn(
        "h-3 w-[18px] shrink-0 overflow-hidden rounded-[2px] border border-slate-300/60 shadow-sm",
        className
      )}
      aria-hidden
    >
      <rect width="1" height="2" fill="#002395" />
      <rect x="1" width="1" height="2" fill="#ffffff" />
      <rect x="2" width="1" height="2" fill="#ef4135" />
    </svg>
  );
}

export function ContactCreateModal({
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
  onDeleteContact,
  onUnsubscribeContact,
}: ContactCreateModalProps) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [phoneBlurred, setPhoneBlurred] = useState(false);
  const [confirmUnsubscribeOpen, setConfirmUnsubscribeOpen] = useState(false);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSaveError(null);
      setValidationError(null);
      setPhoneBlurred(false);
      setConfirmUnsubscribeOpen(false);
    }
  }

  const handleClose = useCallback(() => {
    setSaveError(null);
    setValidationError(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  const consentSnapshot = useCallback((): { optIn: boolean; stop: boolean } => {
    if (mode === "edit" && consentDefaults) {
      return { optIn: consentDefaults.optIn, stop: consentDefaults.stop };
    }
    return { optIn: true, stop: false };
  }, [mode, consentDefaults]);

  const toggleContactGroup = useCallback(
    (g: string) => {
      setGroups((prev) =>
        prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
      );
    },
    [setGroups]
  );

  const handleFinalSave = useCallback(async () => {
    if (!first.trim()) {
      setValidationError("Le prénom est obligatoire.");
      return;
    }
    if (!isValidFrMobile(phone)) {
      setValidationError(
        "Indique un numéro mobile français à 10 chiffres (ex. 06 12 34 56 78)."
      );
      return;
    }
    setValidationError(null);
    if (!onSaveContact) {
      handleClose();
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
      handleClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }, [
    onSaveContact,
    handleClose,
    first,
    last,
    phone,
    notes,
    groups,
    consentSnapshot,
  ]);

  const formSnapshot: ContactFormSnapshot = {
    first,
    last,
    phone,
    notes,
    groups,
  };
  const isDirty = useModalFormDirty(
    open,
    formSnapshot,
    contactFormSnapshotsEqual
  );

  if (!open) return null;

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneInvalid =
    phoneBlurred && phoneDigits.length > 0 && !isValidFrMobile(phone);

  const isUnsubscribed =
    mode === "edit" &&
    consentDefaults != null &&
    (consentDefaults.stop || !consentDefaults.optIn);

  const contactLabel =
    [first.trim(), last.trim()].filter(Boolean).join(" ") || phone || "Contact";

  const dialogLabel =
    mode === "edit" ? "Modifier le contact" : "Ajouter un contact";

  return (
    <div
      className={overlayCls}
      role="dialog"
      aria-modal
      aria-label={dialogLabel}
      onClick={(e) =>
        handleModalBackdropClick(
          e,
          handleClose,
          isDirty,
          !saving && !confirmUnsubscribeOpen,
        )
      }
    >
      <div className={shellCls}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#dfe6f2] bg-gradient-to-br from-blue-50 to-indigo-50 text-[#2f6fed] shadow-[0_8px_16px_rgba(47,111,237,0.12)]"
              aria-hidden
            >
              <UserPlus className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <h2 className={cn("m-0 min-w-0", modalTitleCls)}>
              {mode === "edit" ? "Modifier le contact" : "Ajouter un contact"}
            </h2>
          </div>
          <button
            type="button"
            className={modalCloseBtnCompact}
            aria-label="Fermer"
            onClick={handleClose}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50">
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
            {validationError && (
              <p
                className={cn(
                  "rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5",
                  errorTextCls
                )}
              >
                {validationError}
              </p>
            )}

            {isUnsubscribed && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2">
                <BellOff
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                  aria-hidden
                />
                <p className={cn("m-0", hintTextCls, "text-amber-900")}>
                  Ce contact est désabonné : il ne recevra plus vos campagnes
                  SMS.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className={fieldShell}>
                <label className="flex justify-between gap-2">
                  <span className={fieldLabelCls}>
                    Prénom <span className="text-red-500">*</span>
                  </span>
                  <span className={fieldMetaCls}>{first.length}/30</span>
                </label>
                <div className={cn(innerInputSm, "mt-1.5 h-9")}>
                  <input
                    className={inpText}
                    maxLength={30}
                    value={first}
                    onChange={(e) => {
                      setFirst(e.target.value);
                      setValidationError(null);
                    }}
                  />
                </div>
              </div>
              <div className={fieldShell}>
                <label className="flex justify-between gap-2">
                  <span className={fieldLabelCls}>Nom</span>
                  <span className={fieldMetaCls}>{last.length}/30</span>
                </label>
                <div className={cn(innerInputSm, "mt-1.5 h-9")}>
                  <input
                    className={inpText}
                    maxLength={30}
                    value={last}
                    onChange={(e) => setLast(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={fieldShell}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className={fieldLabelCls} htmlFor="contact-create-phone">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <span
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600"
                  title="Numéro mobile français : 10 chiffres, commence par 0 (ex. 06 12 34 56 78)."
                >
                  <FrFlagIcon />
                  France
                </span>
              </div>
              <div
                className={cn(
                  "mt-1.5 flex h-9 items-center gap-3 rounded-lg border border-[#dfe6f2] bg-transparent py-0 pl-1 pr-2 transition-[border-color,box-shadow]",
                  phoneInvalid &&
                    "border-rose-400 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.35)]"
                )}
              >
                <div
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-md border border-[#dfe6f2] bg-gradient-to-br from-blue-50 to-indigo-50 text-[#2f6fed] shadow-[0_2px_6px_rgba(47,111,237,0.08)]",
                    phoneInvalid &&
                      "border-rose-200 from-rose-50 to-rose-50/80 text-rose-500"
                  )}
                  aria-hidden
                >
                  <Phone className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <input
                  id="contact-create-phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  enterKeyHint="done"
                  placeholder="06 12 34 56 78"
                  maxLength={14}
                  className={cn(inpText, "min-w-0")}
                  value={phone}
                  onChange={(e) => {
                    setPhone(formatFrPhoneInput(e.target.value));
                    setValidationError(null);
                  }}
                  onBlur={() => setPhoneBlurred(true)}
                  aria-invalid={phoneInvalid}
                  aria-describedby={
                    phoneInvalid ? "contact-create-phone-err" : undefined
                  }
                />
              </div>
              {phoneInvalid && (
                <p
                  id="contact-create-phone-err"
                  className={cn("mt-1.5", hintTextCls, "text-rose-700")}
                >
                  Indique un mobile à 10 chiffres (ex. 06 12 34 56 78).
                </p>
              )}
            </div>

            <div className={fieldShell}>
              <label className="flex justify-between gap-2">
                <span className={fieldLabelCls}>Notes</span>
                <span className={fieldMetaCls}>{notes.length}/280</span>
              </label>
              <div className={cn(innerTextareaSm, "mt-1.5")}>
                <textarea
                  className="min-h-[52px] w-full resize-y border-none bg-transparent text-[13px] font-normal leading-snug text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-normal"
                  maxLength={280}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Optionnel — contexte, préférences, informations utiles…"
                />
              </div>
            </div>

            <div className={fieldShell}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-1.5">
                  <span className={labelIconBadgeCls} aria-hidden>
                    <Users className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <span className={fieldLabelCls}>Groupes</span>
                </label>
                {groups.length > 0 && (
                  <span className={fieldMetaCls}>
                    {groups.length} sélectionné{groups.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="mt-1.5 max-h-[min(36vh,280px)] overflow-y-auto rounded-lg border border-[#dfe6f2] bg-slate-50/80 p-2.5">
                {groupOptions.length === 0 ? (
                  <p className={cn("m-0 px-1 py-2 text-center", hintTextCls)}>
                    Aucun groupe — crée-en un ci-dessous.
                  </p>
                ) : (
                  <div
                    className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                    role="group"
                    aria-label="Groupes du contact"
                  >
                    {groupOptions.map((g) => {
                      const selected = groups.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleContactGroup(g)}
                          className={cn(
                            "relative flex min-h-[42px] cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs font-medium leading-snug transition-all",
                            selected
                              ? "border-[#2f6fed] bg-blue-50/90 text-[#1e4fc4] shadow-[0_4px_14px_rgba(47,111,237,0.12)] ring-1 ring-blue-200/80"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/80"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                              selected
                                ? "border-[#2f6fed] bg-[#2f6fed] text-white"
                                : "border-slate-300/80 bg-white/80"
                            )}
                            aria-hidden
                          >
                            {selected && (
                              <Check className="h-3 w-3" strokeWidth={3} />
                            )}
                          </span>
                          <span className="min-w-0 flex-1 break-words">
                            {g}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="mt-2">
                <ProtoBtn
                  className={newGroupBtnCls}
                  onClick={() => {
                    onCreateGroupRequest();
                  }}
                >
                  <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
                  Nouveau groupe…
                </ProtoBtn>
              </div>
            </div>
          </div>
        </div>

        {saveError && (
          <div
            className={cn(
              "shrink-0 border-t border-rose-200 bg-rose-50 px-4 py-2",
              errorTextCls
            )}
          >
            {saveError}
          </div>
        )}

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {mode === "edit" && onDeleteContact && (
              <button
                type="button"
                disabled={saving}
                onClick={onDeleteContact}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Supprimer
              </button>
            )}
            {mode === "edit" && onUnsubscribeContact && !isUnsubscribed && (
              <button
                type="button"
                disabled={saving}
                onClick={() => setConfirmUnsubscribeOpen(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 transition-all hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <BellOff className="h-4 w-4" aria-hidden />
                Désabonner
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ProtoBtn disabled={saving} onClick={handleClose}>
              Annuler
            </ProtoBtn>
            <ProtoBtn
              primary
              disabled={saving}
              onClick={() => void handleFinalSave()}
            >
              {saving
                ? "Enregistrement…"
                : mode === "edit"
                ? "Enregistrer"
                : "Enregistrer le contact"}
            </ProtoBtn>
          </div>
        </div>
      </div>

      <ConfirmUnsubscribeModal
        open={confirmUnsubscribeOpen}
        contactLabel={contactLabel}
        onCancel={() => setConfirmUnsubscribeOpen(false)}
        onConfirm={async () => {
          if (!onUnsubscribeContact) return;
          await onUnsubscribeContact();
          setConfirmUnsubscribeOpen(false);
          handleClose();
        }}
      />
    </div>
  );
}
