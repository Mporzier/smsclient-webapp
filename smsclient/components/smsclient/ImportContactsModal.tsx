"use client";

import { ProtoBtn } from "@/components/smsclient/ui";
import { cn } from "@/lib/cn";
import {
  buildPayloadFromMappedRow,
  formatFrPhoneDisplay,
  type ImportColumnRole,
  IMPORT_ROLE_LABELS,
  looksLikeFrPhone,
  suggestColumnRoles,
} from "@/lib/import/contactImportMap";
import { parseCsvText, type ParsedCsv } from "@/lib/import/parseCsv";
import { insertClientsFromImport } from "@/lib/supabase/clients";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CloudUpload, FileSpreadsheet, Info, Loader2, Upload, X } from "lucide-react";

const overlayCls =
  "fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/55 p-6 backdrop-blur-sm";
const modalCard =
  "max-h-[min(90vh,820px)] w-full max-w-[960px] overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.20)] flex flex-col";

const ROLE_OPTIONS: ImportColumnRole[] = [
  "skip",
  "phone",
  "first_name",
  "last_name",
];


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
  defaultGroupLabel?: string | null;
};

export function ImportContactsModal({
  open,
  onClose,
  supabase,
  userId,
  onImported,
  onNotify,
  defaultGroupLabel = null,
}: ImportContactsModalProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
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
    setFileLoading(false);
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
    setFileLoading(false);
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
    setFileLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setRawText(text);
      setFileLoading(false);
    };
    reader.onerror = () => {
      setParseError("Lecture du fichier impossible.");
      setFileName(null);
      setRawText(null);
      setFileLoading(false);
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
      const p = parseCsvText(rawText);
      if (p.headers.length === 0) {
        setParseError("Le fichier ne contient pas d’en-têtes de colonnes.");
        setParsed(null);
        setRoles([]);
        return;
      }
      setParseError(null);
      setParsed(p);
      setRoles(suggestColumnRoles(p.headers, p.rows));
    } catch {
      setParseError(
        "Impossible d’analyser ce fichier. Vérifie l’encodage (UTF-8 recommandé)."
      );
      setParsed(null);
      setRoles([]);
    }
  }, [rawText]);

  const setRole = useCallback((index: number, role: ImportColumnRole) => {
    setRoles((prev) => {
      const next = [...prev];
      if (role !== "skip") {
        for (let j = 0; j < next.length; j++) {
          if (j !== index && next[j] === role) next[j] = "skip";
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
        if (defaultGroupLabel?.trim()) {
          const merged = new Set([...p.groupLabels, defaultGroupLabel.trim()]);
          p.groupLabels = Array.from(merged);
        }
        payloads.push(p);
      }

      const batch = await insertClientsFromImport(supabase, userId, payloads);

      if (batch.inserted === 0) {
        const invalidTotal = skippedInvalid + batch.skippedInvalidRow;
        const dupes = batch.skippedDuplicateInFile + batch.skippedDuplicateInDb;
        const reasons: string[] = [];
        if (invalidTotal > 0) {
          reasons.push(
            "numéros non reconnus — utilise 10 chiffres 06/07 (ex. 06 12 34 56 78) ou +33 6 12 34 56 78"
          );
        }
        if (dupes > 0) {
          reasons.push("doublons (dans le fichier ou déjà en base)");
        }
        if (batch.otherErrors > 0) {
          reasons.push("erreur d’enregistrement côté serveur");
        }
        setImportError(
          reasons.length > 0
            ? `Aucun contact n’a été importé. ${reasons.join(
                " · "
              )}. Corrige le CSV puis réessaie — la modale reste ouverte.`
            : "Aucun contact n’a été enregistré. Réessaie (la modale reste ouverte)."
        );
        return;
      }

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
          `${invalidTotal} ligne${invalidTotal > 1 ? "s" : ""} ignorée${
            invalidTotal > 1 ? "s" : ""
          } (numéro non valide)`
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
            <div className="flex items-center gap-2.5 text-xl font-black text-slate-900">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-blue-100 bg-blue-50">
                <CloudUpload className="h-6 w-6 text-blue-500" aria-hidden />
              </div>
              Importer des contacts
            </div>
          </div>
          <button
            type="button"
            disabled={importing}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-lg font-black shadow-[0_10px_22px_rgba(15,23,42,0.08)] disabled:opacity-50"
            aria-label="Fermer"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-[18px]">
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

          {!parsed && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
              <div
                aria-label="Zone de dépôt pour fichier CSV"
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDragOver={onDragOver}
                onDrop={onDrop}
                className={cn(
                  "rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
                  dragActive
                    ? "border-[#2f6fed] bg-[#eef4ff]"
                    : "border-slate-300 bg-slate-50/80",
                  importing &&
                    "pointer-events-none cursor-not-allowed opacity-60"
                )}
              >
                {fileLoading ? (
                  <>
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#2f6fed]" aria-hidden />
                    <p className="mt-3 text-sm font-extrabold text-slate-800">
                      Analyse du fichier en cours…
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {fileName}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-emerald-100 bg-emerald-50">
                      <FileSpreadsheet
                        className="h-6 w-6 text-emerald-500"
                        aria-hidden
                      />
                    </div>
                    <p className="mt-2 text-sm font-extrabold text-slate-800">
                      {dragActive
                        ? "Dépose le fichier ici…"
                        : "Glissez-déposez un fichier CSV ici"}
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-slate-500">
                      ou
                    </p>
                    <button
                      type="button"
                      disabled={importing}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (importing || suppressPickerClickRef.current) return;
                        fileInputRef.current?.click();
                      }}
                      className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#2f6fed] bg-[#2f6fed] px-4 py-2 text-sm font-bold text-white shadow-[0_4px_12px_rgba(47,111,237,0.25)] transition-all hover:bg-[#2560d4] hover:shadow-[0_6px_16px_rgba(47,111,237,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Upload className="h-4 w-4" aria-hidden />
                      Choisir un fichier CSV
                    </button>
                  </>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2.5">
                <Info className="h-4 w-4 shrink-0 text-blue-500" aria-hidden />
                <p className="m-0 text-center text-xs font-semibold leading-relaxed text-slate-700">
                  Depuis Excel : Fichier → Enregistrer sous → Format CSV UTF-8
                </p>
              </div>
            </div>
          )}

          {parseError && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
              {parseError}
            </div>
          )}

          {parsed && parsed.headers.length > 0 && (
            <>
              {fileName && (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                  <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                  <span className="text-sm font-bold text-slate-800">{fileName}</span>
                  <span className="text-xs font-semibold text-slate-500">
                    — {parsed.rows.length} ligne{parsed.rows.length > 1 ? "s" : ""} détectée{parsed.rows.length > 1 ? "s" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={reset}
                    disabled={importing}
                    className="ml-auto cursor-pointer text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-50"
                  >
                    Changer de fichier
                  </button>
                </div>
              )}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
                <div className="text-[13px] font-black text-slate-800">
                  Correspondance des colonnes
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Une colonne doit être mappée sur{" "}
                  <strong className="text-slate-700">Téléphone</strong> (06/07
                  en 10 chiffres ou +33 6/7). Le reste est optionnel.
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
                  Aperçu des lignes ({rowCount} ligne
                  {rowCount > 1 ? "s" : ""})
                </div>
                <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[520px] text-[12px]">
                    <thead>
                      <tr className="bg-slate-50">
                        {parsed.headers.map((h, i) => {
                          const role = roles[i];
                          const label = role && role !== "skip" ? IMPORT_ROLE_LABELS[role] : (h || `Colonne ${i + 1}`);
                          return (
                            <th
                              key={`ph-${i}`}
                              className={cn(
                                "border-b border-slate-200 px-2 py-2 text-left font-extrabold",
                                role && role !== "skip" ? "text-[#2f6fed]" : "text-slate-500"
                              )}
                            >
                              {label}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((cells, ri) => {
                        const phoneColIdx = roles.indexOf("phone");
                        const phoneVal = phoneColIdx >= 0 ? (cells[phoneColIdx] ?? "") : "";
                        const isInvalid = phoneColIdx >= 0 && !looksLikeFrPhone(phoneVal);
                        return (
                          <tr key={ri} className={isInvalid ? "bg-rose-50/60" : ""}>
                            {parsed.headers.map((_, ci) => {
                              const raw = cells[ci] ?? "";
                              const display = ci === phoneColIdx && raw ? formatFrPhoneDisplay(raw) : raw;
                              return (
                                <td
                                  key={ci}
                                  className={cn(
                                    "border-b border-slate-100 px-2 py-1.5 font-semibold",
                                    isInvalid ? "text-rose-600" : "text-slate-600"
                                  )}
                                >
                                  <span className="line-clamp-2 break-all">
                                    {display}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
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
