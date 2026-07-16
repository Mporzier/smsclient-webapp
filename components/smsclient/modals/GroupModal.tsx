"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import {
  innerInputSm,
  innerTextareaSm,
} from "@/components/smsclient/flowFieldStyles";
import {
  avatarColor,
  contactInitials,
  groupColor,
  groupTagBase,
} from "@/lib/proto/contactDisplay";
import type { GroupRowData } from "@/lib/types/group";
import { useCallback, useMemo, useState } from "react";
import {
  CheckCheck,
  Eraser,
  Phone,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  brandBtnPrimaryCls,
  dialogContentStackedZCls,
  dialogContentZCls,
  dialogOverlayCls,
  dialogOverlayStackedCls,
  formDialogContentCls,
  modalCloseBtnCompact,
} from "./modalChrome";
import {
  groupFormSnapshotsEqual,
  hasStackedOpenDialog,
  sortedStringArraysEqual,
  useModalFormDirty,
  type GroupFormSnapshot,
} from "./modalFormGuard";

export type GroupModalContactRow = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  groups: string[];
};

type GroupModalSharedProps = {
  open: boolean;
  onClose: () => void;
  contacts?: GroupModalContactRow[];
  contactsLoading?: boolean;
  /** Autre dialogue empilé (ex. confirmation de suppression). */
  stackedDialogOpen?: boolean;
};

export type GroupModalCreateProps = GroupModalSharedProps & {
  mode: "create";
  onCreated?: (
    name: string,
    description: string,
    selectedContactIds: string[]
  ) => void | Promise<void>;
};

export type GroupModalEditProps = GroupModalSharedProps & {
  mode: "edit";
  group: GroupRowData | null;
  onSave: (payload: {
    id: string;
    name: string;
    description: string;
    selectedContactIds: string[];
  }) => Promise<void>;
  onLaunchCampaign: (groupName: string) => void;
  onDeleteGroup?: () => void;
};

export type GroupModalProps = GroupModalCreateProps | GroupModalEditProps;

const fieldShell =
  "rounded-xl border border-border bg-card p-2.5 shadow-[0_8px_18px_rgba(15,23,42,0.06)]";

const inpText =
  "w-full border-none bg-transparent text-[13px] font-normal text-foreground outline-none placeholder:text-muted-foreground placeholder:font-normal";

const modalTitleCls = "text-base font-semibold tracking-tight text-foreground";
const fieldLabelCls = "text-xs font-medium text-foreground";
const fieldMetaCls = "text-[11px] font-normal text-muted-foreground";
const sectionTitleCls = "text-s font-extrabold text-foreground";
const hintTextCls =
  "text-[11px] font-normal leading-snug text-muted-foreground";
const errorTextCls = "text-xs font-medium text-destructive";
const labelIconBadgeCls =
  "grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border bg-gradient-to-br from-violet-50 to-indigo-50 text-ring";
const contactsPanelShell =
  "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-xl border border-border bg-card p-2.5 shadow-[0_8px_18px_rgba(15,23,42,0.06)]";
const tableHeadCls =
  "border-b border-border px-2 py-2 text-[11px] font-medium text-muted-foreground";
const tableCellCls = "px-2 py-2 text-[13px] font-normal text-foreground";
const compactBtnCls = "!h-8 !gap-1.5 !px-2.5 !text-xs !font-medium";
const footerBtnCls = "!h-9 !text-xs !font-medium";

function contactInGroup(
  contact: GroupModalContactRow,
  groupName: string
): boolean {
  const gn = groupName.trim();
  if (!gn) return false;
  return contact.groups.some((g) => g.trim() === gn);
}

