"use client";

import { SearchBar } from "@/components/smsclient/Shell";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  modalCloseBtn,
} from "./modalChrome";

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
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setSearch("");
  }

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

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName={dialogOverlayCls}
        className={cn(
          formDialogContentCls,
          "max-h-[min(82vh,640px)] sm:max-w-[520px]",
          dialogContentZCls
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <DialogTitle className="m-0 text-base font-black text-foreground">
              Contacts désabonnés
            </DialogTitle>
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
            <p className="py-8 text-center text-sm font-bold text-muted-foreground">
              Aucun contact désabonné.
            </p>
          )}
          {contacts.length > 0 && filtered.length === 0 && (
            <p className="py-8 text-center text-sm font-bold text-muted-foreground">
              Aucun résultat pour cette recherche.
            </p>
          )}
          {filtered.length > 0 && (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {filtered.map((c) => (
                <li
                  key={`${c.phone}-${c.date}`}
                  className="flex flex-col gap-0.5 px-3.5 py-3"
                >
                  <span className="text-sm font-extrabold text-foreground">
                    {c.name || "—"}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {c.phone}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground/70">
                    Désinscrit le {c.date}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
