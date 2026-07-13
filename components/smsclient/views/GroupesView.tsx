"use client";

import { SearchBar } from "@/components/smsclient/Shell";
import { SectionGuideCard } from "@/components/smsclient/SectionGuideCard";
import { CellTruncate, ProtoBtn, PlusIcon } from "@/components/smsclient/ui";
import { DataTable } from "@/components/smsclient/DataTable";
import type { GroupRowData } from "@/lib/types/group";
import { useMemo, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<GroupRowData, unknown>[] = [
  {
    accessorKey: "name",
    header: "Nom du groupe",
    cell: ({ getValue }) => (
      <CellTruncate as="div">{getValue<string>()}</CellTruncate>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ getValue }) => (
      <CellTruncate as="div">{getValue<string>().trim() || "—"}</CellTruncate>
    ),
  },
  { accessorKey: "contactCount", header: "Contacts", size: 90 },
  {
    accessorKey: "lastCampaignLabel",
    header: "Dernière campagne",
    size: 160,
    cell: ({ getValue }) => (
      <CellTruncate as="div">{getValue<string>()}</CellTruncate>
    ),
  },
  {
    accessorKey: "createdLabel",
    header: "Création",
    size: 130,
    cell: ({ getValue }) => (
      <CellTruncate as="div">{getValue<string>()}</CellTruncate>
    ),
  },
];

type GroupesProps = {
  rows: GroupRowData[];
  loading: boolean;
  error: string | null;
  onCreateGroup: () => void;
  onEditGroup: (row: GroupRowData) => void;
  onDeleteGroups: (ids: string[]) => void;
  onCreateCampaignFromGroups: (ids: string[]) => void;
};

export function GroupesView({
  rows,
  loading,
  error,
  onCreateGroup,
  onEditGroup,
  onDeleteGroups,
  onCreateCampaignFromGroups,
}: GroupesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const hasSelection = selectedIds.size > 0;
  const showBigEmpty = !loading && !error && rows.length === 0;

  const footerLabel = useMemo(() => {
    return `${rows.length} groupe${rows.length > 1 ? "s" : ""}`;
  }, [rows]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === rows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.id)));
    }
  };

  const selectColumns: ColumnDef<GroupRowData, unknown>[] = [
    {
      id: "select",
      size: 40,
      enableResizing: false,
      header: () => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#2f6fed] focus:ring-[#2f6fed]"
            checked={selectedIds.size > 0 && selectedIds.size === rows.length}
            ref={(el) => {
              if (el)
                el.indeterminate =
                  selectedIds.size > 0 && selectedIds.size < rows.length;
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
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      {showBigEmpty && (
        <SectionGuideCard section="groupes" onPrimaryAction={onCreateGroup} />
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <SearchBar
            placeholder="Rechercher un groupe..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <div className="mt-0.5 flex flex-wrap gap-3">
          {hasSelection ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onDeleteGroups(Array.from(selectedIds));
                  setSelectedIds(new Set());
                }}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-bold text-rose-600 transition-all hover:bg-rose-100"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Supprimer ({selectedIds.size})
              </button>
              <ProtoBtn
                primary
                onClick={() => {
                  onCreateCampaignFromGroups(Array.from(selectedIds));
                  setSelectedIds(new Set());
                }}
              >
                <Send className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                Créer une campagne
              </ProtoBtn>
            </>
          ) : (
            <ProtoBtn primary onClick={onCreateGroup}>
              <PlusIcon />
              Créer un groupe
            </ProtoBtn>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
          {error}
        </div>
      )}

      {showBigEmpty ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center">
          <p className="m-0 text-base font-extrabold text-slate-800">
            Aucun groupe
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Créez votre premier segment avec « Créer un groupe ».
          </p>
        </div>
      ) : (
        <DataTable
          columns={selectColumns}
          data={rows}
          loading={loading}
          pageSize={20}
          globalFilter={searchQuery}
          emptyMessage="Aucun groupe."
          searchNoResultsMessage="Aucun groupe ne correspond à votre recherche."
          onRowClick={onEditGroup}
          footer={footerLabel}
        />
      )}
    </div>
  );
}
