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
import { Phone, Trash2, UserRound } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

const GROUP_COLORS: { bg: string; border: string; text: string }[] = [
  { bg: "bg-indigo-50", border: "border-indigo-100", text: "text-indigo-700" },
  {
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    text: "text-emerald-700",
  },
  { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-50", border: "border-rose-100", text: "text-rose-700" },
  { bg: "bg-sky-50", border: "border-sky-100", text: "text-sky-700" },
  { bg: "bg-violet-50", border: "border-violet-100", text: "text-violet-700" },
  { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-700" },
  { bg: "bg-cyan-50", border: "border-cyan-100", text: "text-cyan-700" },
  {
    bg: "bg-fuchsia-50",
    border: "border-fuchsia-100",
    text: "text-fuchsia-700",
  },
  { bg: "bg-lime-50", border: "border-lime-100", text: "text-lime-700" },
];

const AVATAR_COLORS: { bg: string; text: string }[] = [
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-sky-100", text: "text-sky-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700" },
  { bg: "bg-fuchsia-100", text: "text-fuchsia-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
];

function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function groupColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length];
}

const tagBase =
  "inline-flex items-center rounded-[10px] border px-2 py-1 text-[12px] font-bold";

type ContactsProps = {
  rows: ContactRowData[];
  loading: boolean;
  error: string | null;
  onImport: () => void;
  onAddContact: () => void;
  onRowClick: (row: ContactRowData) => void;
  onDeleteContacts: (ids: string[]) => void;
};

const columns: ColumnDef<ContactRowData, unknown>[] = [
  {
    id: "avatar",
    size: 44,
    header: "",
    cell: ({ row }) => {
      const f = (row.original.firstName || "").trim();
      const l = (row.original.lastName || "").trim();
      const initials = ((f[0] ?? "") + (l[0] ?? "")).toUpperCase() || "?";
      const c = avatarColor(row.original.id);
      return (
        <div
          className={cn(
            "grid h-8 w-8 place-items-center rounded-full text-xs font-extrabold",
            c.bg,
            c.text,
          )}
        >
          {initials}
        </div>
      );
    },
  },
  {
    accessorKey: "firstName",
    header: "Prénom",
    size: 100,
    cell: ({ getValue }) => (
      <CellTruncate as="div" className="">
        {getValue<string>().trim() || "—"}
      </CellTruncate>
    ),
  },
  {
    accessorKey: "lastName",
    header: "Nom",
    size: 100,
    cell: ({ getValue }) => (
      <CellTruncate as="div" className="">
        {getValue<string>().trim() || "—"}
      </CellTruncate>
    ),
  },
  {
    accessorKey: "phone",
    header: "Téléphone",
    size: 140,
    cell: ({ getValue }) => (
      <div className="flex items-center gap-1.5">
        <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
        <CellTruncate as="span">{getValue<string>()}</CellTruncate>
      </div>
    ),
  },
  {
    accessorKey: "groups",
    header: "Groupes",
    size: 200,
    cell: ({ getValue }) => {
      const groups = getValue<string[]>();
      if (groups.length === 0) {
        return (
          <span className="text-sm font-semibold text-slate-500">
            Non classé
          </span>
        );
      }
      return (
        <div
          className="flex max-h-12 min-w-0 flex-wrap content-start gap-1 overflow-hidden"
          title={formatContactGroups(groups)}
        >
          {groups.map((g) => {
            const c = groupColor(g);
            return (
              <span
                key={g}
                className={cn(
                  tagBase,
                  c.bg,
                  c.border,
                  c.text,
                  "min-w-0 max-w-full truncate sm:max-w-[9rem]"
                )}
              >
                {g}
              </span>
            );
          })}
        </div>
      );
    },
    filterFn: (row, _columnId, filterValue: string) => {
      if (!filterValue) return true;
      return row.original.groups.some((g) =>
        g.toLowerCase().includes(filterValue.toLowerCase())
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
    size: 180,
    cell: ({ row, getValue }) => {
      const date = getValue<string>();
      const body = row.original.lastSmsBody;
      if (!body && date === "—") return <span className="text-sm text-slate-400">—</span>;
      return (
        <div className="flex flex-col gap-0.5 truncate">
          {body ? (
            <span className="truncate text-sm text-slate-700" title={body}>
              &laquo;&thinsp;{body.slice(0, 50)}{body.length > 50 ? "…" : ""}&thinsp;&raquo;
            </span>
          ) : null}
          {date !== "—" && (
            <span className="text-xs text-slate-400">{date}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "source",
    header: "Source",
    size: 90,
    cell: ({ getValue }) => (
      <CellTruncate as="div">{getValue<string>()}</CellTruncate>
    ),
  },
  {
    accessorKey: "created",
    header: "Date d'ajout",
    size: 100,
    cell: ({ getValue }) => (
      <CellTruncate as="div">{getValue<string>()}</CellTruncate>
    ),
  },
];

export function ContactsView({
  rows,
  loading,
  error,
  onImport,
  onAddContact,
  onRowClick,
  onDeleteContacts,
}: ContactsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const eligibleRows = useMemo(
    () => rows.filter((r) => isCampaignEligibleContact(r)),
    [rows],
  );

  const showBigEmpty = !loading && !error && rows.length === 0;

  const footerLabel = useMemo(() => {
    if (loading) return "…";
    const total = eligibleRows.length;
    return `${total} contact${total > 1 ? "s" : ""}`;
  }, [loading, eligibleRows]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === eligibleRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligibleRows.map((r) => r.id)));
    }
  };

  const selectColumns: ColumnDef<ContactRowData, unknown>[] = [
    {
      id: "select",
      size: 40,
      header: () => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#2f6fed] focus:ring-[#2f6fed]"
            checked={selectedIds.size > 0 && selectedIds.size === eligibleRows.length}
            ref={(el) => {
              if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < eligibleRows.length;
            }}
            onChange={toggleAll}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#2f6fed] focus:ring-[#2f6fed]"
            checked={selectedIds.has(row.original.id)}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelect(row.original.id);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ),
    },
    ...columns,
  ];

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
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={() => {
                onDeleteContacts(Array.from(selectedIds));
                setSelectedIds(new Set());
              }}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-bold text-rose-600 transition-all hover:bg-rose-100"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Supprimer ({selectedIds.size})
            </button>
          )}
          <ProtoBtn onClick={onImport}>Importer</ProtoBtn>
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
            <UserRound
              className="h-14 w-14 text-slate-400"
              strokeWidth={1.25}
              aria-hidden
            />
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
          columns={selectColumns}
          data={eligibleRows}
          loading={loading}
          pageSize={25}
          globalFilter={searchQuery}
          emptyMessage="Aucune cible disponible."
          searchNoResultsMessage="Aucun contact ne correspond à ta recherche."
          onRowClick={onRowClick}
          footer={footerLabel}
        />
      )}
    </div>
  );
}
