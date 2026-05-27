"use client";

import { SearchBar } from "@/components/smsclient/Shell";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { modalCloseBtn, overlayCls } from "./modalChrome";

export type UnsubscribedContactRow = {
  name: string;
  phone: string;
  date: string;
};

type UnsubscribedContactsModalProps = {
  open: boolean;
  contacts: UnsubscribedContactRow[];
  onClose: () => void;
};

export function UnsubscribedContactsModal({
  open,
  contacts,
  onClose,
}: UnsubscribedContactsModalProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.date.toLowerCase().includes(q)
    );
  }, [contacts, search]);

  if (!open) return null;

  return (
    <div
      className={overlayCls}
      role="dialog"
      aria-modal
      aria-label="Contacts désabonnés"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[min(82vh,640px)] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.20)]">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="m-0 text-base font-black text-slate-900">
              Contacts désabonnés
            </h2>
          </div>
          <button
            type="button"
            className={modalCloseBtn}
            aria-label="Fermer"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="px-5 pt-3">
          <SearchBar
            placeholder="Rechercher par nom, téléphone…"
            value={search}
            onChange={setSearch}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-5 pb-5 pt-2">
          {contacts.length === 0 && (
            <p className="py-8 text-center text-sm font-bold text-slate-500">
              Aucun contact désabonné.
            </p>
          )}
          {contacts.length > 0 && filtered.length === 0 && (
            <p className="py-8 text-center text-sm font-bold text-slate-500">
              Aucun résultat pour cette recherche.
            </p>
          )}
          {filtered.length > 0 && (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {filtered.map((c) => (
                <li
                  key={`${c.phone}-${c.date}`}
                  className="flex flex-col gap-0.5 px-3.5 py-3"
                >
                  <span className="text-sm font-extrabold text-slate-900">
                    {c.name || "—"}
                  </span>
                  <span className="text-sm font-semibold text-slate-600">
                    {c.phone}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    Désinscrit le {c.date}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
