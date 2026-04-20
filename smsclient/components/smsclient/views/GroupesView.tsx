"use client";

import { SearchBar } from "@/components/smsclient/Shell";
import { ProtoBtn, PlusIcon } from "@/components/smsclient/ui";
import type { GroupRowData } from "@/lib/types/group";
import { useMemo, useState } from "react";

type GroupesProps = {
  rows: GroupRowData[];
  loading: boolean;
  error: string | null;
  onCreateGroup: () => void;
};

export function GroupesView({
  rows,
  loading,
  error,
  onCreateGroup,
}: GroupesProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const hay = [row.name, String(row.contactCount), row.lastCampaignLabel, row.createdLabel]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, searchQuery]);

  const showBigEmpty = !loading && !error && rows.length === 0;
  const searchNoResults =
    !loading &&
    !error &&
    rows.length > 0 &&
    filtered.length === 0 &&
    Boolean(searchQuery.trim());

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="m-0 text-[34px] font-extrabold tracking-tight text-slate-900">
            Groupes
          </h1>
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

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm font-bold text-slate-600">
          Chargement des groupes…
        </div>
      )}

      {showBigEmpty && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center">
          <p className="m-0 text-base font-extrabold text-slate-800">Aucun groupe</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Les groupes par défaut apparaîtront après migration Supabase, ou crée ton premier segment.
          </p>
        </div>
      )}

      {!loading && !showBigEmpty && (
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <div className="overflow-auto">
            <table className="w-full border-separate border-spacing-0 text-[15px]">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold">
                    Nom du groupe
                  </th>
                  <th className="border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold">
                    Contacts
                  </th>
                  <th className="border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold">
                    Dernière campagne
                  </th>
                  <th className="border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold">
                    Date de création
                  </th>
                </tr>
              </thead>
              <tbody>
                {searchNoResults ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="border-b border-slate-100 px-[18px] py-8 text-center text-sm font-bold text-slate-600"
                    >
                      Aucun groupe ne correspond à ta recherche.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id}>
                      <td className="border-b border-slate-100 px-[18px] py-3.5 font-extrabold text-slate-900">
                        {row.name}
                      </td>
                      <td className="border-b border-slate-100 px-[18px] py-3.5">
                        {row.contactCount}
                      </td>
                      <td className="border-b border-slate-100 px-[18px] py-3.5">
                        {row.lastCampaignLabel}
                      </td>
                      <td className="border-b border-slate-100 px-[18px] py-3.5">
                        {row.createdLabel}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-3.5 py-3 text-sm font-semibold text-slate-600">
            <span>
              {filtered.length === rows.length
                ? `${rows.length} groupe${rows.length > 1 ? "s" : ""}`
                : `${filtered.length} affiché${filtered.length > 1 ? "s" : ""} sur ${rows.length}`}
            </span>
          </div>
        </section>
      )}
    </>
  );
}
