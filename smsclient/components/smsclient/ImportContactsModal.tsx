"use client";

import { ProtoBtn } from "@/components/smsclient/ui";
import { cn } from "@/lib/cn";
import {
  buildPayloadFromMappedRow,
  type ImportColumnRole,
  IMPORT_ROLE_LABELS,
  suggestColumnRoles,
} from "@/lib/import/contactImportMap";
import { parseCsvText, type ParsedCsv } from "@/lib/import/parseCsv";
import { insertClientsFromImport } from "@/lib/supabase/clients";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const overlayCls =
  "fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/55 p-6 backdrop-blur-sm";
const modalCard =
  "max-h-[min(90vh,820px)] w-full max-w-[960px] overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.20)] flex flex-col";

const ROLE_OPTIONS: ImportColumnRole[] = [
  "skip",
  "phone",
  "first_name",
  "last_name",
  "group",
];

type DelimChoice = "auto" | "," | ";" | "\t";

/** Chrome / WebKit envoient souvent un clic juste après le drop : évite d’ouvrir le file picker et d’écraser l’import. */
function fileFromDataTransfer(dt: DataTransfer): File | null {
  if (dt.files?.length) return dt.files.item(0);
  if (dt.items?.length) {
    for (let i = 0; i < dt.items.length; i++) {
      const item = dt.items[i];
      if (item?.kind === "file") {
        const f = item.getAsFile();
        if (f) return f;
      }
    }
  }
  return null;
}

type ImportContactsModalProps = {
  open: boolean;
  onClose: () => void;
  supabase: SupabaseClient;
  userId: string;
  onImported: () => Promise<void>;
  onNotify: (msg: string) => void;
};

