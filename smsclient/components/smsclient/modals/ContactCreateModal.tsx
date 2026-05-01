"use client";

import { cn } from "@/lib/cn";
import { ProtoBtn } from "@/components/smsclient/ui";
import type { ContactFormSubmitPayload } from "@/lib/supabase/clients";
import { isValidFrMobile, normalizeFRPhone } from "@/lib/proto/smsUtils";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { overlayCls } from "./modalChrome";

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
};

const shellCls =
  "flex h-[min(86dvh,760px)] max-h-[min(86dvh,760px)] w-full max-w-[640px] flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.20)]";

const fieldShell =
  "rounded-xl border border-slate-200 bg-white p-2.5 shadow-[0_8px_18px_rgba(15,23,42,0.06)]";

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
}: ContactCreateModalProps) {
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
  }, [
    onSaveContact,
    onClose,
    first,
    last,
    phone,
    notes,
    groups,
    consentSnapshot,
  ]);

  if (!open) return null;

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneInvalid = phoneDigits.length > 0 && !isValidFrMobile(phone);

  const dialogLabel =
    mode === "edit" ? "Modifier le contact" : "Ajouter un contact";

  return (
    <div
      className={overlayCls}
      role="dialog"
      aria-modal
      aria-label={dialogLabel}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={shellCls}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <div>
            <div className="text-base font-black text-slate-900">
              {mode === "edit" ? "Modifier le contact" : "Ajouter un contact"}
            </div>
          </div>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-base font-black shadow-[0_8px_16px_rgba(15,23,42,0.08)]"
            aria-label="Fermer"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50">
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
            {validationError && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-900">
                {validationError}
              </p>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className={fieldShell}>
                <label className="flex justify-between text-[12px] font-black">
                  <span>
                    Prénom <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {first.length}/30
                  </span>
                </label>
                <div className="mt-1.5 flex h-9 items-center rounded-lg border border-[#dfe6f2] bg-slate-50 px-2.5">
                  <input
                    className="w-full border-none bg-transparent text-[13px] font-extrabold outline-none"
                    maxLength={30}
                    value={first}
                    onChange={(e) => setFirst(e.target.value)}
                  />
                </div>
              </div>
              <div className={fieldShell}>
                <label className="flex justify-between text-[12px] font-black">
                  <span>Nom</span>
                  <span className="text-[11px] text-slate-500">
                    {last.length}/30
                  </span>
                </label>
                <div className="mt-1.5 flex h-9 items-center rounded-lg border border-[#dfe6f2] bg-slate-50 px-2.5">
                  <input
                    className="w-full border-none bg-transparent text-[13px] font-extrabold outline-none"
                    maxLength={30}
                    value={last}
                    onChange={(e) => setLast(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={fieldShell}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  className="text-[12px] font-black"
                  htmlFor="contact-create-phone"
                >
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <span
                  className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-600"
                  title="Numéro mobile français : 10 chiffres, commence par 0 (ex. 06 12 34 56 78). +33 accepté."
                >
                  France
                </span>
              </div>
              <div
                className={cn(
                  "mt-1.5 flex h-9 items-center rounded-lg border px-2.5 transition-[border-color,box-shadow,background-color]",
                  phoneInvalid
                    ? "border-rose-400 bg-rose-50/90 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.35)]"
                    : "border-[#dfe6f2] bg-slate-50"
                )}
              >
                <input
                  id="contact-create-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  enterKeyHint="done"
                  placeholder="06 12 34 56 78"
                  className="w-full min-w-0 border-none bg-transparent text-[13px] font-extrabold text-slate-900 outline-none placeholder:text-slate-400"
                  value={phone}
                  onChange={(e) => setPhone(normalizeFRPhone(e.target.value))}
                  aria-invalid={phoneInvalid}
                  aria-describedby={
                    phoneInvalid ? "contact-create-phone-err" : undefined
                  }
                />
              </div>
              {phoneInvalid && (
                <p
                  id="contact-create-phone-err"
                  className="mt-1.5 text-[11px] font-bold leading-snug text-rose-700"
                >
                  Indique un mobile à 10 chiffres (0 puis 6 ou 7…). Tu peux
                  saisir +33… : il sera normalisé.
                </p>
              )}
            </div>

            <div className={fieldShell}>
              <label className="flex justify-between text-[12px] font-black">
                <span>Notes</span>
                <span className="text-[11px] text-slate-500">
                  {notes.length}/280
                </span>
              </label>
              <div className="mt-1.5 rounded-lg border border-[#dfe6f2] bg-slate-50 px-2.5 py-2">
                <textarea
                  className="min-h-[52px] w-full resize-y border-none bg-transparent text-[13px] font-semibold leading-snug text-slate-900 outline-none placeholder:text-slate-400"
                  maxLength={280}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Optionnel — contexte, préférences…"
                />
              </div>
            </div>

            <div className={fieldShell}>
              <label className="text-[12px] font-black">Groupes</label>
              <div className="mt-1.5 max-h-[min(32vh,220px)] overflow-y-auto rounded-lg border border-[#dfe6f2] bg-slate-50 p-2">
                {groupOptions.length === 0 ? (
                  <p className="m-0 text-[11px] font-bold text-slate-500">
                    Aucun groupe — crée-en un ci-dessous.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {groupOptions.map((g) => (
                      <label
                        key={g}
                        className="flex cursor-pointer items-center gap-2 text-[13px] font-extrabold text-slate-800"
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-[#2f6fed] focus:ring-[#2f6fed]"
                          checked={groups.includes(g)}
                          onChange={() => toggleContactGroup(g)}
                        />
                        {g}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-2">
                <ProtoBtn
                  className="w-full !h-9 !justify-center !text-[12px]"
                  onClick={() => {
                    onCreateGroupRequest();
                  }}
                >
                  + Nouveau groupe…
                </ProtoBtn>
              </div>
            </div>
          </div>
        </div>

        {saveError && (
          <div className="shrink-0 border-t border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-900">
            {saveError}
          </div>
        )}

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3">
          <ProtoBtn disabled={saving} onClick={onClose}>
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
  );
}
