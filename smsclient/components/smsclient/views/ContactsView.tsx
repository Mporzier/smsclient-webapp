"use client";

import { SearchBar } from "@/components/smsclient/Shell";
import { CellTruncate, ProtoBtn, PlusIcon } from "@/components/smsclient/ui";
import { cn } from "@/lib/cn";
import type { ContactRowData } from "@/lib/types/contact";
import {
  formatContactGroups,
  isCampaignEligibleContact,
} from "@/lib/types/contact";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { UserRound } from "lucide-react";

const tagCls =
  "inline-flex items-center rounded-[10px] border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-[13px] font-bold text-[#1f3b77]";

function smsStatusCell(row: ContactRowData) {
  if (row.stopSms) {
    return (
      <span className="inline-flex rounded-[10px] border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[13px] font-extrabold text-rose-800">
        STOP
      </span>
    );
  }
  if (row.optIn) {
    return (
      <span className="inline-flex rounded-[10px] border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[13px] font-extrabold text-emerald-900">
        Opt-in
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-[10px] border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[13px] font-extrabold text-slate-700">
      Non opt-in
    </span>
  );
}

type ViewMode = "cibles" | "desabonnes";

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
  const [viewMode, setViewMode] = useState<ViewMode>("cibles");

  const nDesabonnes = useMemo(
    () => rows.filter((r) => r.stopSms).length,
    [rows],
  );
  const nCibles = useMemo(
    () => rows.filter((r) => isCampaignEligibleContact(r)).length,
    [rows],
  );
  const nTous = rows.length;

  const scopeFiltered = useMemo(() => {
    if (viewMode === "desabonnes") {
      return rows.filter((r) => r.stopSms);
    }
    return rows.filter((r) => isCampaignEligibleContact(r));
  }, [rows, viewMode]);

  const searchFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return scopeFiltered;
    return scopeFiltered.filter((row) => {
      const st = row.stopSms
        ? "stop"
        : row.optIn
          ? "opt-in"
          : "non opt-in";
      const hay = [
        row.name,
        row.firstName,
        row.lastName,
        row.phone,
        row.notes,
        formatContactGroups(row.groups),
        ...row.groups,
        row.source,
        row.lastSms,
        st,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [scopeFiltered, searchQuery]);

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
  }, [searchFiltered, loading, viewMode]);

  const showBigEmpty = !loading && !error && rows.length === 0;
  const scopeEmpty =
    !loading && !error && rows.length > 0 && scopeFiltered.length === 0;
  const searchNoResults =
    !loading &&
    !error &&
    scopeFiltered.length > 0 &&
    searchFiltered.length === 0 &&
    Boolean(searchQuery.trim());

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="m-0 text-[34px] font-extrabold tracking-tight text-slate-900">
            Contacts
          </h1>
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
              role="group"
              aria-label="Vue contacts : cibles campagne ou désabonnés STOP"
              className="inline-flex flex-wrap items-stretch gap-0 rounded-2xl border border-slate-200 bg-slate-100/90 p-1"
            >
              <button
                type="button"
                aria-pressed={viewMode === "cibles"}
                title="Contacts opt-in et sans STOP — seuls numéros utilisables pour l’envoi de campagnes."
                onClick={() => setViewMode("cibles")}
                className={cn(
                  "inline-flex min-h-[40px] items-center gap-2 rounded-[10px] px-3 py-2 text-[13px] font-extrabold transition-colors",
                  viewMode === "cibles"
                    ? "border border-[#2f6fed] bg-white text-[#1f3b77] shadow-[0_4px_12px_rgba(47,111,237,0.12)]"
                    : "border border-transparent text-slate-600 hover:text-slate-900",
                )}
              >
                Cibles campagne
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[11px] font-black tabular-nums",
                    viewMode === "cibles"
                      ? "bg-[#eef4ff] text-[#1f3b77]"
                      : "bg-slate-200/80 text-slate-700",
                  )}
                >
                  {nCibles}
                </span>
              </button>
              <button
                type="button"
                aria-pressed={viewMode === "desabonnes"}
                title="STOP : ne plus contacter par SMS. Vue à des fins de conformité ou de vérification."
                onClick={() => setViewMode("desabonnes")}
                className={cn(
                  "inline-flex min-h-[40px] items-center gap-2 rounded-[10px] px-3 py-2 text-[13px] font-extrabold transition-colors",
                  viewMode === "desabonnes"
                    ? "border border-rose-500 bg-white text-rose-900 shadow-[0_4px_12px_rgba(225,29,72,0.12)]"
                    : "border border-transparent text-slate-600 hover:text-slate-900",
                )}
              >
                Désabonnés
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[11px] font-black tabular-nums",
                    viewMode === "desabonnes"
                      ? "bg-rose-100 text-rose-900"
                      : "bg-slate-200/80 text-slate-700",
                  )}
                >
                  {nDesabonnes}
                </span>
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

      <section className="flex w-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
        <div ref={tableScrollRef} className="relative min-h-0 overflow-x-auto">
          {tableScrollX && !showBigEmpty && !loading && (
            <p className="m-0 border-b border-slate-200 bg-amber-50/90 px-3.5 py-1.5 text-center text-xs font-bold text-amber-900/80">
              ← Défilement horizontal : toutes les colonnes ne sont pas visibles →
            </p>
          )}
          {showBigEmpty ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <UserRound
                className="h-14 w-14 text-slate-400"
                strokeWidth={1.25}
                aria-hidden
              />
              <p className="m-0 max-w-[360px] text-lg font-extrabold text-slate-800">
                Aucun contact pour l’instant
              </p>
              <p className="m-0 max-w-[400px] text-sm font-semibold leading-relaxed text-slate-500">
                Clique sur « Ajouter un contact » pour enregistrer ton premier numéro. Les
                contacts sont enregistrés dans ton espace Supabase et liés à ton compte.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-0 table-fixed border-separate border-spacing-0 text-[15px]">
              <colgroup>
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[11%]" />
                <col className="w-[22%]" />
                <col className="w-[18%]" />
                <col className="w-[10%]" />
                <col className="w-[9%]" />
              </colgroup>
              <thead>
                <tr>
                  <th className="min-w-0 border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                    Date de création
                  </th>
                  <th className="min-w-0 border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                    Prénom
                  </th>
                  <th className="min-w-0 border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                    Nom
                  </th>
                  <th className="min-w-0 border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                    Téléphone
                  </th>
                  <th className="min-w-0 border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                    Groupes
                  </th>
                  <th className="min-w-0 border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                    Notes
                  </th>
                  <th className="min-w-0 border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                    Dernier SMS envoyé
                  </th>
                  <th className="min-w-0 border-b border-slate-200 bg-slate-50 px-[18px] py-3.5 text-left text-sm font-extrabold text-slate-900">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="border-b border-slate-100 px-[18px] py-12 text-center text-sm font-semibold text-slate-500"
                    >
                      Chargement des contacts…
                    </td>
                  </tr>
                ) : scopeEmpty ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="border-b border-slate-100 px-[18px] py-12 text-center text-sm font-bold leading-relaxed text-slate-600"
                    >
                      {viewMode === "cibles" ? (
                        <>
                          Aucune cible : ajoute un contact, ou ouvre la vue
                          « Désabonnés » s’il y a des fiches en STOP.
                        </>
                      ) : (
                        "Aucun contact avec STOP (désabonné)."
                      )}
                    </td>
                  </tr>
                ) : searchNoResults ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="border-b border-slate-100 px-[18px] py-12 text-center text-sm font-semibold text-slate-500"
                    >
                      Aucun contact ne correspond à ta recherche.
                    </td>
                  </tr>
                ) : (
                  searchFiltered.map((row) => (
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
                      <td className="min-w-0 max-w-0 border-b border-slate-100 px-[18px] py-3.5 align-top text-slate-900">
                        <CellTruncate as="div">{row.created}</CellTruncate>
                      </td>
                      <td className="min-w-0 max-w-0 border-b border-slate-100 px-[18px] py-3.5 align-top font-extrabold text-slate-900">
                        <CellTruncate
                          as="div"
                          title={row.firstName.trim() || "—"}
                        >
                          {row.firstName.trim() || "—"}
                        </CellTruncate>
                      </td>
                      <td className="min-w-0 max-w-0 border-b border-slate-100 px-[18px] py-3.5 align-top font-extrabold text-slate-900">
                        <CellTruncate
                          as="div"
                          title={row.lastName.trim() || "—"}
                        >
                          {row.lastName.trim() || "—"}
                        </CellTruncate>
                      </td>
                      <td className="min-w-0 max-w-0 border-b border-slate-100 px-[18px] py-3.5 align-top text-slate-900">
                        <CellTruncate as="div">{row.phone}</CellTruncate>
                      </td>
                      <td className="min-w-0 max-w-0 border-b border-slate-100 px-[18px] py-3 align-top text-slate-900">
                        <div
                          className="min-w-0"
                          title={
                            row.groups.length
                              ? formatContactGroups(row.groups)
                              : undefined
                          }
                        >
                          {row.groups.length === 0 ? (
                            <span className="text-sm font-semibold text-slate-500">
                              Non classé
                            </span>
                          ) : (
                            <div className="flex max-h-14 min-w-0 flex-wrap content-start gap-1.5 overflow-hidden">
                              {row.groups.map((g) => (
                                <span
                                  key={g}
                                  className={cn(
                                    tagCls,
                                    "min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap sm:max-w-[9.5rem]",
                                  )}
                                >
                                  {g}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="min-w-0 max-w-0 border-b border-slate-100 px-[18px] py-3.5 align-top text-slate-900">
                        <CellTruncate
                          as="div"
                          title={row.notes.trim() || "—"}
                        >
                          {row.notes.trim() || "—"}
                        </CellTruncate>
                      </td>
                      <td className="min-w-0 max-w-0 border-b border-slate-100 px-[18px] py-3.5 align-top text-slate-900">
                        <CellTruncate as="div">{row.lastSms}</CellTruncate>
                      </td>
                      <td className="min-w-0 max-w-0 border-b border-slate-100 px-[18px] py-3.5 align-top text-slate-900">
                        <CellTruncate as="div">{row.source}</CellTruncate>
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
                : scopeEmpty
                  ? "0 contact affiché"
                  : `${searchFiltered.length} contact${searchFiltered.length > 1 ? "s" : ""} affiché${searchFiltered.length > 1 ? "s" : ""}`}
            </span>
          </div>
        )}
      </section>
    </>
  );
}
