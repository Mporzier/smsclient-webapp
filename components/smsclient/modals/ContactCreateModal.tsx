"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import {
  CONTACT_NOTES_MAX_LENGTH,
  PERSON_NAME_MAX_LENGTH,
  PHONE_DISPLAY_MAX_LENGTH,
} from "@/lib/forms/fieldLimits";
import { useI18n } from "@/lib/i18n";
import type { ContactFormSubmitPayload } from "@/lib/supabase/clients";
import { groupColor } from "@/lib/proto/contactDisplay";
import {
  caretAfterPhoneFormat,
  formatFrPhoneInput,
  isValidFrMobile,
  sanitizePersonName,
} from "@/lib/proto/smsUtils";
import { normalizeCustomFieldValue } from "@/lib/customFields/validate";
import { todayIsoLocal } from "@/lib/import/contactImportMap";
import type { CustomFieldDef } from "@/lib/types/customFields";
import type { CustomFieldValues } from "@/lib/types/customFields";
import type { ContactGroupOption } from "@/lib/types/group";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { useCallback, useState } from "react";
import { ConfirmUnsubscribeModal } from "./ConfirmUnsubscribeModal";
import { ContactCustomFieldsList } from "./ContactCustomFieldsList";
import {
  BellOff,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  modalIconCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";
import { hasStackedOpenDialog } from "./modalFormGuard";

export type ContactCreateModalProps = {
  open: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  /** Seeds à l’ouverture — draft local ensuite (perf). */
  first: string;
  last: string;
  phone: string;
  birthday: string;
  notes: string;
  customFieldDefs?: CustomFieldDef[];
  customFields: CustomFieldValues;
  groups: string[];
  setGroups: Dispatch<SetStateAction<string[]>>;
  groupOptions: ContactGroupOption[];
  onCreateGroupRequest: () => void;
  consentDefaults?: { optIn: boolean; stop: boolean } | null;
  onSaveContact?: (payload: ContactFormSubmitPayload) => Promise<void>;
  onDeleteContact?: () => void;
  onUnsubscribeContact?: () => Promise<void>;
};

const fieldLabelCls = "text-xs font-semibold text-foreground";
const fieldMetaCls = "text-xs font-normal text-muted-foreground";
const hintTextCls = "text-xs font-normal leading-snug text-muted-foreground";
/** Ring Input UI trop épais en Dialog — border + ring-0 comme Import. */
const modalFieldCls =
  "focus-visible:outline-none focus-visible:ring-0 aria-invalid:ring-0";

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
  first: seedFirst,
  last: seedLast,
  phone: seedPhone,
  birthday: seedBirthday,
  notes: seedNotes,
  customFieldDefs = [],
  customFields,
  groups,
  setGroups,
  groupOptions,
  onCreateGroupRequest,
  consentDefaults,
  onSaveContact,
  onDeleteContact,
  onUnsubscribeContact,
}: ContactCreateModalProps) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [firstError, setFirstError] = useState<string | null>(null);
  const [phoneSubmitError, setPhoneSubmitError] = useState<string | null>(null);
  const [customErrors, setCustomErrors] = useState<Record<string, string>>({});
  const [phoneBlurred, setPhoneBlurred] = useState(false);
  const [confirmUnsubscribeOpen, setConfirmUnsubscribeOpen] = useState(false);
  const [first, setFirst] = useState(() => sanitizePersonName(seedFirst));
  const [last, setLast] = useState(() => sanitizePersonName(seedLast));
  const [phone, setPhone] = useState(seedPhone);
  const [birthday, setBirthday] = useState(seedBirthday);
  const [notes, setNotes] = useState(seedNotes);
  const [draftCustomFields, setDraftCustomFields] = useState<CustomFieldValues>(
    {}
  );

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSaveError(null);
      setFirstError(null);
      setPhoneSubmitError(null);
      setCustomErrors({});
      setPhoneBlurred(false);
      setConfirmUnsubscribeOpen(false);
      setFirst(sanitizePersonName(seedFirst));
      setLast(sanitizePersonName(seedLast));
      setPhone(seedPhone);
      setBirthday(seedBirthday);
      setNotes(seedNotes);
      setDraftCustomFields({ ...customFields });
    }
  }

  const handlePhoneChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const raw = input.value;
      const caret = input.selectionStart ?? raw.length;
      const formatted = formatFrPhoneInput(raw);
      // Écrit la valeur formatée avant React pour que le caret reste sur le
      // chiffre édité au lieu de sauter en fin de champ.
      const nextCaret = caretAfterPhoneFormat(raw, caret, formatted);
      input.value = formatted;
      input.setSelectionRange(nextCaret, nextCaret);
      setPhone(formatted);
      setPhoneSubmitError(null);
    },
    [],
  );

  const handleClose = useCallback(() => {
    setSaveError(null);
    setFirstError(null);
    setPhoneSubmitError(null);
    setCustomErrors({});
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
    const nextFirstError = !first.trim() ? t("contact.modal.errFirst") : null;
    const nextPhoneError = !isValidFrMobile(phone)
      ? t("contact.modal.phoneHint")
      : null;
    const nextCustom: Record<string, string> = {};
    const normalizedCustom: CustomFieldValues = {};
    for (const def of customFieldDefs) {
      const normalized = normalizeCustomFieldValue(
        draftCustomFields[def.id] ?? "",
        def.fieldType
      );
      if (normalized === null) {
        nextCustom[def.id] =
          def.fieldType === "date"
            ? t("contact.modal.errDate")
            : def.fieldType === "number"
            ? t("contact.modal.errNumber")
            : t("contact.modal.errValue");
        continue;
      }
      if (normalized) normalizedCustom[def.id] = normalized;
    }
    setFirstError(nextFirstError);
    setPhoneSubmitError(nextPhoneError);
    setCustomErrors(nextCustom);
    if (
      nextFirstError ||
      nextPhoneError ||
      Object.keys(nextCustom).length > 0
    ) {
      if (nextPhoneError) setPhoneBlurred(true);
      return;
    }
    if (!onSaveContact) {
      handleClose();
      return;
    }
    const { optIn, stop } = consentSnapshot();
    setSaveError(null);
    setSaving(true);
    try {
      await onSaveContact({
        firstName: sanitizePersonName(first).trim(),
        lastName: sanitizePersonName(last).trim(),
        phoneDisplay: phone,
        groupLabels: groups,
        birthday,
        notes,
        customFields: normalizedCustom,
        optIn,
        stop,
      });
      handleClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("common.errorOccurred");
      if (
        msg.includes("déjà enregistré") ||
        msg.toLowerCase().includes("already")
      ) {
        setPhoneSubmitError(msg);
        setPhoneBlurred(true);
      } else {
        setSaveError(msg);
      }
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
    customFieldDefs,
    draftCustomFields,
    groups,
    consentSnapshot,
    t,
  ]);

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneInvalid =
    (phoneBlurred && phoneDigits.length > 0 && !isValidFrMobile(phone)) ||
    Boolean(phoneSubmitError);
  const phoneErrorMsg =
    phoneSubmitError ?? (phoneInvalid ? t("contact.modal.phoneHint") : null);

  const isUnsubscribed =
    mode === "edit" &&
    consentDefaults != null &&
    (consentDefaults.stop || !consentDefaults.optIn);

  const contactLabel =
    [first.trim(), last.trim()].filter(Boolean).join(" ") ||
    phone ||
    t("contact.modal.fallbackName");

  const dialogLabel =
    mode === "edit" ? t("contact.modal.edit") : t("contacts.add");

  const HeaderIcon = mode === "edit" ? Pencil : UserPlus;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            if (saving || hasStackedOpenDialog()) return;
            handleClose();
          }
        }}
      >
        <DialogContent
          showCloseButton={!saving}
          overlayClassName={dialogOverlayCls}
          className={cn(
            formDialogContentCls,
            "h-[min(86dvh,760px)] max-h-[min(86dvh,760px)] rounded-xl shadow-lg sm:max-w-[640px]",
            dialogContentZCls
          )}
          onOpenAutoFocus={preventDialogOpenAutoFocus}
          onPointerDownOutside={(e) => {
            // Confirm empilée : ne pas preventDefault (sinon elle ne se ferme pas).
            if (hasStackedOpenDialog()) return;
            if (saving) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (hasStackedOpenDialog()) return;
            if (saving) e.preventDefault();
          }}
        >
          <DialogHeader className="shrink-0 flex-row items-center gap-2.5 space-y-0 border-b border-border px-4 py-2.5 text-left">
            <div className={modalIconCls("sm")} aria-hidden>
              <HeaderIcon />
            </div>
            <DialogTitle className="min-w-0 flex-1 pr-8 text-base font-semibold leading-none tracking-tight">
              {dialogLabel}
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {isUnsubscribed && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2">
                <BellOff
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                  aria-hidden
                />
                <p className={cn("m-0", hintTextCls, "text-amber-900")}>
                  {t("contact.modal.unsubBanner")}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label
                  className="flex justify-between gap-2"
                  htmlFor="contact-create-first"
                >
                  <span className={fieldLabelCls}>
                    {t("contacts.col.firstName")}{" "}
                    <span className="text-destructive">*</span>
                  </span>
                  <span className={fieldMetaCls}>
                    {first.length}/{PERSON_NAME_MAX_LENGTH}
                  </span>
                </Label>
                <Input
                  id="contact-create-first"
                  className={modalFieldCls}
                  maxLength={PERSON_NAME_MAX_LENGTH}
                  value={first}
                  aria-invalid={Boolean(firstError)}
                  aria-describedby={
                    firstError ? "contact-create-first-err" : undefined
                  }
                  onChange={(e) => {
                    setFirst(sanitizePersonName(e.target.value));
                    setFirstError(null);
                  }}
                />
                {firstError && (
                  <p
                    id="contact-create-first-err"
                    className={cn(hintTextCls, "text-destructive")}
                  >
                    {firstError}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label
                  className="flex justify-between gap-2"
                  htmlFor="contact-create-last"
                >
                  <span className={fieldLabelCls}>
                    {t("contacts.col.lastName")}
                  </span>
                  <span className={fieldMetaCls}>
                    {last.length}/{PERSON_NAME_MAX_LENGTH}
                  </span>
                </Label>
                <Input
                  id="contact-create-last"
                  className={modalFieldCls}
                  maxLength={PERSON_NAME_MAX_LENGTH}
                  value={last}
                  onChange={(e) =>
                    setLast(sanitizePersonName(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className={fieldLabelCls} htmlFor="contact-create-phone">
                  {t("contacts.col.phone")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <span
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                  title={t("contact.modal.phoneTitle")}
                >
                  <FrFlagIcon />
                  {t("regs.country.fr")}
                </span>
              </div>
              <div className="relative">
                <Phone
                  className={cn(
                    "pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground",
                    phoneInvalid && "text-destructive"
                  )}
                  strokeWidth={2.25}
                  aria-hidden
                />
                <Input
                  id="contact-create-phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  enterKeyHint="done"
                  placeholder="06 12 34 56 78"
                  maxLength={PHONE_DISPLAY_MAX_LENGTH}
                  className={cn(modalFieldCls, "pl-8")}
                  value={phone}
                  onChange={handlePhoneChange}
                  onBlur={() => setPhoneBlurred(true)}
                  aria-invalid={phoneInvalid}
                  aria-describedby={
                    phoneErrorMsg ? "contact-create-phone-err" : undefined
                  }
                />
              </div>
              {phoneErrorMsg && (
                <p
                  id="contact-create-phone-err"
                  className={cn(hintTextCls, "text-destructive")}
                >
                  {phoneErrorMsg}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                className={fieldLabelCls}
                htmlFor="contact-create-birthday"
              >
                {t("contact.modal.birthday")}
              </Label>
              <DatePicker
                id="contact-create-birthday"
                value={birthday}
                onChange={setBirthday}
                max={todayIsoLocal()}
              />
              <p className={hintTextCls}>{t("contact.modal.optional")}</p>
            </div>

            <div className="space-y-1.5">
              <Label
                className="flex justify-between gap-2"
                htmlFor="contact-create-notes"
              >
                <span className={fieldLabelCls}>{t("contacts.col.notes")}</span>
                <span className={fieldMetaCls}>
                  {notes.length}/{CONTACT_NOTES_MAX_LENGTH}
                </span>
              </Label>
              <textarea
                id="contact-create-notes"
                className={cn(
                  "min-h-[72px] w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm font-normal leading-snug text-foreground outline-none placeholder:text-muted-foreground",
                  modalFieldCls
                )}
                maxLength={CONTACT_NOTES_MAX_LENGTH}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={t("contact.modal.notesPh")}
              />
            </div>

            {customFieldDefs.length > 0 && (
              <ContactCustomFieldsList
                defs={customFieldDefs}
                values={draftCustomFields}
                setValues={setDraftCustomFields}
                errors={customErrors}
                onClearError={(fieldId) => {
                  setCustomErrors((prev) => {
                    if (!prev[fieldId]) return prev;
                    const next = { ...prev };
                    delete next[fieldId];
                    return next;
                  });
                }}
              />
            )}

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="flex items-center gap-1.5">
                  <Users
                    className="h-3.5 w-3.5 text-muted-foreground"
                    aria-hidden
                  />
                  <span className={fieldLabelCls}>
                    {t("contacts.col.groups")}
                  </span>
                </Label>
                {groups.length > 0 && (
                  <span className={fieldMetaCls}>
                    {groups.length === 1
                      ? t("contact.modal.groupsSelectedOne", {
                          n: groups.length,
                        })
                      : t("contact.modal.groupsSelectedMany", {
                          n: groups.length,
                        })}
                  </span>
                )}
              </div>
              <div className="max-h-[min(36vh,280px)] overflow-y-auto rounded-lg border border-border p-2.5">
                {groupOptions.length === 0 ? (
                  <p className={cn("m-0 px-1 py-2 text-center", hintTextCls)}>
                    {t("contact.modal.noGroups")}
                  </p>
                ) : (
                  <div
                    className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                    role="group"
                    aria-label={t("contact.modal.groupsAria")}
                  >
                    {groupOptions.map((opt) => {
                      const g = opt.name;
                      const selected = groups.includes(g);
                      const gc = groupColor(g);
                      const sizeLabel =
                        opt.contactCount === 1
                          ? t("contact.modal.groupSizeOne", {
                              n: opt.contactCount,
                            })
                          : t("contact.modal.groupSizeMany", {
                              n: opt.contactCount,
                            });
                      return (
                        <button
                          key={g}
                          type="button"
                          aria-pressed={selected}
                          title={g}
                          onClick={() => toggleContactGroup(g)}
                          className={cn(
                            "relative flex h-11 cursor-pointer items-center gap-1.5 overflow-hidden rounded-lg border px-2 py-1.5 text-left text-xs font-medium leading-snug transition-colors",
                            selected
                              ? "border-ring bg-accent text-ring ring-1 ring-ring/20"
                              : "border-border bg-card text-foreground hover:bg-muted/80"
                          )}
                        >
                          <span
                            className={cn(
                              "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-medium",
                              gc.bg,
                              gc.border,
                              gc.text
                            )}
                            aria-hidden
                          >
                            <Users className="h-3 w-3" />
                          </span>
                          <span className="min-w-0 flex-1 overflow-hidden">
                            <span className="block truncate">{g}</span>
                            <span
                              className={cn(
                                "mt-0.5 block truncate text-[10px] font-normal",
                                selected
                                  ? "text-ring/80"
                                  : "text-muted-foreground"
                              )}
                            >
                              {sizeLabel}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full cursor-pointer"
                onClick={() => {
                  onCreateGroupRequest();
                }}
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                {t("contact.modal.newGroup")}
              </Button>
            </div>
          </div>

          {saveError && (
            <div className="shrink-0 border-t border-destructive/30 bg-destructive/10 px-6 py-2 text-sm text-destructive">
              {saveError}
            </div>
          )}

          <DialogFooter className="mx-0 mb-0 shrink-0 flex-row flex-wrap items-center justify-between gap-2 rounded-b-xl p-2.5 px-4 sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {mode === "edit" && onDeleteContact && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={onDeleteContact}
                  className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {t("common.delete")}
                </Button>
              )}
              {mode === "edit" && onUnsubscribeContact && !isUnsubscribed && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => setConfirmUnsubscribeOpen(true)}
                  className="cursor-pointer text-amber-800 hover:bg-amber-50 hover:text-amber-900"
                >
                  <BellOff className="h-4 w-4" aria-hidden />
                  {t("contact.modal.unsubscribe")}
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={handleClose}
                className="cursor-pointer"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="default"
                disabled={saving}
                onClick={() => void handleFinalSave()}
                className="cursor-pointer"
              >
                {saving
                  ? t("dialog.saving")
                  : mode === "edit"
                  ? t("dialog.save")
                  : t("contact.modal.saveContact")}
              </Button>
            </div>
          </DialogFooter>
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
