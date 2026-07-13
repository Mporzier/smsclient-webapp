"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import type { ContactFormSubmitPayload } from "@/lib/supabase/clients";
import { formatFrPhoneInput, isValidFrMobile } from "@/lib/proto/smsUtils";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useState } from "react";
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
import { innerTextareaSm } from "@/components/smsclient/flowFieldStyles";
import {
  brandBtnCls,
  brandBtnPrimaryCls,
  brandInputCls,
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  modalCloseBtnCompact,
} from "./modalChrome";
import {
  contactFormSnapshotsEqual,
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
  birthday: string;
  setBirthday: (v: string) => void;
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

const fieldShell =
  "rounded-xl border border-border bg-card p-2.5 shadow-[0_8px_18px_rgba(15,23,42,0.06)]";

const inpText =
  "w-full border-none bg-transparent text-[13px] font-normal text-foreground outline-none placeholder:text-muted-foreground placeholder:font-normal";

const modalTitleCls = "text-base font-semibold tracking-tight text-foreground";
const fieldLabelCls = "text-xs font-semibold text-foreground";
const fieldMetaCls = "text-[11px] font-normal text-muted-foreground";
const labelIconBadgeCls =
  "grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border bg-gradient-to-br from-blue-50 to-indigo-50 text-ring";
const hintTextCls = "text-[11px] font-normal leading-snug text-muted-foreground";
const errorTextCls = "text-xs font-medium text-destructive";
const newGroupBtnCls =
  "w-full !h-9 !justify-center !gap-2 !text-xs !font-medium !border-ring/50 !bg-gradient-to-br !from-blue-50 !via-indigo-50/80 !to-blue-50/60 !text-ring !shadow-[0_0_0_1px_rgba(47,111,237,0.12),0_6px_18px_rgba(47,111,237,0.16)] hover:!border-ring hover:!from-blue-50 hover:!to-indigo-50 hover:!shadow-[0_0_0_1px_rgba(47,111,237,0.2),0_8px_22px_rgba(47,111,237,0.22)]";

function FrFlagIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 3 2"
      className={cn(
        "h-3 w-[18px] shrink-0 overflow-hidden rounded-[2px] border border-border/60 shadow-sm",
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
  birthday,
  setBirthday,
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
        "Indiquez un numéro mobile français à 10 chiffres (ex. 06 12 34 56 78)."
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
        birthday,
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
    birthday,
    notes,
    groups,
    consentSnapshot,
  ]);

  const formSnapshot: ContactFormSnapshot = {
    first,
    last,
    phone,
    birthday,
    notes,
    groups,
  };
  const isDirty = useModalFormDirty(
    open,
    formSnapshot,
    contactFormSnapshotsEqual
  );

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
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && !saving && !confirmUnsubscribeOpen) handleClose();
        }}
      >
        <DialogContent
          showCloseButton={false}
          overlayClassName={dialogOverlayCls}
          className={cn(
            formDialogContentCls,
            "h-[min(86dvh,760px)] max-h-[min(86dvh,760px)] sm:max-w-[640px]",
            dialogContentZCls
          )}
          onPointerDownOutside={(e) => {
            if (saving || isDirty || confirmUnsubscribeOpen) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (saving || isDirty || confirmUnsubscribeOpen) e.preventDefault();
          }}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-gradient-to-br from-blue-50 to-indigo-50 text-ring shadow-[0_8px_16px_rgba(47,111,237,0.12)]"
                aria-hidden
              >
                <UserPlus className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <DialogTitle className={cn("m-0 min-w-0", modalTitleCls)}>
                {dialogLabel}
              </DialogTitle>
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

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/50">
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {validationError && (
                <p
                  className={cn(
                    "rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5",
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
                  <Label className="flex justify-between gap-2">
                    <span className={fieldLabelCls}>
                      Prénom <span className="text-destructive">*</span>
                    </span>
                    <span className={fieldMetaCls}>{first.length}/30</span>
                  </Label>
                  <Input
                    className={cn(brandInputCls, "mt-1.5 h-9 text-[13px] font-normal")}
                    maxLength={30}
                    value={first}
                    onChange={(e) => {
                      setFirst(e.target.value);
                      setValidationError(null);
                    }}
                  />
                </div>
                <div className={fieldShell}>
                  <Label className="flex justify-between gap-2">
                    <span className={fieldLabelCls}>Nom</span>
                    <span className={fieldMetaCls}>{last.length}/30</span>
                  </Label>
                  <Input
                    className={cn(brandInputCls, "mt-1.5 h-9 text-[13px] font-normal")}
                    maxLength={30}
                    value={last}
                    onChange={(e) => setLast(e.target.value)}
                  />
                </div>
              </div>

              <div className={fieldShell}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label className={fieldLabelCls} htmlFor="contact-create-phone">
                    Téléphone <span className="text-destructive">*</span>
                  </Label>
                  <span
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                    title="Numéro mobile français : 10 chiffres, commence par 0 (ex. 06 12 34 56 78)."
                  >
                    <FrFlagIcon />
                    France
                  </span>
                </div>
                <div
                  className={cn(
                    "mt-1.5 flex h-9 items-center gap-3 rounded-lg border border-border bg-transparent py-0 pl-1 pr-2 transition-[border-color,box-shadow]",
                    phoneInvalid &&
                      "border-destructive shadow-[inset_0_0_0_1px_rgba(244,63,94,0.35)]"
                  )}
                >
                  <div
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-gradient-to-br from-blue-50 to-indigo-50 text-ring shadow-[0_2px_6px_rgba(47,111,237,0.08)]",
                      phoneInvalid &&
                        "border-rose-200 from-rose-50 to-rose-50/80 text-rose-500"
                    )}
                    aria-hidden
                  >
                    <Phone className="h-4 w-4" strokeWidth={2.25} />
                  </div>
                  <Input
                    id="contact-create-phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    enterKeyHint="done"
                    placeholder="06 12 34 56 78"
                    maxLength={14}
                    className={cn(
                      brandInputCls,
                      "h-auto min-w-0 border-none bg-transparent px-0 text-[13px] font-normal shadow-none focus-visible:ring-0"
                    )}
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
                    className={cn("mt-1.5", hintTextCls, "text-destructive")}
                  >
                    Indiquez un mobile à 10 chiffres (ex. 06 12 34 56 78).
                  </p>
                )}
              </div>

              <div className={fieldShell}>
                <Label className={fieldLabelCls} htmlFor="contact-create-birthday">
                  Anniversaire
                </Label>
                <Input
                  id="contact-create-birthday"
                  name="birthday"
                  type="date"
                  className={cn(brandInputCls, "mt-1.5 h-9 text-[13px] font-normal")}
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
                <p className={cn("mt-1.5", hintTextCls)}>Optionnel</p>
              </div>

              <div className={fieldShell}>
                <label className="flex justify-between gap-2">
                  <span className={fieldLabelCls}>Notes</span>
                  <span className={fieldMetaCls}>{notes.length}/280</span>
                </label>
                <div className={cn(innerTextareaSm, "mt-1.5")}>
                  <textarea
                    className="min-h-[52px] w-full resize-y border-none bg-transparent text-[13px] font-normal leading-snug text-foreground outline-none placeholder:text-muted-foreground placeholder:font-normal"
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
                <div className="mt-1.5 max-h-[min(36vh,280px)] overflow-y-auto rounded-lg border border-border bg-muted/50 p-2.5">
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
                                ? "border-ring bg-accent/90 text-ring shadow-[0_4px_14px_rgba(47,111,237,0.12)] ring-1 ring-ring/20"
                                : "border-border bg-card text-foreground hover:border-border hover:bg-muted/80"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                                selected
                                  ? "border-ring bg-primary text-primary-foreground"
                                  : "border-border/80 bg-card/80"
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
                  <Button
                    type="button"
                    variant="outline"
                    className={newGroupBtnCls}
                    onClick={() => {
                      onCreateGroupRequest();
                    }}
                  >
                    <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
                    Nouveau groupe…
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {saveError && (
            <div
              className={cn(
                "shrink-0 border-t border-destructive/30 bg-destructive/10 px-4 py-2",
                errorTextCls
              )}
            >
              {saveError}
            </div>
          )}

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-card px-4 py-3">
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
              <Button
                type="button"
                variant="outline"
                size="lg"
                className={brandBtnCls}
                disabled={saving}
                onClick={handleClose}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="default"
                size="lg"
                className={brandBtnPrimaryCls}
                disabled={saving}
                onClick={() => void handleFinalSave()}
              >
                {saving
                  ? "Enregistrement…"
                  : mode === "edit"
                  ? "Enregistrer"
                  : "Enregistrer le contact"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  );
}
