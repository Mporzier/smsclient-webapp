"use client";

import { SearchBar } from "@/components/smsclient/Shell";
import { CellTruncate, ProtoBtn, PlusIcon } from "@/components/smsclient/ui";
import { DataTable } from "@/components/smsclient/DataTable";
import type { GroupRowData } from "@/lib/types/group";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<GroupRowData, unknown>[] = [
  {
    accessorKey: "name",
    header: "Nom du groupe",
    cell: ({ getValue }) => (
      <CellTruncate as="div" className="font-extrabold">
        {getValue<string>()}
      </CellTruncate>
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
    cell: ({ getValue }) => <CellTruncate as="div">{getValue<string>()}</CellTruncate>,
  },
  {
    accessorKey: "createdLabel",
    header: "Création",
    size: 130,
    cell: ({ getValue }) => <CellTruncate as="div">{getValue<string>()}</CellTruncate>,
  },
];

type GroupesProps = {
  rows: GroupRowData[];
  loading: boolean;
  error: string | null;
  onCreateGroup: () => void;
  onEditGroup: (row: GroupRowData) => void;
};

export function GroupesView({
  rows,
  loading,
  error,
  onCreateGroup,
  onEditGroup,
}: GroupesProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const showBigEmpty = !loading && !error && rows.length === 0;

  const footerLabel = useMemo(() => {
    return `${rows.length} groupe${rows.length > 1 ? "s" : ""}`;
  }, [rows]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <SearchBar
            placeholder="Rechercher un groupe..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <div className="mt-0.5 flex flex-wrap gap-3">
          <ProtoBtn primary onClick={onCreateGroup}>
            <PlusIcon />
            Créer un groupe
          </ProtoBtn>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
          {error}
        </div>
      )}

      {showBigEmpty ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center">
          <p className="m-0 text-base font-extrabold text-slate-800">Aucun groupe</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Crée ton premier segment avec « Créer un groupe ».
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          pageSize={20}
          globalFilter={searchQuery}
          emptyMessage="Aucun groupe."
          searchNoResultsMessage="Aucun groupe ne correspond à ta recherche."
          onRowClick={onEditGroup}
          footer={footerLabel}
        />
      )}
    </div>
  );
}
