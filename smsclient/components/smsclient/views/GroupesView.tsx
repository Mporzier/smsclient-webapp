"use client";

import { SearchBar } from "@/components/smsclient/Shell";
import { CellTruncate, ProtoBtn, PlusIcon } from "@/components/smsclient/ui";
import type { GroupRowData } from "@/lib/types/group";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

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

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const hay = [row.name, row.description, String(row.contactCount), row.lastCampaignLabel, row.createdLabel]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, searchQuery]);

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollX, setTableScrollX] = useState(false);

  useLayoutEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    const update = () => {
      setTableScrollX(el.scrollWidth > el.clientWidth + 2);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [filtered, loading]);

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
        <section className="flex w-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <div ref={tableScrollRef} className="relative min-h-0 overflow-x-auto">
            {tableScrollX && (
              <p className="m-0 border-b border-slate-200 bg-amber-50/90 px-3.5 py-1.5 text-center text-xs font-bold text-amber-900/80">
                ← Défilement horizontal : toutes les colonnes ne sont pas visibles →
              </p>
            )}
            <table className="w-full min-w-0 table-fixed border-separate border-spacing-0 text-[15px]">
              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[28%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead>
                <tr>
                  <th className="min-w-0 border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                    Nom du groupe
                  </th>
                  <th className="min-w-0 border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                    Description
                  </th>
                  <th className="min-w-0 border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                    Contacts
                  </th>
                  <th className="min-w-0 border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                    Dernière campagne
                  </th>
                  <th className="min-w-0 border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                    Date de création
                  </th>
                </tr>
              </thead>
              <tbody>
                {searchNoResults ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="border-b border-slate-100 px-[18px] py-8 text-center text-sm font-bold text-slate-600"
                    >
                      Aucun groupe ne correspond à ta recherche.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr
                      key={row.id}
                      className="cursor-pointer hover:bg-indigo-50/60"
                      tabIndex={0}
                      role="button"
                      onClick={() => onEditGroup(row)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onEditGroup(row);
                        }
                      }}
                    >
                      <td className="min-w-0 max-w-0 border-b border-slate-100 px-[18px] py-3.5 align-top font-extrabold text-slate-900">
                        <CellTruncate as="div" title={row.name}>
                          {row.name}
                        </CellTruncate>
                      </td>
                      <td className="min-w-0 max-w-0 border-b border-slate-100 px-[18px] py-3.5 align-top text-slate-800">
                        <CellTruncate as="div" title={row.description.trim() || "—"}>
                          {row.description.trim() || "—"}
                        </CellTruncate>
                      </td>
                      <td className="min-w-0 max-w-0 border-b border-slate-100 px-[18px] py-3.5 align-top text-slate-800">
                        {row.contactCount}
                      </td>
                      <td className="min-w-0 max-w-0 border-b border-slate-100 px-[18px] py-3.5 align-top text-slate-800">
                        <CellTruncate as="div">{row.lastCampaignLabel}</CellTruncate>
                      </td>
                      <td className="min-w-0 max-w-0 border-b border-slate-100 px-[18px] py-3.5 align-top text-slate-800">
                        <CellTruncate as="div">{row.createdLabel}</CellTruncate>
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