export function ImportContactsModal({
  open,
  onClose,
  supabase,
  userId,
  onImported,
  onNotify,
}: ImportContactsModalProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [delimChoice, setDelimChoice] = useState<DelimChoice>("auto");
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [roles, setRoles] = useState<ImportColumnRole[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Ignore le clic synthétique qui suit un drop (sinon input.click() → onChange vide → reset). */
  const suppressPickerClickRef = useRef(false);

  const reset = useCallback(() => {
    setFileName(null);
    setRawText(null);
    setParseError(null);
    setParsed(null);
    setRoles([]);
    setImportError(null);
    setImporting(false);
    setDragActive(false);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onPickFile = useCallback((file: File | null) => {
    setParseError(null);
    setParsed(null);
    setRoles([]);
    setRawText(null);
    setImportError(null);
    if (!file) {
      setFileName(null);
      return;
    }
    const hasCsvExtension = /\.csv$/i.test(file.name);
    const mimeOk =
      !file.type ||
      file.type === "text/csv" ||
      file.type.startsWith("text/csv") ||
      file.type === "application/csv";
    if (!hasCsvExtension && !mimeOk) {
      setParseError(
        "Choisis un fichier .csv (export Excel « CSV séparé par des virgules » ou point-virgule)."
      );
      setFileName(null);
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setRawText(text);
    };
    reader.onerror = () => {
      setParseError("Lecture du fichier impossible.");
      setFileName(null);
      setRawText(null);
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setDragActive(false);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const f = fileFromDataTransfer(e.dataTransfer);
      if (!f) {
        setParseError(
          "Aucun fichier détecté. Essaie de déposer le fichier depuis l’explorateur, ou utilise « parcourir »."
        );
        return;
      }
      suppressPickerClickRef.current = true;
      window.setTimeout(() => {
        suppressPickerClickRef.current = false;
      }, 500);
      onPickFile(f);
    },
    [onPickFile]
  );

  useEffect(() => {
    if (!rawText) {
      setParsed(null);
      setRoles([]);
      setParseError(null);
      return;
    }
    try {
      const delim =
        delimChoice === "auto"
          ? undefined
          : delimChoice === "\t"
          ? "\t"
          : delimChoice;
      const p = parseCsvText(rawText, delim);
      if (p.headers.length === 0) {
        setParseError("Le fichier ne contient pas d’en-têtes de colonnes.");
        setParsed(null);
        setRoles([]);
        return;
      }
      setParseError(null);
      setParsed(p);
      setRoles(suggestColumnRoles(p.headers));
    } catch {
      setParseError(
        "Impossible d’analyser ce fichier. Vérifie l’encodage (UTF-8 recommandé)."
      );
      setParsed(null);
      setRoles([]);
    }
  }, [rawText, delimChoice]);

  const setRole = useCallback((index: number, role: ImportColumnRole) => {
    setRoles((prev) => {
      const next = [...prev];
      if (role === "phone") {
        for (let j = 0; j < next.length; j++) {
          if (j !== index && next[j] === "phone") next[j] = "skip";
        }
      }
      next[index] = role;
      return next;
    });
  }, []);

  const hasPhoneColumn = useMemo(
    () => roles.some((r) => r === "phone"),
    [roles]
  );

  const previewRows = useMemo(() => {
    if (!parsed) return [];
    return parsed.rows.slice(0, 5);
  }, [parsed]);

  const rowCount = parsed?.rows.length ?? 0;

  const handleImport = useCallback(async () => {
    if (!parsed || !hasPhoneColumn || importing) return;
    setImportError(null);
    setImporting(true);
    try {
      const payloads = [];
      let skippedInvalid = 0;
      for (const row of parsed.rows) {
        const p = buildPayloadFromMappedRow(row, roles);
        if (!p) {
          skippedInvalid++;
          continue;
        }
        payloads.push(p);
      }

      const batch = await insertClientsFromImport(supabase, userId, payloads);

      const parts = [
        `${batch.inserted} contact${batch.inserted > 1 ? "s" : ""} importé${
          batch.inserted > 1 ? "s" : ""
        }`,
      ];
      if (batch.skippedDuplicateInFile > 0) {
        parts.push(
          `${batch.skippedDuplicateInFile} doublon${
            batch.skippedDuplicateInFile > 1 ? "s" : ""
          } dans le fichier`
        );
      }
      if (batch.skippedDuplicateInDb > 0) {
        parts.push(`${batch.skippedDuplicateInDb} déjà en base`);
      }
      const invalidTotal = skippedInvalid + batch.skippedInvalidRow;
      if (invalidTotal > 0) {
        parts.push(
          `${invalidTotal} ligne${
            invalidTotal > 1 ? "s" : ""
          } sans numéro valide`
        );
      }
      if (batch.otherErrors > 0) {
        parts.push(
          `${batch.otherErrors} erreur${batch.otherErrors > 1 ? "s" : ""}`
        );
      }

      onNotify(parts.join(" · "));
      await onImported();
      onClose();
    } catch (e) {
      setImportError(
        e instanceof Error ? e.message : "Import impossible pour le moment."
      );
    } finally {
      setImporting(false);
    }
  }, [
    parsed,
    roles,
    hasPhoneColumn,
    importing,
    supabase,
    userId,
    onImported,
    onNotify,
    onClose,
  ]);

  if (!open) return null;

  return (
    <div
      className={overlayCls}
      role="dialog"
      aria-modal
      aria-label="Importer des contacts"
      onClick={(e) => e.target === e.currentTarget && !importing && onClose()}
    >
      <div className={modalCard}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-[18px] py-4">
          <div>
            <div className="text-lg font-black text-slate-900">
              Importer des contacts
            </div>
            <div className="text-xs font-bold text-slate-500">
              Fichier CSV (UTF-8) — mappe chaque colonne vers un champ de l’app.
            </div>
          </div>
          <button
            type="button"
            disabled={importing}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-lg font-black shadow-[0_10px_22px_rgba(15,23,42,0.08)] disabled:opacity-50"
            aria-label="Fermer"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-[18px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
            <div className="text-[13px] font-black text-slate-800">
              1. Fichier et séparateur
            </div>
            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="min-w-0 flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  disabled={importing}
                  className="sr-only"
                  id="import-contacts-csv-input"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPickFile(f);
                    e.target.value = "";
                  }}
                />
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Zone de dépôt pour fichier CSV"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragEnter={onDragEnter}
                  onDragLeave={onDragLeave}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onClick={() => {
                    if (importing || suppressPickerClickRef.current) return;
                    fileInputRef.current?.click();
                  }}
                  className={cn(
                    "cursor-pointer rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fed] focus-visible:ring-offset-2",
                    dragActive
                      ? "border-[#2f6fed] bg-[#eef4ff]"
                      : "border-slate-300 bg-slate-50/80 hover:border-slate-400 hover:bg-slate-50",
                    importing &&
                      "pointer-events-none cursor-not-allowed opacity-60"
                  )}
                >
                  <div className="pointer-events-none">
                    <div className="text-2xl" aria-hidden>
                      📄
                    </div>
                    <p className="mt-2 text-sm font-extrabold text-slate-800">
                      {dragActive
                        ? "Dépose le fichier ici…"
                        : "Glisse-dépose un fichier CSV ici"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      ou clique pour parcourir ton ordinateur
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1 lg:w-[220px]">
                <label
                  htmlFor="import-delim-select"
                  className="text-xs font-bold text-slate-500"
                >
                  Séparateur de colonnes
                </label>
                <select
                  id="import-delim-select"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-extrabold text-slate-800"
                  value={delimChoice}
                  disabled={importing}
                  onChange={(e) =>
                    setDelimChoice(e.target.value as DelimChoice)
                  }
                >
                  <option value="auto">Auto (détection)</option>
                  <option value=";">Point-virgule (;)</option>
                  <option value=",">Virgule (,)</option>
                  <option value="\t">Tabulation</option>
                </select>
              </div>
            </div>
            {fileName && (
              <p className="mt-2 text-xs font-semibold text-slate-600">
                Fichier : {fileName}
              </p>
            )}
            <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500">
              Astuce : sous Excel, « Enregistrer sous » → CSV UTF-8 (séparateur
              point-virgule souvent en France). Si l’aperçu est incorrect,
              change le séparateur puis recharge le fichier.
            </p>
          </div>

          {parseError && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
              {parseError}
            </div>
          )}

          {parsed && parsed.headers.length > 0 && (
            <>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
                <div className="text-[13px] font-black text-slate-800">
                  2. Correspondance des colonnes
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Une colonne doit être mappée sur{" "}
                  <strong className="text-slate-700">Téléphone</strong> (mobile
                  français 10 chiffres). Le reste est optionnel.
                </p>
                {!hasPhoneColumn && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950">
                    Choisis la colonne qui contient le numéro de téléphone.
                  </p>
                )}
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-[13px]">
                    <thead>
                      <tr>
                        <th className="border-b border-slate-200 bg-slate-50 px-2 py-2 font-extrabold text-slate-800">
                          Colonne dans le fichier
                        </th>
                        <th className="border-b border-slate-200 bg-slate-50 px-2 py-2 font-extrabold text-slate-800">
                          1ère valeur (aperçu)
                        </th>
                        <th className="border-b border-slate-200 bg-slate-50 px-2 py-2 font-extrabold text-slate-800">
                          Champ dans l’app
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.headers.map((h, i) => (
                        <tr key={`${h}-${i}`}>
                          <td className="border-b border-slate-100 px-2 py-2 font-bold text-slate-800">
                            {h || `Colonne ${i + 1}`}
                          </td>
                          <td className="max-w-[220px] border-b border-slate-100 px-2 py-2 font-semibold text-slate-600">
                            <span className="line-clamp-2 break-all">
                              {parsed.rows[0]?.[i] ?? "—"}
                            </span>
                          </td>
                          <td className="border-b border-slate-100 px-2 py-2">
                            <select
                              className={cn(
                                "w-full max-w-[260px] rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm font-extrabold",
                                roles[i] === "phone" &&
                                  "border-[#2f6fed] ring-2 ring-[#2f6fed]/20"
                              )}
                              value={roles[i] ?? "skip"}
                              disabled={importing}
                              onChange={(e) =>
                                setRole(i, e.target.value as ImportColumnRole)
                              }
                            >
                              {ROLE_OPTIONS.map((r) => (
                                <option key={r} value={r}>
                                  {IMPORT_ROLE_LABELS[r]}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
                <div className="text-[13px] font-black text-slate-800">
                  3. Aperçu des lignes ({rowCount} ligne
                  {rowCount > 1 ? "s" : ""})
                </div>
                <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[520px] text-[12px]">
                    <thead>
                      <tr className="bg-slate-50">
                        {parsed.headers.map((h, i) => (
                          <th
                            key={`ph-${i}`}
                            className="border-b border-slate-200 px-2 py-2 text-left font-extrabold text-slate-700"
                          >
                            {h || `…${i}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((cells, ri) => (
                        <tr key={ri}>
                          {parsed.headers.map((_, ci) => (
                            <td
                              key={ci}
                              className="border-b border-slate-100 px-2 py-1.5 font-semibold text-slate-600"
                            >
                              <span className="line-clamp-2 break-all">
                                {cells[ci] ?? ""}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {importError && (
          <div className="shrink-0 border-t border-rose-200 bg-rose-50 px-[18px] py-2 text-sm font-bold text-rose-900">
            {importError}
          </div>
        )}

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white px-[18px] py-3.5">
          <ProtoBtn disabled={importing} onClick={onClose}>
            Annuler
          </ProtoBtn>
          <ProtoBtn
            primary
            disabled={importing || !parsed || !hasPhoneColumn || rowCount === 0}
            onClick={() => void handleImport()}
          >
            {importing
              ? "Import…"
              : `Importer ${rowCount} ligne${rowCount > 1 ? "s" : ""}`}
          </ProtoBtn>
        </div>
      </div>
    </div>
  );
}
