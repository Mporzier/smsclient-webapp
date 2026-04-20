"use client";

import { SearchBar } from "@/components/smsclient/Shell";
import { ProtoBtn, PlusIcon } from "@/components/smsclient/ui";
import type { ContactRowData } from "@/lib/types/contact";
import { formatContactGroups } from "@/lib/types/contact";
import { useMemo, useState } from "react";

const tagCls =
  "inline-flex items-center rounded-[10px] border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-[13px] font-bold text-[#1f3b77]";

type ContactsProps = {
  rows: ContactRowData[];
  loading: boolean;
  error: string | null;
  onImport: () => void;
  onAddContact: () => void;
  onRowClick: (row: ContactRowData) => void;
};

export function ContactsView({
  rows,
  loading,
  error,
  onImport,
  onAddContact,
  onRowClick,
}: ContactsProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const hay = [
        row.name,
        row.phone,
        formatContactGroups(row.groups),
        ...row.groups,
        row.source,
        row.lastSms,
      ]
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
            Contacts
          </h1>
          <SearchBar
            placeholder="Rechercher un contact..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-3">
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

      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
        <div className="min-h-0 overflow-auto">
          {showBigEmpty ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="text-5xl opacity-40" aria-hidden>
                👤
              </div>
              <p className="m-0 max-w-[360px] text-lg font-extrabold text-slate-800">
                Aucun contact pour l’instant
              </p>
              <p className="m-0 max-w-[400px] text-sm font-semibold leading-relaxed text-slate-500">
                Clique sur « Ajouter un contact » pour enregistrer ton premier numéro. Les
                contacts sont enregistrés dans ton espace Supabase et liés à ton compte.
              </p>
            </div>
          ) : (
            <table className="w-full border-separate border-spacing-0 text-[15px]">
              <thead>
                <tr>
                  <th className="w-40 whitespace-nowrap border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                    Date de création
                  </th>
                  <th className="w-44 whitespace-nowrap border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                    Prénom
                  </th>
                  <th className="w-52 whitespace-nowrap border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                    Téléphone
                  </th>
                  <th className="min-w-[12rem] border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                    Groupes
                  </th>
                  <th className="w-52 whitespace-nowrap border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                    Dernier SMS envoyé
                  </th>
                  <th className="w-44 whitespace-nowrap border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="border-b border-slate-100 px-[18px] py-12 text-center text-sm font-semibold text-slate-500"
                    >
                      Chargement des contacts…
                    </td>
                  </tr>
                ) : searchNoResults ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="border-b border-slate-100 px-[18px] py-12 text-center text-sm font-semibold text-slate-500"
                    >
                      Aucun contact ne correspond à ta recherche.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr
                      key={row.id}
                      className="cursor-pointer hover:bg-indigo-50/60"
                      tabIndex={0}
                      role="button"
                      onClick={() => onRowClick(row)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }}
                    >
                      <td className="whitespace-nowrap border-b border-slate-100 px-[18px] py-3.5 text-slate-900">
                        {row.created}
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-[18px] py-3.5 font-extrabold text-slate-900">
                        {row.name}
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-[18px] py-3.5 text-slate-900">
                        {row.phone}
                      </td>
                      <td className="border-b border-slate-100 px-[18px] py-3 text-slate-900">
                        <div className="flex max-w-[min(100%,22rem)] flex-wrap gap-1.5">
                          {row.groups.length === 0 ? (
                            <span className="text-sm font-semibold text-slate-500">
                              Non classé
                            </span>
                          ) : (
                            row.groups.map((g) => (
                              <span key={g} className={tagCls}>
                                {g}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-[18px] py-3.5 text-slate-900">
                        {row.lastSms}
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-[18px] py-3.5 text-slate-900">
                        {row.source}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        {!showBigEmpty && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-600">
            <span>
              {loading
                ? "…"
                : `${filtered.length} contact${filtered.length > 1 ? "s" : ""} affiché${filtered.length > 1 ? "s" : ""}`}
            </span>
          </div>
        )}
      </section>
    </>
  );
}
