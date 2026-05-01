"use client";

import { cn } from "@/lib/cn";
import { ProtoBtn } from "@/components/smsclient/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { GroupCreateModalContactRow } from "./GroupCreateModal";
import { modalCard, overlayCls } from "./modalChrome";

type GroupQuickAddContactsModalProps = {
  open: boolean;
  groupName: string;
  contacts: GroupCreateModalContactRow[];
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
        !c.groups.some((g) => g.trim().toLowerCase() === normalizedGroupName)
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
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const allFilteredSelected = useMemo(
    () =>
      filteredContacts.length > 0 &&
      filteredContacts.every((c) => selectedIds.includes(c.id)),
    [filteredContacts, selectedIds]
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
            <div className="text-lg font-black text-slate-900">
              Ajouter des contacts
            </div>
            <div className="text-xs font-bold text-slate-500">
              Groupe cible :{" "}
              <span className="text-slate-800">{groupName || "—"}</span>
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

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-[18px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
            <div className="flex h-10 max-w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500 shadow-[0_6px_14px_rgba(15,23,42,0.06)]">
              <Search className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
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
          <ProtoBtn
            primary={selectedIds.length > 0 || saving}
            disabled={saving || selectedIds.length === 0}
            className={
              selectedIds.length === 0 && !saving
                ? "!cursor-default border-slate-200 bg-slate-100 text-slate-500 shadow-none"
                : undefined
            }
            onClick={() => void handleConfirm()}
          >
            {saving
              ? "Ajout…"
              : selectedIds.length === 0
              ? "Aucun contact sélectionné"
              : `Ajouter ${selectedIds.length} contact${
                  selectedIds.length > 1 ? "s" : ""
                }`}
          </ProtoBtn>
        </div>
      </div>
    </div>
  );
}