function buildSaveContactsConfirmCopy(
  selectedIds: string[],
  baselineIds: string[],
  groupLabel: string
): { title: string; description: string; confirmLabel: string } {
  const baselineSet = new Set(baselineIds);
  const selectedSet = new Set(selectedIds);
  const addedCount = selectedIds.filter((id) => !baselineSet.has(id)).length;
  const removedCount = baselineIds.filter((id) => !selectedSet.has(id)).length;

  const parts: string[] = [];
  if (addedCount > 0) {
    parts.push(`${addedCount} ajout${addedCount > 1 ? "s" : ""}`);
  }
  if (removedCount > 0) {
    parts.push(`${removedCount} retrait${removedCount > 1 ? "s" : ""}`);
  }

  const description = `Pour le groupe « ${groupLabel} » : ${parts.join(", ")}.`;

  return {
    title: "Confirmer la mise à jour des contacts ?",
    description,
    confirmLabel: "Enregistrer",
  };
}

type GroupContactSelectionConfirmProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

function GroupContactSelectionConfirm({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: GroupContactSelectionConfirmProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogContent
        overlayClassName={dialogOverlayStackedCls}
        className={dialogContentStackedZCls}
        onOutsideDismiss={onCancel}
      >
        <AlertDialogHeader>
          <AlertDialogMedia className={labelIconBadgeCls}>
            <UserRound strokeWidth={2} aria-hidden />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type GroupModalContactsPanelProps = {
  contacts: GroupModalContactRow[];
  contactsLoading: boolean;
  contactQuery: string;
  onContactQueryChange: (value: string) => void;
  filteredContacts: GroupModalContactRow[];
  selectedIds: string[];
  toggleContact: (id: string) => void;
  selectAllFiltered: () => void;
  clearSelection: () => void;
  allFilteredSelected: boolean;
  someFilteredSelected: boolean;
  toggleSelectAllFiltered: () => void;
  groupLabel: string;
  listAriaLabel: string;
};

function GroupModalContactsPanel({
  contacts,
  contactsLoading,
  contactQuery,
  onContactQueryChange,
  filteredContacts,
  selectedIds,
  toggleContact,
  selectAllFiltered,
  clearSelection,
  allFilteredSelected,
  someFilteredSelected,
  toggleSelectAllFiltered,
  listAriaLabel,
}: GroupModalContactsPanelProps) {
  return (
    <div className={contactsPanelShell}>
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={labelIconBadgeCls} aria-hidden>
              <UserRound className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <h3 className={cn("m-0", sectionTitleCls)}>Contacts du groupe</h3>
          </div>
          <p className={cn("mt-1", hintTextCls)}>
            Cochez les contacts à rattacher à ce groupe.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className={compactBtnCls}
            onClick={selectAllFiltered}
            disabled={contactsLoading || filteredContacts.length === 0}
          >
            <CheckCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Tout sélectionner
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className={compactBtnCls}
            onClick={clearSelection}
            disabled={selectedIds.length === 0}
          >
            <Eraser className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Effacer la sélection
          </Button>
        </div>
      </div>

      <div
        className={cn(
          innerInputSm,
          "h-9 shrink-0 gap-2 px-2.5 shadow-[0_4px_10px_rgba(15,23,42,0.04)]"
        )}
      >
        <Search
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <input
          className={cn(inpText, "min-w-0 flex-1")}
          placeholder="Filtrer par nom, téléphone, groupe…"
          value={contactQuery}
          onChange={(e) => onContactQueryChange(e.target.value)}
          aria-label="Filtrer les contacts"
        />
      </div>

      {contactsLoading ? (
        <div
          className={cn(
            "flex min-h-0 flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 px-3 py-8 text-center",
            hintTextCls
          )}
        >
          Chargement des contacts…
        </div>
      ) : contacts.length === 0 ? (
        <div
          className={cn(
            "flex min-h-0 flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 px-3 py-8 text-center",
            hintTextCls
          )}
        >
          Aucun contact enregistré. Ajoutez des contacts depuis l’onglet{" "}
          <span className="font-medium text-foreground">Contacts</span>, puis
          revenez ici.
        </div>
      ) : (
        <div
          className="min-h-0 flex-1 overflow-auto rounded-lg border border-border"
          role="listbox"
          aria-label={listAriaLabel}
          aria-multiselectable
        >
          <table className="w-full border-separate border-spacing-0 text-left">
            <thead className="sticky top-0 z-[1] bg-muted/50">
              <tr>
                <th className={cn("w-9", tableHeadCls)} scope="col">
                  <Checkbox
                    className="size-3.5 cursor-pointer disabled:cursor-not-allowed"
                    checked={
                      allFilteredSelected
                        ? true
                        : someFilteredSelected
                        ? "indeterminate"
                        : false
                    }
                    onCheckedChange={() => toggleSelectAllFiltered()}
                    disabled={contactsLoading || filteredContacts.length === 0}
                    aria-label="Tout sélectionner les contacts affichés"
                  />
                </th>
                <th
                  className={cn("w-11", tableHeadCls)}
                  scope="col"
                  aria-label="Initiales"
                />
                <th className={tableHeadCls}>Contact</th>
                <th className={tableHeadCls}>Téléphone</th>
                <th
                  className={cn("hidden sm:table-cell", tableHeadCls)}
                  scope="col"
                >
                  Groupes
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className={cn(
                      "px-3 py-8 text-center",
                      hintTextCls,
                      "text-muted-foreground"
                    )}
                  >
                    Aucun résultat pour cette recherche.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((c) => {
                  const checked = selectedIds.includes(c.id);
                  const initials = contactInitials(c);
                  const av = avatarColor(c.id);
                  return (
                    <tr
                      key={c.id}
                      className="cursor-pointer border-b border-border/50 bg-card transition-colors hover:bg-muted/50"
                      onClick={() => toggleContact(c.id)}
                      role="option"
                      aria-selected={checked}
                    >
                      <td className={cn(tableCellCls, "align-middle")}>
                        <Checkbox
                          className="size-3.5 cursor-pointer"
                          checked={checked}
                          onCheckedChange={() => toggleContact(c.id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Sélectionner ${c.name}`}
                        />
                      </td>
                      <td className={cn(tableCellCls, "align-middle")}>
                        <div
                          className={cn(
                            "grid h-8 w-8 place-items-center rounded-full text-xs font-semibold",
                            av.bg,
                            av.text
                          )}
                          aria-hidden
                        >
                          {initials}
                        </div>
                      </td>
                      <td
                        className={cn(
                          tableCellCls,
                          "max-w-[140px] truncate font-medium text-foreground sm:max-w-none"
                        )}
                      >
                        {c.name.trim() || "—"}
                      </td>
                      <td className={cn(tableCellCls, "whitespace-nowrap")}>
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Phone
                            className="h-3.5 w-3.5 shrink-0 text-emerald-500"
                            aria-hidden
                          />
                          {c.phone}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "hidden sm:table-cell",
                          tableCellCls,
                          "align-middle"
                        )}
                      >
                        {c.groups.length === 0 ? (
                          <span className={hintTextCls}>Non classé</span>
                        ) : (
                          <div className="flex max-h-12 min-w-0 flex-wrap gap-1 overflow-hidden">
                            {c.groups.map((g) => {
                              const gc = groupColor(g);
                              return (
                                <span
                                  key={g}
                                  className={cn(
                                    groupTagBase,
                                    gc.bg,
                                    gc.border,
                                    gc.text,
                                    "max-w-full truncate"
                                  )}
                                >
                                  {g}
                                </span>
                              );
                            })}
                          </div>
                        )}
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
        <p className={cn("m-0 shrink-0", hintTextCls)}>
          {selectedIds.length === 0 ? (
            <>Aucun contact sélectionné</>
          ) : (
            <>
              <span className="font-medium text-foreground">
                {selectedIds.length}
              </span>{" "}
              contact{selectedIds.length > 1 ? "s" : ""} sélectionné
              {selectedIds.length > 1 ? "s" : ""}
            </>
          )}
          {filteredContacts.length < contacts.length && (
            <span className="text-muted-foreground">
              {" "}
              · {filteredContacts.length} affiché
              {filteredContacts.length > 1 ? "s" : ""} sur {contacts.length}
            </span>
          )}
        </p>
      )}
    </div>
  );
}

export function GroupModal(props: GroupModalProps) {
  const isCreate = props.mode === "create";
  const group = isCreate ? null : props.group;
  const contacts = useMemo(() => props.contacts ?? [], [props.contacts]);
  const contactsLoading = props.contactsLoading ?? false;
  const stackedDialogOpen = props.stackedDialogOpen ?? false;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contactQuery, setContactQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [formBaseline, setFormBaseline] = useState<GroupFormSnapshot | null>(
    null
  );
  const [wasGroupOpen, setWasGroupOpen] = useState(props.open);
  const [syncedEditGroupId, setSyncedEditGroupId] = useState<string | null>(
    null
  );
  const [selectionSync, setSelectionSync] = useState<{
    key: string;
    contactCount: number;
  } | null>(null);

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
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
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
    [filteredContacts, selectedIds]
  );

  const someFilteredSelected = useMemo(
    () => filteredContacts.some((c) => selectedIds.includes(c.id)),
    [filteredContacts, selectedIds]
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

  const contactsSelectionChanged = useMemo(() => {
    if (isCreate || formBaseline === null) return false;
    return !sortedStringArraysEqual(selectedIds, formBaseline.selectedIds);
  }, [isCreate, formBaseline, selectedIds]);

  if (props.open !== wasGroupOpen) {
    setWasGroupOpen(props.open);
    if (!props.open) {
      setName("");
      setDescription("");
      setContactQuery("");
      setSelectedIds([]);
      setSaving(false);
      setError(null);
      setSaveConfirmOpen(false);
      setFormBaseline(null);
      setSyncedEditGroupId(null);
      setSelectionSync(null);
    }
  }

  if (props.open && !isCreate && group && syncedEditGroupId !== group.id) {
    setSyncedEditGroupId(group.id);
    setName(group.name);
    setDescription(group.description ?? "");
    setError(null);
  }

  if (isCreate || !props.open || !group) {
    if ((!props.open || isCreate) && selectionSync !== null) {
      setSelectionSync(null);
    }
  } else {
    const key = `${group.id}:${group.name}`;
    const ids = contacts
      .filter((c) => contactInGroup(c, group.name))
      .map((c) => c.id);
    if (!selectionSync || selectionSync.key !== key) {
      setSelectionSync({ key, contactCount: contacts.length });
      setSelectedIds(ids);
      setFormBaseline({
        name: group.name,
        description: group.description ?? "",
        selectedIds: [...ids],
      });
    } else if (
      selectionSync.contactCount === 0 &&
      contacts.length > 0 &&
      ids.length > 0
    ) {
      setSelectionSync({ key, contactCount: contacts.length });
      setSelectedIds(ids);
      setFormBaseline((prevBaseline) =>
        prevBaseline
          ? { ...prevBaseline, selectedIds: [...ids] }
          : {
              name: group.name,
              description: group.description ?? "",
              selectedIds: [...ids],
            }
      );
    } else if (selectionSync.contactCount !== contacts.length) {
      setSelectionSync({ key, contactCount: contacts.length });
    }
  }

  const onClose = props.onClose;
  const onCreated = isCreate ? props.onCreated : undefined;
  const onSave = !isCreate ? props.onSave : undefined;
  const onLaunchCampaign = !isCreate ? props.onLaunchCampaign : undefined;
  const onDeleteGroup = !isCreate ? props.onDeleteGroup : undefined;

  const handleCreate = useCallback(async () => {
    if (!isCreate) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Indiquez un nom de groupe.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onCreated?.(trimmed, description.trim(), selectedIds);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }, [isCreate, name, description, selectedIds, onCreated, onClose]);

  const handleSave = useCallback(async () => {
    if (isCreate || !group?.id || !onSave) return;
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
        selectedContactIds: selectedIds,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }, [isCreate, group, name, description, selectedIds, onSave, onClose]);

  const requestSave = useCallback(() => {
    if (isCreate || !group?.id || !onSave) return;
    if (!name.trim()) {
      setError("Le nom du groupe est obligatoire.");
      return;
    }
    setError(null);
    if (contactsSelectionChanged) {
      setSaveConfirmOpen(true);
      return;
    }
    void handleSave();
  }, [isCreate, group, onSave, name, contactsSelectionChanged, handleSave]);

  const handleLaunchCampaign = useCallback(() => {
    if (isCreate || !group || !onLaunchCampaign) return;
    onLaunchCampaign(name.trim() || group.name);
  }, [isCreate, group, name, onLaunchCampaign]);

  const createFormSnapshot: GroupFormSnapshot = {
    name,
    description,
    selectedIds,
  };
  const isDirtyCreate = useModalFormDirty(
    props.open && isCreate,
    createFormSnapshot,
    groupFormSnapshotsEqual
  );
  const isDirtyEdit =
    !isCreate &&
    formBaseline !== null &&
    !groupFormSnapshotsEqual({ name, description, selectedIds }, formBaseline);
  const isDirty = isCreate ? isDirtyCreate : isDirtyEdit;

  const dialogOpen = props.open && (isCreate || !!group);

  const groupLabel = name.trim() || (group?.name ?? "ce groupe");
  const dialogLabel = isCreate ? "Créer un groupe" : "Modifier le groupe";
  const listAriaLabel = isCreate
    ? "Contacts à rattacher au groupe"
    : "Contacts du groupe";

  const saveConfirmCopy =
    saveConfirmOpen && formBaseline
      ? buildSaveContactsConfirmCopy(
          selectedIds,
          formBaseline.selectedIds,
          groupLabel
        )
      : null;

  const canDismissMain =
    !saving && !stackedDialogOpen && !saveConfirmOpen && !isDirty;

  return (
    <>
      <Dialog
        open={dialogOpen}
        onOpenChange={(next) => {
          if (!next) {
            if (!canDismissMain || hasStackedOpenDialog()) return;
            onClose();
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          overlayClassName={dialogOverlayCls}
          className={cn(
            formDialogContentCls,
            "h-[min(86dvh,760px)] max-h-[min(86dvh,760px)] sm:max-w-[720px]",
            dialogContentZCls
          )}
          onPointerDownOutside={(e) => {
            // Confirm / delete empilés : laisser l’event pour les fermer.
            if (
              stackedDialogOpen ||
              saveConfirmOpen ||
              hasStackedOpenDialog()
            ) {
              return;
            }
            if (saving || isDirty) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (
              stackedDialogOpen ||
              saveConfirmOpen ||
              hasStackedOpenDialog()
            ) {
              return;
            }
            if (saving || isDirty) e.preventDefault();
          }}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-gradient-to-br from-violet-50 to-indigo-50 text-ring shadow-[0_8px_16px_rgba(47,111,237,0.12)]"
                aria-hidden
              >
                <Users className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <DialogTitle className={cn("m-0", modalTitleCls)}>
                  {dialogLabel}
                </DialogTitle>
                {!isCreate && (
                  <p className={cn("m-0 mt-0.5", hintTextCls)}>
                    Créez un groupe et ajoutez les contacts à associer.
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              className={modalCloseBtnCompact}
              aria-label="Fermer"
              onClick={onClose}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden bg-muted/50 px-4 py-3">
            {error && (
              <p
                className={cn(
                  "rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5",
                  errorTextCls
                )}
              >
                {error}
              </p>
            )}

            <div className="grid min-w-0 shrink-0 grid-cols-1 gap-2 sm:grid-cols-2">
              <div className={fieldShell}>
                <label className="flex justify-between gap-2">
                  <span className={fieldLabelCls}>
                    Nom du groupe <span className="text-destructive">*</span>
                  </span>
                  <span className={fieldMetaCls}>{name.length}/40</span>
                </label>
                <div className={cn(innerInputSm, "mt-1.5 h-9")}>
                  <input
                    className={inpText}
                    maxLength={40}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                    placeholder="Ex : Clients VIP"
                  />
                </div>
              </div>
              <div className={fieldShell}>
                <label className="flex justify-between gap-2">
                  <span className={fieldLabelCls}>Description</span>
                  <span className={fieldMetaCls}>{description.length}/120</span>
                </label>
                <div className={cn(innerTextareaSm, "mt-1.5")}>
                  <textarea
                    className="min-h-[52px] w-full resize-y border-none bg-transparent text-[13px] font-normal leading-snug text-foreground outline-none placeholder:text-muted-foreground placeholder:font-normal"
                    maxLength={120}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Optionnel — contexte ou critères du groupe…"
                  />
                </div>
              </div>
            </div>

            <GroupModalContactsPanel
              contacts={contacts}
              contactsLoading={contactsLoading}
              contactQuery={contactQuery}
              onContactQueryChange={setContactQuery}
              filteredContacts={filteredContacts}
              selectedIds={selectedIds}
              toggleContact={toggleContact}
              selectAllFiltered={selectAllFiltered}
              clearSelection={clearSelection}
              allFilteredSelected={allFilteredSelected}
              someFilteredSelected={someFilteredSelected}
              toggleSelectAllFiltered={toggleSelectAllFiltered}
              groupLabel={groupLabel}
              listAriaLabel={listAriaLabel}
            />
          </div>

          <div
            className={cn(
              "flex shrink-0 flex-wrap items-center gap-2 border-t border-border bg-card px-4 py-3",
              isCreate ? "justify-end" : "justify-between"
            )}
          >
            {!isCreate && (
              <div className="flex items-center gap-2">
                {onDeleteGroup && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={onDeleteGroup}
                    className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Supprimer
                  </button>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className={footerBtnCls}
                disabled={saving}
                onClick={onClose}
              >
                Annuler
              </Button>
              {!isCreate && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className={cn(footerBtnCls, "!px-3")}
                  disabled={saving}
                  title="CTA présent, action non implémentée pour l’instant"
                  onClick={handleLaunchCampaign}
                >
                  Lancer une campagne
                </Button>
              )}
              <Button
                type="button"
                variant="default"
                size="lg"
                className={cn(brandBtnPrimaryCls, footerBtnCls)}
                disabled={saving}
                onClick={() => void (isCreate ? handleCreate() : requestSave())}
              >
                {saving
                  ? "Enregistrement…"
                  : isCreate
                  ? "Créer le groupe"
                  : "Enregistrer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <GroupContactSelectionConfirm
        open={saveConfirmCopy !== null}
        title={saveConfirmCopy?.title ?? ""}
        description={saveConfirmCopy?.description ?? ""}
        confirmLabel={saveConfirmCopy?.confirmLabel ?? "Enregistrer"}
        onConfirm={() => {
          setSaveConfirmOpen(false);
          void handleSave();
        }}
        onCancel={() => setSaveConfirmOpen(false)}
      />
    </>
  );
}

/** @deprecated Utiliser `GroupModal` avec `mode="create"`. */
export function GroupCreateModal(props: Omit<GroupModalCreateProps, "mode">) {
  return <GroupModal mode="create" {...props} />;
}

/** @deprecated Utiliser `GroupModal` avec `mode="edit"`. */
export function GroupEditModal(props: Omit<GroupModalEditProps, "mode">) {
  return <GroupModal mode="edit" {...props} />;
}

/** @deprecated Renommé en `GroupModalContactRow`. */
export type GroupCreateModalContactRow = GroupModalContactRow;
