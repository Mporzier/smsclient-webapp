"use client";

import { ProtoBtn } from "@/components/smsclient/ui";
import type { GroupRowData } from "@/lib/types/group";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, Trash2, X } from "lucide-react";
import type { GroupCreateModalContactRow } from "./GroupCreateModal";
import { overlayCls } from "./modalChrome";
import {
  groupFormSnapshotsEqual,
  handleModalBackdropClick,
  type GroupFormSnapshot,
} from "./modalFormGuard";

type GroupEditModalProps = {
  open: boolean;
  group: GroupRowData | null;
  onClose: () => void;
  contacts?: GroupCreateModalContactRow[];
  contactsLoading?: boolean;
  onSave: (payload: {
    id: string;
    name: string;
    description: string;
    selectedContactIds: string[];
  }) => Promise<void>;
  onLaunchCampaign: (groupName: string) => void;
  onDeleteGroup?: () => void;
};

const shellCls =
  "flex h-[min(86dvh,800px)] max-h-[min(86dvh,800px)] w-full max-w-[980px] flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.20)]";

function contactInGroup(
  contact: GroupCreateModalContactRow,
  groupName: string,
): boolean {
  const gn = groupName.trim();
  if (!gn) return false;
  return contact.groups.some((g) => g.trim() === gn);
}

