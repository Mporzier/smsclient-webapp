"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { SEARCH_QUERY_MAX_LENGTH } from "@/lib/forms/fieldLimits";
import { useCallback, useMemo, useState } from "react";
import { BellOff, Search } from "lucide-react";
import {
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  modalIconCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";

export type UnsubscribedContactRow = {
  id: string;
  firstName: string;
  lastName: string;
  /** Affichage compact (stats) */
  name: string;
  phone: string;
  date: string;
};

type UnsubscribedContactsModalProps = {
  open: boolean;
  contacts: UnsubscribedContactRow[];
  onClose: () => void;
  /** Si fourni : checkboxes + CTA réabonnement */
  onResubscribe?: (ids: string[]) => Promise<void>;
};

const hintTextCls = "text-xs font-normal leading-snug text-muted-foreground";
const modalFieldCls =
  "focus-visible:outline-none focus-visible:ring-0 aria-invalid:ring-0";

function contactLineLabel(c: UnsubscribedContactRow): string {
  const name =
    [c.firstName.trim(), c.lastName.trim()].filter(Boolean).join(" ") ||
    c.name.trim() ||
    "—";
  return `${name} · ${c.phone}`;
}

export function UnsubscribedContactsModal({
  open,
  contacts,
  onClose,
  onResubscribe,
}: UnsubscribedContactsModalProps) {
  const canResubscribe = Boolean(onResubscribe);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) {
      setSearch("");
      setSelectedIds(new Set());
      setSaving(false);
      setError(null);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => {
      const full = `${c.firstName} ${c.lastName} ${c.name} ${c.phone}`.toLowerCase();
      return full.includes(q) || c.date.toLowerCase().includes(q);
    });
  }, [contacts, search]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllFiltered = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (filtered.every((c) => next.has(c.id))) {
        for (const c of filtered) next.delete(c.id);
      } else {
        for (const c of filtered) next.add(c.id);
      }
      return next;
    });
  }, [filtered]);

  const handleResubscribe = useCallback(async () => {
    if (!onResubscribe || selectedIds.size === 0) return;
    setSaving(true);
    setError(null);
    try {
      await onResubscribe([...selectedIds]);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Réabonnement impossible.");
    } finally {
      setSaving(false);
    }
  }, [onResubscribe, selectedIds, onClose]);

  const selectedCount = selectedIds.size;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) onClose();
      }}
    >
      <DialogContent
        showCloseButton={!saving}
        overlayClassName={dialogOverlayCls}
        className={cn(
          formDialogContentCls,
          "h-[min(86dvh,640px)] max-h-[min(86dvh,640px)] rounded-xl shadow-lg sm:max-w-[560px]",
          dialogContentZCls
        )}
        onOpenAutoFocus={preventDialogOpenAutoFocus}
        onPointerDownOutside={(e) => {
          if (saving) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (saving) e.preventDefault();
        }}
      >
        <DialogHeader className="shrink-0 flex-row items-center gap-2.5 space-y-0 border-b border-border px-4 py-2.5 text-left">
          <div className={modalIconCls("sm")} aria-hidden>
            <BellOff />
          </div>
          <div className="min-w-0 flex-1 pr-8">
            <DialogTitle className="text-base font-semibold leading-none tracking-tight">
              Contacts désabonnés
            </DialogTitle>
            <p className={cn("m-0 mt-1", hintTextCls)}>
              {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
            </p>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              className={cn(modalFieldCls, "pl-8")}
              placeholder="Rechercher par nom, téléphone…"
              value={search}
              maxLength={SEARCH_QUERY_MAX_LENGTH}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {contacts.length === 0 && (
            <p className={cn("py-8 text-center", hintTextCls)}>
              Aucun contact désabonné.
            </p>
          )}
          {contacts.length > 0 && filtered.length === 0 && (
            <p className={cn("py-8 text-center", hintTextCls)}>
              Aucun résultat pour cette recherche.
            </p>
          )}
          {filtered.length > 0 && (
            <ul
              className="m-0 list-none divide-y divide-border overflow-hidden rounded-lg border border-border p-0"
              role="list"
              aria-label="Contacts désabonnés"
            >
              {canResubscribe && (
                <li>
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-3 bg-muted/40 px-3 py-2.5 text-left transition-colors hover:bg-muted/70"
                    onClick={toggleAllFiltered}
                  >
                    <Checkbox
                      checked={
                        allFilteredSelected
                          ? true
                          : selectedCount > 0
                            ? "indeterminate"
                            : false
                      }
                      tabIndex={-1}
                      aria-hidden
                      className="pointer-events-none"
                    />
                    <span className={hintTextCls}>Tout sélectionner</span>
                  </button>
                </li>
              )}
              {filtered.map((c) => {
                const selected = selectedIds.has(c.id);
                const line = contactLineLabel(c);
                const row = (
                  <>
                    {canResubscribe && (
                      <Checkbox
                        checked={selected}
                        tabIndex={-1}
                        aria-hidden
                        className="pointer-events-none shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {line}
                      </div>
                      {c.date && c.date !== "—" && (
                        <div className={cn("mt-0.5 truncate", hintTextCls)}>
                          Désinscrit le {c.date}
                        </div>
                      )}
                    </div>
                  </>
                );

                if (!canResubscribe) {
                  return (
                    <li key={c.id} className="flex items-start gap-3 px-3 py-2.5">
                      {row}
                    </li>
                  );
                }

                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      aria-label={`Sélectionner ${line}`}
                      className={cn(
                        "flex w-full cursor-pointer items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                        selected && "bg-accent/50"
                      )}
                      onClick={() => toggleOne(c.id)}
                    >
                      {row}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {error && (
          <div className="shrink-0 border-t border-destructive/30 bg-destructive/10 px-6 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {canResubscribe && (
          <DialogFooter className="mx-0 mb-0 shrink-0 flex-row flex-wrap items-center justify-between gap-2 rounded-b-xl p-2.5 px-4 sm:justify-between">
            <span className={hintTextCls}>
              {selectedCount > 0
                ? `${selectedCount} sélectionné${selectedCount > 1 ? "s" : ""}`
                : "Cochez les contacts à réabonner"}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={onClose}
                className="cursor-pointer"
              >
                Annuler
              </Button>
              <Button
                type="button"
                disabled={saving || selectedCount === 0}
                onClick={() => void handleResubscribe()}
                className="cursor-pointer"
              >
                {saving
                  ? "Réabonnement…"
                  : `Réabonner${selectedCount > 0 ? ` (${selectedCount})` : ""}`}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
