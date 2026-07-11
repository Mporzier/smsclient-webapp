"use client";

import { ProtoBtn } from "@/components/smsclient/ui";
import { cn } from "@/lib/cn";
import type { DeletedContactRow, DeletedGroupRow } from "@/lib/types/trash";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";

type ParametresTrashSectionProps = {
  contacts: DeletedContactRow[];
  groups: DeletedGroupRow[];
  loading: boolean;
  error: string | null;
  onRestoreContacts: (ids: string[]) => Promise<void>;
  onRestoreGroups: (ids: string[]) => Promise<void>;
  onRefresh: () => Promise<void>;
};

export function ParametresTrashSection({
  contacts,
  groups,
  loading,
  error,
  onRestoreContacts,
  onRestoreGroups,
  onRefresh,
}: ParametresTrashSectionProps) {
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
    new Set()
  );
  const [restoring, setRestoring] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const toggleContact = (id: string) => {
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const restoreSelected = async () => {
    const contactIds = [...selectedContactIds];
    const groupIds = [...selectedGroupIds];
    if (contactIds.length === 0 && groupIds.length === 0) return;
    setActionError(null);
    setRestoring(true);
    try {
      if (contactIds.length > 0) await onRestoreContacts(contactIds);
      if (groupIds.length > 0) await onRestoreGroups(groupIds);
      setSelectedContactIds(new Set());
      setSelectedGroupIds(new Set());
      await onRefresh();
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Restauration impossible."
      );
    } finally {
      setRestoring(false);
    }
  };

  const empty = !loading && contacts.length === 0 && groups.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 flex items-center gap-2 text-base font-black text-slate-900">
              <Trash2 className="h-5 w-5 text-slate-500" aria-hidden />
              Éléments supprimés
            </h2>
            <p className="mt-1.5 max-w-[640px] text-sm font-semibold text-slate-600">
              Les contacts et groupes que vous supprimez sont retirés de vos
              listes mais conservés ici. Sélectionnez-les puis cliquez sur
              Restaurer pour les récupérer.
            </p>
          </div>
          {(selectedContactIds.size > 0 || selectedGroupIds.size > 0) && (
            <ProtoBtn
              primary
              disabled={restoring}
              onClick={() => void restoreSelected()}
            >
              <RotateCcw className="mr-1.5 inline h-4 w-4" aria-hidden />
              {restoring
                ? "Restauration…"
                : `Restaurer la sélection (${
                    selectedContactIds.size + selectedGroupIds.size
                  })`}
            </ProtoBtn>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
          {error}
        </p>
      )}
      {actionError && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
          {actionError}
        </p>
      )}

      {loading && (
        <div className="grid min-h-[160px] place-items-center rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" aria-hidden />
        </div>
      )}

      {empty && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
          <p className="text-sm font-bold text-slate-600">
            Aucun contact ni groupe supprimé pour le moment.
          </p>
        </div>
      )}

      {!loading && contacts.length > 0 && (
        <TrashTable
          title="Contacts supprimés"
          emptyHint="Aucun contact dans la corbeille."
          headers={["", "Nom", "Téléphone", "Groupes", "Supprimé le"]}
          rows={contacts.map((c) => ({
            id: c.id,
            selected: selectedContactIds.has(c.id),
            onToggle: () => toggleContact(c.id),
            cells: [c.name, c.phone, c.groupsLabel, c.deletedLabel],
          }))}
        />
      )}

      {!loading && groups.length > 0 && (
        <TrashTable
          title="Groupes supprimés"
          emptyHint="Aucun groupe dans la corbeille."
          headers={[
            "",
            "Groupe",
            "Description",
            "Contacts actifs",
            "Supprimé le",
          ]}
          rows={groups.map((g) => ({
            id: g.id,
            selected: selectedGroupIds.has(g.id),
            onToggle: () => toggleGroup(g.id),
            cells: [
              g.name,
              g.description || "—",
              String(g.contactCount),
              g.deletedLabel,
            ],
          }))}
        />
      )}
    </div>
  );
}

function TrashTable({
  title,
  emptyHint,
  headers,
  rows,
}: {
  title: string;
  emptyHint: string;
  headers: string[];
  rows: {
    id: string;
    selected: boolean;
    onToggle: () => void;
    cells: string[];
  }[];
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
        {emptyHint}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
      <h3 className="m-0 text-sm font-black text-slate-900">{title}</h3>
      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead>
            <tr className="bg-slate-50">
              {headers.map((h) => (
                <th
                  key={h}
                  className="border-b border-slate-200 px-3 py-2.5 font-extrabold text-slate-700"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={cn(row.selected && "bg-blue-50/50")}>
                <td className="border-b border-slate-100 px-3 py-2.5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer"
                    checked={row.selected}
                    onChange={row.onToggle}
                    aria-label="Sélectionner"
                  />
                </td>
                {row.cells.map((cell, i) => (
                  <td
                    key={`${row.id}-${i}`}
                    className="border-b border-slate-100 px-3 py-2.5 font-semibold text-slate-700"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
