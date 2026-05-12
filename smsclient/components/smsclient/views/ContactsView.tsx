"use client";

import { SearchBar } from "@/components/smsclient/Shell";
import { CellTruncate, ProtoBtn, PlusIcon } from "@/components/smsclient/ui";
import { DataTable } from "@/components/smsclient/DataTable";
import { cn } from "@/lib/cn";
import type { ContactRowData } from "@/lib/types/contact";
import {
  formatContactGroups,
  isCampaignEligibleContact,
} from "@/lib/types/contact";
import { useMemo, useState } from "react";
import { UserRound } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

const tagCls =
  "inline-flex items-center rounded-[10px] border border-indigo-100 bg-indigo-50 px-2 py-1 text-[12px] font-bold text-[#1f3b77]";

type ViewMode = "cibles" | "desabonnes";

type ContactsProps = {
  rows: ContactRowData[];
  loading: boolean;
  error: string | null;
  onImport: () => void;
  onAddContact: () => void;
  onRowClick: (row: ContactRowData) => void;
};

const columns: ColumnDef<ContactRowData, unknown>[] = [
  {
    accessorKey: "created",
    header: "Date",
    size: 100,
    cell: ({ getValue }) => <CellTruncate as="div">{getValue<string>()}</CellTruncate>,
  },
  {
    accessorKey: "firstName",
    header: "Prénom",
    size: 100,
    cell: ({ getValue }) => (
      <CellTruncate as="div" className="font-extrabold">
        {getValue<string>().trim() || "—"}
      </CellTruncate>
    ),
  },
  {
    accessorKey: "lastName",
    header: "Nom",
    size: 100,
    cell: ({ getValue }) => (
      <CellTruncate as="div" className="font-extrabold">
        {getValue<string>().trim() || "—"}
      </CellTruncate>
    ),
  },
  {
    accessorKey: "phone",
    header: "Téléphone",
    size: 120,
    cell: ({ getValue }) => <CellTruncate as="div">{getValue<string>()}</CellTruncate>,
  },
  {
    accessorKey: "groups",
    header: "Groupes",
    size: 200,
    cell: ({ getValue }) => {
      const groups = getValue<string[]>();
      if (groups.length === 0) {
        return <span className="text-sm font-semibold text-slate-500">Non classé</span>;
      }
      return (
        <div
          className="flex max-h-12 min-w-0 flex-wrap content-start gap-1 overflow-hidden"
          title={formatContactGroups(groups)}
        >
          {groups.map((g) => (
            <span key={g} className={cn(tagCls, "min-w-0 max-w-full truncate sm:max-w-[9rem]")}>
              {g}
            </span>
          ))}
        </div>
      );
    },
    filterFn: (row, _columnId, filterValue: string) => {
      if (!filterValue) return true;
      return row.original.groups.some((g) =>
        g.toLowerCase().includes(filterValue.toLowerCase()),
      );
    },
  },
  {
    accessorKey: "notes",
    header: "Notes",
    size: 160,
    cell: ({ getValue }) => (
      <CellTruncate as="div">{getValue<string>().trim() || "—"}</CellTruncate>
    ),
  },
  {
    accessorKey: "lastSms",
    header: "Dernier SMS",
    size: 100,
    cell: ({ getValue }) => <CellTruncate as="div">{getValue<string>()}</CellTruncate>,
  },
  {
    accessorKey: "source",
    header: "Source",
    size: 90,
    cell: ({ getValue }) => <CellTruncate as="div">{getValue<string>()}</CellTruncate>,
  },
];

export function ContactsView({
  rows,
  loading,
  error,
  onImport,
  onAddContact,
  onRowClick,
}: ContactsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cibles");

  const nDesabonnes = useMemo(() => rows.filter((r) => r.stopSms).length, [rows]);
  const nCibles = useMemo(() => rows.filter((r) => isCampaignEligibleContact(r)).length, [rows]);
  const nTous = rows.length;

  const scopeFiltered = useMemo(() => {
    if (viewMode === "desabonnes") return rows.filter((r) => r.stopSms);
    return rows.filter((r) => isCampaignEligibleContact(r));
  }, [rows, viewMode]);

  const showBigEmpty = !loading && !error && rows.length === 0;

  const footerLabel = useMemo(() => {
    if (loading) return "…";
    const total = scopeFiltered.length;
    return `${total} contact${total > 1 ? "s" : ""}`;
  }, [loading, scopeFiltered]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <SearchBar
            placeholder="Rechercher un contact…"
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-3">
          <ProtoBtn onClick={onImport}>Importer</ProtoBtn>
          {nTous > 0 && (
            <div
              className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5"
              role="group"
              aria-label="Filtrer les contacts"
            >
              <button
                type="button"
                aria-pressed={viewMode === "cibles"}
                onClick={() => setViewMode("cibles")}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-bold transition-colors cursor-pointer",
                  viewMode === "cibles"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                Cibles ({nCibles})
              </button>
              <button
                type="button"
                aria-pressed={viewMode === "desabonnes"}
                onClick={() => setViewMode("desabonnes")}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-bold transition-colors cursor-pointer",
                  viewMode === "desabonnes"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                Désabonnés ({nDesabonnes})
              </button>
            </div>
          )}
          <ProtoBtn primary onClick={onAddContact}>
            <PlusIcon />
            Ajouter un contact
          </ProtoBtn>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
          {error}
        </div>
      )}

      {showBigEmpty ? (
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <UserRound className="h-14 w-14 text-slate-400" strokeWidth={1.25} aria-hidden />
            <p className="m-0 max-w-[360px] text-lg font-extrabold text-slate-800">
              Aucun contact pour l&apos;instant
            </p>
            <p className="m-0 max-w-[400px] text-sm font-semibold leading-relaxed text-slate-500">
              Clique sur « Ajouter un contact » pour enregistrer ton premier
              numéro.
            </p>
          </div>
        </section>
      ) : (
        <DataTable
          columns={columns}
          data={scopeFiltered}
          loading={loading}
          pageSize={25}
          globalFilter={searchQuery}
          emptyMessage={
            viewMode === "cibles"
              ? "Aucune cible disponible."
              : "Aucun contact désabonné."
          }
          searchNoResultsMessage="Aucun contact ne correspond à ta recherche."
          onRowClick={onRowClick}
          footer={footerLabel}
        />
      )}
    </div>
  );
}
