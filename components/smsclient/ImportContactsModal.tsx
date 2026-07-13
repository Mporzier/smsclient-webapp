"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { frDisplayToE164 } from "@/lib/proto/smsUtils";
import { insertClientsFromImport } from "@/lib/supabase/clients";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CloudUpload,
  FileSpreadsheet,
  Info,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import {
  brandBtnCls,
  brandBtnPrimaryCls,
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  modalCloseBtnCompact,
} from "./modals/modalChrome";

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
  /** Noms de groupes existants (segments) pour l’option « Ajouter au groupe ». */
  groupOptions?: string[];
  /** Pré-sélection d’un groupe (ex. import depuis une fiche groupe). */
  defaultGroupLabel?: string | null;
};

export function ImportContactsModal({
  open,
  onClose,
  supabase,
  userId,
  onImported,
  onNotify,
  groupOptions = [],
  defaultGroupLabel = null,
}: ImportContactsModalProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [roles, setRoles] = useState<ImportColumnRole[]>([]);
  const [targetGroupName, setTargetGroupName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [duplicatePhoneE164s, setDuplicatePhoneE164s] = useState<string[]>([]);
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
    setTargetGroupName("");
    setImportError(null);
    setDuplicatePhoneE164s([]);
    setImporting(false);
    setDragActive(false);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    setTargetGroupName(defaultGroupLabel?.trim() ?? "");
  }, [open, reset, defaultGroupLabel]);

  const onPickFile = useCallback((file: File | null) => {
    setParseError(null);
    setParsed(null);
    setRoles([]);
    setRawText(null);
    setImportError(null);
    setDuplicatePhoneE164s([]);
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
        "Choisissez un fichier .csv (export Excel « CSV séparé par des virgules » ou point-virgule)."
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
          "Aucun fichier détecté. Essayez de déposer le fichier depuis l’explorateur, ou utilisez « parcourir »."
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
        "Impossible d’analyser ce fichier. Vérifiez l’encodage (UTF-8 recommandé)."
      );
      setParsed(null);
      setRoles([]);
    }
  }, [rawText]);

  const setRole = useCallback((index: number, role: ImportColumnRole) => {
    setDuplicatePhoneE164s([]);
    setImportError(null);
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

  const duplicatePhoneSet = useMemo(
    () => new Set(duplicatePhoneE164s),
    [duplicatePhoneE164s]
  );

  const duplicateCount = duplicatePhoneE164s.length;

  const previewRows = useMemo(() => {
    if (!parsed) return [];
    if (duplicateCount > 0) return parsed.rows;
    return parsed.rows.slice(0, 5);
  }, [parsed, duplicateCount]);

  const rowCount = parsed?.rows.length ?? 0;

  const rowPhoneE164 = useCallback(
    (cells: string[]) => {
      const p = buildPayloadFromMappedRow(cells, roles);
      if (!p) return null;
      return frDisplayToE164(p.phoneDisplay);
    },
    [roles]
  );

  const handleImport = useCallback(async () => {
    if (!parsed || !hasPhoneColumn || importing) return;
    setImportError(null);
    setDuplicatePhoneE164s([]);
    setImporting(true);
    const groupLabel = targetGroupName.trim();
    try {
      const payloads = [];
      let skippedInvalid = 0;
      for (const row of parsed.rows) {
        const p = buildPayloadFromMappedRow(row, roles);
        if (!p) {
          skippedInvalid++;
          continue;
        }
        if (groupLabel) {
          const merged = new Set([...p.groupLabels, groupLabel]);
          p.groupLabels = Array.from(merged);
        }
        payloads.push(p);
      }

      const batch = await insertClientsFromImport(supabase, userId, payloads);
      const didSomething =
        batch.inserted > 0 || batch.linkedExistingToGroup > 0;
      const dupes = batch.skippedDuplicateInFile + batch.skippedDuplicateInDb;

      if (!didSomething) {
        if (dupes > 0) {
          setDuplicatePhoneE164s(batch.duplicatePhoneE164s);
        }
        const invalidTotal = skippedInvalid + batch.skippedInvalidRow;
        const reasons: string[] = [];
        if (invalidTotal > 0) {
          reasons.push(
            "numéros non reconnus — utilisez 10 chiffres 06/07 (ex. 06 12 34 56 78) ou +33 6 12 34 56 78"
          );
        }
        if (batch.otherErrors > 0) {
          reasons.push("erreur d’enregistrement côté serveur");
        }
        if (reasons.length > 0) {
          setImportError(
            `Aucun contact n’a été importé. ${reasons.join(
              " · "
            )}. Corrigez le CSV puis réessayez — la modale reste ouverte.`
          );
        } else if (dupes === 0) {
          setImportError(
            "Aucun contact n’a été enregistré. Réessayez (la modale reste ouverte)."
          );
        }
        return;
      }

      const parts: string[] = [];
      if (batch.inserted > 0) {
        parts.push(
          `${batch.inserted} contact${batch.inserted > 1 ? "s" : ""} importé${
            batch.inserted > 1 ? "s" : ""
          }`
        );
      }
      if (groupLabel) {
        const linked =
          batch.inserted + batch.linkedExistingToGroup;
        if (linked > 0) {
          parts.push(
            `${linked} ajouté${linked > 1 ? "s" : ""} au groupe « ${groupLabel} »`
          );
        }
      } else if (batch.linkedExistingToGroup > 0) {
        parts.push(
          `${batch.linkedExistingToGroup} déjà en base rattaché${
            batch.linkedExistingToGroup > 1 ? "s" : ""
          } au groupe`
        );
      }
      if (batch.skippedDuplicateInFile > 0) {
        parts.push(
          `${batch.skippedDuplicateInFile} doublon${
            batch.skippedDuplicateInFile > 1 ? "s" : ""
          } dans le fichier`
        );
      }
      if (
        batch.skippedDuplicateInDb > 0 &&
        batch.linkedExistingToGroup < batch.skippedDuplicateInDb
      ) {
        const leftover =
          batch.skippedDuplicateInDb - batch.linkedExistingToGroup;
        if (leftover > 0) {
          parts.push(`${leftover} déjà en base`);
        }
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
    targetGroupName,
    supabase,
    userId,
    onImported,
    onNotify,
    onClose,
  ]);

  const isDirty = fileName !== null || parsed !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !importing) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName={dialogOverlayCls}
        className={cn(
          formDialogContentCls,
          "max-h-[min(90vh,820px)] sm:max-w-[960px]",
          dialogContentZCls
        )}
        onPointerDownOutside={(e) => {
          if (importing || isDirty) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (importing || isDirty) e.preventDefault();
        }}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-[18px] py-4">
          <div>
            <div className="flex items-center gap-2.5 text-xl font-black text-foreground">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-border bg-accent">
                <CloudUpload className="h-6 w-6 text-ring" aria-hidden />
              </div>
              <DialogTitle className="m-0 text-xl font-black text-foreground">
                Importer des contacts
              </DialogTitle>
            </div>
          </div>
          <button
            type="button"
            disabled={importing}
            className={modalCloseBtnCompact}
            aria-label="Fermer"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/50 p-[18px]">
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
            <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
              <div
                aria-label="Zone de dépôt pour fichier CSV"
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDragOver={onDragOver}
                onDrop={onDrop}
                className={cn(
                  "rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
                  dragActive
                    ? "border-ring bg-accent"
                    : "border-border bg-muted/50",
                  importing &&
                    "pointer-events-none cursor-not-allowed opacity-60"
                )}
              >
                {fileLoading ? (
                  <>
                    <Loader2
                      className="mx-auto h-8 w-8 animate-spin text-ring"
                      aria-hidden
                    />
                    <p className="mt-3 text-sm font-extrabold text-foreground">
                      Analyse du fichier en cours…
                    </p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
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
                    <p className="mt-2 text-sm font-extrabold text-foreground">
                      {dragActive
                        ? "Dépose le fichier ici…"
                        : "Glissez-déposez un fichier CSV ici"}
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-muted-foreground">
                      ou
                    </p>
                    <Button
                      type="button"
                      variant="default"
                      disabled={importing}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (importing || suppressPickerClickRef.current) return;
                        fileInputRef.current?.click();
                      }}
                      className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold shadow-md"
                    >
                      <Upload className="h-4 w-4" aria-hidden />
                      Choisir un fichier CSV
                    </Button>
                  </>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-accent/60 px-3 py-2.5">
                <Info className="h-4 w-4 shrink-0 text-ring" aria-hidden />
                <p className="m-0 text-center text-xs font-semibold leading-relaxed text-muted-foreground">
                  Depuis Excel : Fichier → Enregistrer sous → Format CSV
                </p>
              </div>
            </div>
          )}

          {parseError && (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-bold text-destructive">
              {parseError}
            </div>
          )}

          {parsed && parsed.headers.length > 0 && (
            <>
              {fileName && (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                  <FileSpreadsheet
                    className="h-4 w-4 shrink-0 text-emerald-500"
                    aria-hidden
                  />
                  <span className="text-sm font-bold text-foreground">
                    {fileName}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    — {parsed.rows.length} ligne
                    {parsed.rows.length > 1 ? "s" : ""} détectée
                    {parsed.rows.length > 1 ? "s" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={reset}
                    disabled={importing}
                    className="ml-auto cursor-pointer text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    Changer de fichier
                  </button>
                </div>
              )}
              <div className="mb-3 rounded-2xl border border-border bg-card p-4 shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
                <label
                  htmlFor="import-contacts-target-group"
                  className="block text-[13px] font-black text-foreground"
                >
                  Ajouter au groupe
                </label>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                  Optionnel — les contacts importés (et ceux déjà en base) sont
                  rattachés à ce groupe existant.
                </p>
                <select
                  id="import-contacts-target-group"
                  className="mt-2 w-full max-w-md rounded-xl border border-border bg-card px-3 py-2 text-sm font-extrabold text-foreground"
                  value={targetGroupName}
                  disabled={importing || groupOptions.length === 0}
                  onChange={(e) => setTargetGroupName(e.target.value)}
                >
                  <option value="">
                    {groupOptions.length === 0
                      ? "Aucun groupe disponible"
                      : "Aucun (import seul)"}
                  </option>
                  {groupOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
                <div className="text-[13px] font-black text-foreground">
                  Aperçu des lignes ({rowCount} ligne
                  {rowCount > 1 ? "s" : ""})
                </div>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                  Associe chaque colonne directement dans son en-tête. Le champ{" "}
                  <strong className="text-foreground">Téléphone</strong> est
                  obligatoire.
                </p>
                {!hasPhoneColumn && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950">
                    Choisissez la colonne qui contient le numéro de téléphone.
                  </p>
                )}
                <div className="mt-2 overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-[760px] text-[12px]">
                    <thead>
                      <tr className="bg-muted/50">
                        {parsed.headers.map((h, i) => {
                          const role = roles[i];
                          return (
                            <th
                              key={`ph-${i}`}
                              className={cn(
                                "border-b border-border px-2 py-2 text-left align-top",
                                role && role !== "skip"
                                  ? "text-ring"
                                  : "text-muted-foreground"
                              )}
                            >
                              <div className="min-w-[170px] space-y-1.5">
                                <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                                  {h || `Colonne ${i + 1}`}
                                </div>
                                <select
                                  className={cn(
                                    "w-full rounded-xl border border-border bg-card px-2 py-1.5 text-[12px] font-extrabold text-foreground",
                                    role === "phone" &&
                                      "border-ring ring-2 ring-ring/20"
                                  )}
                                  value={role ?? "skip"}
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
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((cells, ri) => {
                        const phoneColIdx = roles.indexOf("phone");
                        const phoneVal =
                          phoneColIdx >= 0 ? cells[phoneColIdx] ?? "" : "";
                        const isInvalid =
                          phoneColIdx >= 0 && !looksLikeFrPhone(phoneVal);
                        const e164 = rowPhoneE164(cells);
                        const isDuplicate =
                          !!e164 && duplicatePhoneSet.has(e164);
                        return (
                          <tr
                            key={ri}
                            className={cn(
                              isInvalid && "bg-rose-50/60",
                              isDuplicate &&
                                !isInvalid &&
                                "bg-muted/50 opacity-55"
                            )}
                          >
                            {parsed.headers.map((_, ci) => {
                              const raw = cells[ci] ?? "";
                              const display =
                                ci === phoneColIdx && raw
                                  ? formatFrPhoneDisplay(raw)
                                  : raw;
                              return (
                                <td
                                  key={ci}
                                  className={cn(
                                    "border-b border-border/50 px-2 py-1.5 font-semibold",
                                    isInvalid
                                      ? "text-destructive"
                                      : isDuplicate
                                        ? "text-muted-foreground"
                                        : "text-muted-foreground"
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
          <div className="shrink-0 border-t border-destructive/30 bg-destructive/10 px-[18px] py-2 text-sm font-bold text-destructive">
            {importError}
          </div>
        )}

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-card px-[18px] py-3.5">
          <div className="min-w-0 flex-1">
            {duplicateCount > 0 && (
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                <Info
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span>
                  {duplicateCount} doublon
                  {duplicateCount > 1 ? "s" : ""} détecté
                  {duplicateCount > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className={brandBtnCls}
              disabled={importing}
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="default"
              size="lg"
              className={brandBtnPrimaryCls}
              disabled={
                importing || !parsed || !hasPhoneColumn || rowCount === 0
              }
              onClick={() => void handleImport()}
            >
              {importing
                ? "Import…"
                : `Importer ${rowCount} ligne${rowCount > 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
