"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
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
import {
  fetchExistingClientPhoneE164s,
  insertClientsFromImport,
} from "@/lib/supabase/clients";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  CircleAlert,
  CloudUpload,
  FileSpreadsheet,
  Info,
  Loader2,
  Upload,
} from "lucide-react";
import {
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  modalIconCls,
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

/** Raison prioritaire pour tip ligne (format > déjà en base > doublon fichier). */
function rowIssueReason(
  invalid: boolean,
  existing: boolean,
  fileDupe: boolean
): string | null {
  if (invalid) return "Format invalide";
  if (existing) return "Contact déjà enregistré";
  if (fileDupe) return "Doublon dans le fichier";
  return null;
}

/** Tip portail — évite clip du overflow-x du tableau (title SVG casse souvent). */
function RowIssueTip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      top: rect.top - 8,
      left: Math.min(rect.right, window.innerWidth - 12),
    });
  }, []);

  const show = useCallback(() => {
    updatePosition();
    setVisible(true);
  }, [updatePosition]);

  const hide = useCallback(() => setVisible(false), []);

  useEffect(() => {
    if (!visible) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [visible, updatePosition]);

  return (
    <>
      <span
        ref={anchorRef}
        tabIndex={0}
        aria-label={label}
        className="inline-flex shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {visible &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[10001] max-w-[220px] -translate-x-full -translate-y-full rounded-md border border-border bg-popover px-2 py-1 text-left text-[11px] font-medium leading-snug text-popover-foreground shadow-md"
            style={{ top: pos.top, left: pos.left }}
          >
            {label}
          </div>,
          document.body
        )}
    </>
  );
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
  const [existingDbPhones, setExistingDbPhones] = useState<Set<string>>(
    () => new Set()
  );
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

  useEffect(() => {
    if (!open) {
      setExistingDbPhones(new Set());
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { data, error } = await fetchExistingClientPhoneE164s(
          supabase,
          userId
        );
        if (cancelled || error) return;
        setExistingDbPhones(new Set(data));
      } catch {
        if (!cancelled) setExistingDbPhones(new Set());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, supabase, userId]);

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

  const phoneColIdx = useMemo(() => roles.indexOf("phone"), [roles]);

  const rowPhoneMeta = useCallback(
    (cells: string[]) => {
      if (phoneColIdx < 0) {
        return { e164: null as string | null, invalid: false };
      }
      const phoneVal = (cells[phoneColIdx] ?? "").trim();
      if (!phoneVal) {
        return { e164: null, invalid: true };
      }
      if (!looksLikeFrPhone(phoneVal)) {
        return { e164: null, invalid: true };
      }
      const p = buildPayloadFromMappedRow(cells, roles);
      if (!p) {
        return { e164: null, invalid: true };
      }
      const e164 = frDisplayToE164(p.phoneDisplay);
      if (!e164) {
        return { e164: null, invalid: true };
      }
      return { e164, invalid: false };
    },
    [phoneColIdx, roles]
  );

  /** Index des lignes 2e+ occurrence d’un même numéro (1re occurrence OK). */
  const fileDuplicateRowIndexes = useMemo(() => {
    if (!parsed || phoneColIdx < 0) return new Set<number>();
    const seen = new Set<string>();
    const dupes = new Set<number>();
    parsed.rows.forEach((row, idx) => {
      const { e164, invalid } = rowPhoneMeta(row);
      if (invalid || !e164) return;
      if (seen.has(e164)) {
        dupes.add(idx);
      } else {
        seen.add(e164);
      }
    });
    return dupes;
  }, [parsed, phoneColIdx, rowPhoneMeta]);

  const rowIssueStats = useMemo(() => {
    if (!parsed || phoneColIdx < 0) {
      return { invalid: 0, existing: 0, fileDupes: 0 };
    }
    let invalid = 0;
    let existing = 0;
    for (const row of parsed.rows) {
      const { e164, invalid: bad } = rowPhoneMeta(row);
      if (bad) {
        invalid++;
        continue;
      }
      if (e164 && existingDbPhones.has(e164)) existing++;
    }
    return {
      invalid,
      existing,
      fileDupes: fileDuplicateRowIndexes.size,
    };
  }, [
    parsed,
    phoneColIdx,
    rowPhoneMeta,
    existingDbPhones,
    fileDuplicateRowIndexes,
  ]);

  const hasRowIssues =
    rowIssueStats.invalid > 0 ||
    rowIssueStats.existing > 0 ||
    rowIssueStats.fileDupes > 0;

  const previewRows = useMemo(() => {
    if (!parsed) return [];
    if (hasRowIssues) return parsed.rows;
    return parsed.rows.slice(0, 5);
  }, [parsed, hasRowIssues]);

  const rowCount = parsed?.rows.length ?? 0;

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
        const linked = batch.inserted + batch.linkedExistingToGroup;
        if (linked > 0) {
          parts.push(
            `${linked} ajouté${
              linked > 1 ? "s" : ""
            } au groupe « ${groupLabel} »`
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
        showCloseButton={!importing}
        overlayClassName={dialogOverlayCls}
        className={cn(
          formDialogContentCls,
          "max-h-[min(90vh,820px)] rounded-xl shadow-lg sm:max-w-[960px]",
          dialogContentZCls
        )}
        onPointerDownOutside={(e) => {
          if (importing || isDirty) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (importing || isDirty) e.preventDefault();
        }}
      >
        <DialogHeader className="shrink-0 flex-row items-center gap-2.5 space-y-0 border-b border-border px-4 py-2.5 text-left">
          <div className={modalIconCls("sm")} aria-hidden>
            <CloudUpload />
          </div>
          <DialogTitle className="min-w-0 flex-1 pr-8 text-base font-semibold leading-none tracking-tight">
            Importer des contacts
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
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
            <div
              aria-label="Zone de dépôt pour fichier CSV"
              role="button"
              tabIndex={importing ? -1 : 0}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onClick={() => {
                if (importing || fileLoading || suppressPickerClickRef.current)
                  return;
                fileInputRef.current?.click();
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                if (importing || fileLoading || suppressPickerClickRef.current)
                  return;
                fileInputRef.current?.click();
              }}
              className={cn(
                "rounded-lg border border-dashed px-4 py-10 text-center transition-colors",
                dragActive
                  ? "border-foreground/40 bg-muted/40"
                  : "border-border",
                importing || fileLoading
                  ? "pointer-events-none cursor-not-allowed opacity-60"
                  : "cursor-pointer"
              )}
            >
              {fileLoading ? (
                <>
                  <Loader2
                    className="mx-auto h-7 w-7 animate-spin text-muted-foreground"
                    aria-hidden
                  />
                  <p className="mt-3 text-sm font-medium text-foreground">
                    Analyse du fichier en cours…
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {fileName}
                  </p>
                </>
              ) : (
                <>
                  <FileSpreadsheet
                    className="mx-auto h-7 w-7 text-green-600"
                    aria-hidden
                  />
                  <p className="mt-3 text-sm text-muted-foreground">
                    {dragActive
                      ? "Déposez le fichier ici…"
                      : "Glisser-déposer un fichier CSV, ou"}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={importing}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (importing || suppressPickerClickRef.current) return;
                      fileInputRef.current?.click();
                    }}
                    className="mt-3 cursor-pointer"
                  >
                    <Upload className="h-4 w-4" aria-hidden />
                    Parcourir…
                  </Button>
                </>
              )}
            </div>
          )}

          {parseError && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {parseError}
            </div>
          )}

          {parsed && parsed.headers.length > 0 && (
            <div className="flex flex-col gap-4">
              {fileName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileSpreadsheet
                    className="h-4 w-4 shrink-0 text-green-600"
                    aria-hidden
                  />
                  <span className="font-medium text-foreground">
                    {fileName}
                  </span>
                  <span>
                    · {parsed.rows.length} ligne
                    {parsed.rows.length > 1 ? "s" : ""}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={reset}
                    disabled={importing}
                    className="ml-auto cursor-pointer"
                  >
                    Changer
                  </Button>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="import-contacts-target-group"
                  className="text-sm font-medium text-foreground"
                >
                  Ajouter au groupe
                </label>
                <select
                  id="import-contacts-target-group"
                  className="mt-1 flex h-9 w-full max-w-md cursor-pointer rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
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

              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">
                  Aperçu
                </div>
                {!hasPhoneColumn && (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                    Choisissez la colonne téléphone.
                  </p>
                )}
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[760px] text-xs">
                    <thead>
                      <tr className="bg-muted/40">
                        {parsed.headers.map((h, i) => {
                          const role = roles[i];
                          return (
                            <th
                              key={`ph-${i}`}
                              className="border-b border-border px-2 py-2 text-left align-top font-medium"
                            >
                              <div className="min-w-[170px] space-y-1.5">
                                <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                  {h || `Colonne ${i + 1}`}
                                </div>
                                <select
                                  className={cn(
                                    "flex h-8 w-full cursor-pointer rounded-md border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                                    role === "phone" &&
                                      "border-foreground ring-[3px] ring-foreground/10"
                                  )}
                                  value={role ?? "skip"}
                                  disabled={importing}
                                  onChange={(e) =>
                                    setRole(
                                      i,
                                      e.target.value as ImportColumnRole
                                    )
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
                        const { e164, invalid: isInvalid } =
                          rowPhoneMeta(cells);
                        const isExisting = !!e164 && existingDbPhones.has(e164);
                        const isFileDupe = fileDuplicateRowIndexes.has(ri);
                        const isBad = isInvalid || isExisting || isFileDupe;
                        const issueReason = rowIssueReason(
                          isInvalid,
                          isExisting,
                          isFileDupe
                        );
                        return (
                          <tr
                            key={ri}
                            className={cn(isBad && "bg-destructive/10")}
                          >
                            {parsed.headers.map((_, ci) => {
                              const raw = cells[ci] ?? "";
                              const display =
                                ci === phoneColIdx && raw
                                  ? formatFrPhoneDisplay(raw)
                                  : raw;
                              const showIssueIcon =
                                ci === phoneColIdx && !!issueReason;
                              return (
                                <td
                                  key={ci}
                                  className={cn(
                                    "border-b border-border/60 px-2 py-1.5",
                                    isBad
                                      ? "text-destructive"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {showIssueIcon ? (
                                    <span className="flex w-full min-w-0 items-center gap-1.5">
                                      <span className="min-w-0 flex-1 line-clamp-2 break-all">
                                        {display}
                                      </span>
                                      <RowIssueTip label={issueReason!}>
                                        <CircleAlert
                                          className="h-3.5 w-3.5 text-destructive"
                                          aria-hidden
                                        />
                                      </RowIssueTip>
                                    </span>
                                  ) : (
                                    <span className="line-clamp-2 break-all">
                                      {display}
                                    </span>
                                  )}
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
            </div>
          )}
        </div>

        {importError && (
          <div className="shrink-0 border-t border-destructive/30 bg-destructive/10 px-6 py-2 text-sm text-destructive">
            {importError}
          </div>
        )}

        <DialogFooter className="mx-0 mb-0 shrink-0 flex-row flex-wrap items-center justify-between gap-2 rounded-b-xl p-2.5 px-4 sm:justify-between">
          <div className="min-w-0 flex-1">
            {hasRowIssues && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>
                  {[
                    rowIssueStats.invalid > 0 &&
                      `${rowIssueStats.invalid} contact${
                        rowIssueStats.invalid > 1 ? "s" : ""
                      } invalide${rowIssueStats.invalid > 1 ? "s" : ""}`,
                    rowIssueStats.existing > 0 &&
                      `${rowIssueStats.existing} contact${
                        rowIssueStats.existing > 1 ? "s" : ""
                      } déjà enregistré${
                        rowIssueStats.existing > 1 ? "s" : ""
                      }`,
                    rowIssueStats.fileDupes > 0 &&
                      `${rowIssueStats.fileDupes} contact${
                        rowIssueStats.fileDupes > 1 ? "s" : ""
                      } en doublon dans le fichier`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={importing}
              onClick={onClose}
              className="cursor-pointer"
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="default"
              disabled={
                importing || !parsed || !hasPhoneColumn || rowCount === 0
              }
              onClick={() => void handleImport()}
              className="cursor-pointer"
            >
              {importing
                ? "Import…"
                : `Importer ${rowCount} ligne${rowCount > 1 ? "s" : ""}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