export function GroupEditModal({
  open,
  group,
  onClose,
  contacts = [],
  contactsLoading = false,
  onSave,
  onLaunchCampaign,
  onDeleteGroup,
}: GroupEditModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contactQuery, setContactQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectAllHeaderRef = useRef<HTMLInputElement>(null);
  const selectionSyncRef = useRef<{ key: string; contactCount: number } | null>(
    null,
  );
  const [formBaseline, setFormBaseline] = useState<GroupFormSnapshot | null>(
    null,
  );

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
    if (!open || !group) return;
    setName(group.name);
    setDescription(group.description ?? "");
    setError(null);
  }, [open, group]);

  useEffect(() => {
    if (!open || !group) {
      selectionSyncRef.current = null;
      return;
    }
    const key = `${group.id}:${group.name}`;
    const ids = contacts
      .filter((c) => contactInGroup(c, group.name))
      .map((c) => c.id);
    const prev = selectionSyncRef.current;
    if (!prev || prev.key !== key) {
      selectionSyncRef.current = { key, contactCount: contacts.length };
      setSelectedIds(ids);
      setFormBaseline({
        name: group.name,
        description: group.description ?? "",
        selectedIds: [...ids],
      });
      return;
    }
    if (prev.contactCount === 0 && contacts.length > 0 && ids.length > 0) {
      selectionSyncRef.current = { key, contactCount: contacts.length };
      setSelectedIds(ids);
      setFormBaseline((prev) =>
        prev
          ? { ...prev, selectedIds: [...ids] }
          : {
              name: group.name,
              description: group.description ?? "",
              selectedIds: [...ids],
            },
      );
    } else {
      selectionSyncRef.current = { key, contactCount: contacts.length };
    }
  }, [open, group, contacts]);

  useEffect(() => {
    if (!open) {
      setContactQuery("");
      setSaving(false);
      setError(null);
      setSelectedIds([]);
      selectionSyncRef.current = null;
      setFormBaseline(null);
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
        selectedContactIds: selectedIds,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }, [group, name, description, selectedIds, onSave, onClose]);

  const handleLaunchCampaign = useCallback(() => {
    if (!group) return;
    onLaunchCampaign(name.trim() || group.name);
  }, [group, name, onLaunchCampaign]);

  const isDirty =
    formBaseline !== null &&
    !groupFormSnapshotsEqual(
      { name, description, selectedIds },
      formBaseline,
    );

  if (!open || !group) return null;

  return (
    <div
      className={overlayCls}
      role="dialog"
      aria-modal
      aria-label="Modifier le groupe"
      onClick={(e) =>
        handleModalBackdropClick(e, onClose, isDirty, !saving)
      }
    >
      <div className={shellCls}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-[18px] py-4">
          <div>
            <div className="text-lg font-black text-slate-900">
              Modifier le groupe
            </div>
            <div className="mt-0.5 text-xs font-bold text-slate-500">
              Nom, description et contacts du segment.
            </div>
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-lg font-black shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
            aria-label="Fermer"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden bg-slate-50 px-[18px] py-3">
          <div className="grid min-w-0 shrink-0 grid-cols-1 gap-3 md:grid-cols-2">
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
                    setError(null);
                  }}
                  placeholder="Ex : Clients VIP"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
              <label className="flex justify-between text-[13px] font-black">
                <span>Description (optionnel)</span>
                <span className="text-xs text-slate-500">
                  {description.length}/120
                </span>
              </label>
              <div className="mt-2.5 flex min-h-[88px] min-w-0 items-start rounded-[14px] border border-[#dfe6f2] bg-slate-50 px-3.5 py-2">
                <textarea
                  className="min-h-[72px] w-full min-w-0 resize-y border-none bg-transparent text-sm font-extrabold leading-relaxed text-slate-900 outline-none placeholder:text-slate-400"
                  maxLength={120}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Ex : Clients qui achètent au moins 1 fois par mois."
                />
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <div className="flex shrink-0 flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="m-0 text-base font-black">Contacts du groupe</h3>
                <p className="mt-1 text-xs font-bold text-slate-600">
                  Coche les contacts à rattacher à{" "}
                  <strong className="text-slate-800">
                    {name.trim() || group.name}
                  </strong>
                  .
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ProtoBtn
                  className="!h-9 !px-3 !text-[13px]"
                  onClick={selectAllFiltered}
                  disabled={contactsLoading || filteredContacts.length === 0}
                >
                  Tout sélectionner
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

            <div className="flex h-10 shrink-0 max-w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500 shadow-[0_6px_14px_rgba(15,23,42,0.06)]">
              <Search className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
              <input
                className="min-w-0 flex-1 border-none bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Filtrer par nom, téléphone, groupe…"
                value={contactQuery}
                onChange={(e) => setContactQuery(e.target.value)}
                aria-label="Filtrer les contacts"
              />
            </div>

            {contactsLoading ? (
              <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm font-bold text-slate-500">
                Chargement des contacts…
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm font-bold text-slate-600">
                Aucun contact enregistré. Ajoute des contacts depuis l’onglet{" "}
                <strong>Contacts</strong>, puis reviens ici.
              </div>
            ) : (
              <div
                className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200"
                role="listbox"
                aria-label="Contacts du groupe"
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
                          aria-label="Tout sélectionner les contacts affichés"
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
                                {c.groups.length ? c.groups.join(", ") : "—"}
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
              <p className="m-0 shrink-0 text-xs font-bold text-slate-600">
                {selectedIds.length === 0 ? (
                  <>
                    <strong className="text-slate-900">Aucun</strong> contact
                    sélectionné
                  </>
                ) : (
                  <>
                    <strong className="text-slate-900">
                      {selectedIds.length}
                    </strong>{" "}
                    contact
                    {selectedIds.length > 1 ? "s" : ""} sélectionné
                    {selectedIds.length > 1 ? "s" : ""}
                  </>
                )}
                {filteredContacts.length < contacts.length && (
                  <span className="text-slate-500">
                    {" "}
                    · {filteredContacts.length} affiché
                    {filteredContacts.length > 1 ? "s" : ""} sur{" "}
                    {contacts.length}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-[18px] py-3.5">
          <div className="flex items-center gap-2">
            {onDeleteGroup && (
              <button
                type="button"
                disabled={saving}
                onClick={onDeleteGroup}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600 transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Supprimer
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
          {error && (
            <p className="m-0 mr-auto max-w-full text-xs font-bold text-rose-600 sm:max-w-[min(100%,420px)]">
              {error}
            </p>
          )}
          <ProtoBtn disabled={saving} onClick={onClose}>
            Annuler
          </ProtoBtn>
          <ProtoBtn
            className="!h-10 !px-3.5 !text-[13px]"
            disabled={saving}
            title="CTA présent, action non implémentée pour l’instant"
            onClick={handleLaunchCampaign}
          >
            Lancer une campagne
          </ProtoBtn>
          <ProtoBtn primary disabled={saving} onClick={() => void handleSave()}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </ProtoBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
