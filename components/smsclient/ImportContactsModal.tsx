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
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  buildImportRoleLabels,
  buildPayloadFromMappedRow,
  customImportRole,
  formatFrPhoneDisplay,
  type FixedImportColumnRole,
  type ImportColumnRole,
  looksLikeFrPhone,
  suggestColumnRoles,
} from "@/lib/import/contactImportMap";
import { parseCsvText, type ParsedCsv } from "@/lib/import/parseCsv";
import { frDisplayToE164 } from "@/lib/proto/smsUtils";
import {
  pauseContactsRealtimeRefresh,
  resumeContactsRealtimeRefresh,
} from "@/lib/proto/contactsRefreshGate";
import {
  fetchExistingClientPhoneE164s,
  insertClientsFromImport,
} from "@/lib/supabase/clients";
import type { CustomFieldDef } from "@/lib/types/customFields";
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
import { toast } from "@/components/ui/sonner";
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
  preventDialogOpenAutoFocus,
} from "./modals/modalChrome";

const FIXED_ROLE_OPTIONS: FixedImportColumnRole[] = [
  "skip",
  "phone",
  "first_name",
  "last_name",
  "birthday",
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
): MessageKey | null {
  if (invalid) return "import.issue.invalid";
  if (existing) return "import.issue.existing";
  if (fileDupe) return "import.issue.fileDupe";
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
        className="inline-flex shrink-0 rounded-sm outline-none focus-visible:outline-none focus-visible:ring-0"
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
  /** Noms de groupes existants (segments) pour l’option « Ajouter au groupe ». */
  groupOptions?: string[];
  /** Pré-sélection d’un groupe (ex. import depuis une fiche groupe). */
  defaultGroupLabel?: string | null;
  /** Définitions champs perso pour mapping CSV. */
  customFieldDefs?: CustomFieldDef[];
};

export function ImportContactsModal({
  open,
  onClose,
  supabase,
  userId,
  onImported,
  groupOptions = [],
  defaultGroupLabel = null,
  customFieldDefs = [],
}: ImportContactsModalProps) {
  const { t } = useI18n();
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [roles, setRoles] = useState<ImportColumnRole[]>([]);
  const [targetGroupName, setTargetGroupName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
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
    setImporting(false);
    setImportProgress(null);
    setDragActive(false);
  }, []);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) {
      reset();
      setExistingDbPhones(new Set());
    } else {
      setTargetGroupName(defaultGroupLabel?.trim() ?? "");
    }
  }

  useEffect(() => {
    if (!open) return;
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

  const [parsedForRaw, setParsedForRaw] = useState<string | null>(null);
  if (rawText !== parsedForRaw) {
    setParsedForRaw(rawText);
    if (!rawText) {
      setParsed(null);
      setRoles([]);
      setParseError(null);
    } else {
      try {
        const p = parseCsvText(rawText);
        if (p.headers.length === 0) {
          setParseError(t("import.err.noHeaders"));
          setParsed(null);
          setRoles([]);
        } else {
          setParseError(null);
          setParsed(p);
          setRoles(suggestColumnRoles(p.headers, p.rows, customFieldDefs));
        }
      } catch {
        setParseError(t("import.err.parse"));
        setParsed(null);
        setRoles([]);
      }
    }
  }
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
      setParseError(t("import.err.csvOnly"));
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
      setParseError(t("import.err.read"));
      setFileName(null);
      setRawText(null);
      setFileLoading(false);
    };
    reader.readAsText(file, "UTF-8");
  }, [t]);

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
        setParseError(t("import.err.noFile"));
        return;
      }
      suppressPickerClickRef.current = true;
      window.setTimeout(() => {
        suppressPickerClickRef.current = false;
      }, 500);
      onPickFile(f);
    },
    [onPickFile, t]
  );

  const setRole = useCallback((index: number, role: ImportColumnRole) => {
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

  const roleOptions = useMemo((): ImportColumnRole[] => {
    return [
      ...FIXED_ROLE_OPTIONS,
      ...customFieldDefs.map((d) => customImportRole(d.id)),
    ];
  }, [customFieldDefs]);

  const roleLabels = useMemo(
    () =>
      buildImportRoleLabels(customFieldDefs, {
        skip: t("import.role.skip"),
        phone: t("import.role.phone"),
        first_name: t("import.role.first"),
        last_name: t("import.role.last"),
        birthday: t("import.role.birthday"),
      }),
    [customFieldDefs, t],
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
      const p = buildPayloadFromMappedRow(cells, roles, customFieldDefs);
      if (!p) {
        return { e164: null, invalid: true };
      }
      const e164 = frDisplayToE164(p.phoneDisplay);
      if (!e164) {
        return { e164: null, invalid: true };
      }
      return { e164, invalid: false };
    },
    [phoneColIdx, roles, customFieldDefs]
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
      return { invalid: 0, existing: 0, fileDupes: 0, ok: 0 };
    }
    let invalid = 0;
    let existing = 0;
    let fileDupes = 0;
    let ok = 0;
    parsed.rows.forEach((row, idx) => {
      const { e164, invalid: bad } = rowPhoneMeta(row);
      if (bad) {
        invalid++;
        return;
      }
      if (fileDuplicateRowIndexes.has(idx)) {
        fileDupes++;
        return;
      }
      if (e164 && existingDbPhones.has(e164)) {
        existing++;
        return;
      }
      ok++;
    });
    return { invalid, existing, fileDupes, ok };
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

  const previewRows = parsed?.rows ?? [];

  const handleImport = useCallback(async () => {
    if (!parsed || !hasPhoneColumn || importing) return;
    setImportError(null);
    setImporting(true);
    setImportProgress({ current: 0, total: Math.max(rowIssueStats.ok, 1) });
    pauseContactsRealtimeRefresh();
    const groupLabel = targetGroupName.trim();
    try {
      const payloads = [];
      let skippedInvalid = 0;
      for (const row of parsed.rows) {
        const p = buildPayloadFromMappedRow(row, roles, customFieldDefs);
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

      const batch = await insertClientsFromImport(supabase, userId, payloads, {
        onProgress: (p) => setImportProgress(p),
      });
      const didSomething =
        batch.inserted > 0 || batch.linkedExistingToGroup > 0;
      const dupes = batch.skippedDuplicateInFile + batch.skippedDuplicateInDb;

      if (!didSomething) {
        const invalidTotal = skippedInvalid + batch.skippedInvalidRow;
        const reasons: string[] = [];
        if (invalidTotal > 0) {
          reasons.push(t("import.err.invalidPhones"));
        }
        if (batch.otherErrors > 0) {
          reasons.push(t("import.err.server"));
        }
        if (reasons.length > 0) {
          setImportError(
            t("import.err.noneImported", { reasons: reasons.join(" · ") }),
          );
        } else if (dupes === 0) {
          setImportError(t("import.err.noneSaved"));
        }
        return;
      }

      const parts: string[] = [];
      if (batch.inserted > 0) {
        parts.push(
          batch.inserted === 1
            ? t("import.result.importedOne", { n: batch.inserted })
            : t("import.result.importedMany", { n: batch.inserted }),
        );
      }
      if (groupLabel) {
        const linked = batch.inserted + batch.linkedExistingToGroup;
        if (linked > 0) {
          parts.push(
            linked === 1
              ? t("import.result.addedGroupOne", {
                  n: linked,
                  name: groupLabel,
                })
              : t("import.result.addedGroupMany", {
                  n: linked,
                  name: groupLabel,
                }),
          );
        }
      } else if (batch.linkedExistingToGroup > 0) {
        parts.push(
          batch.linkedExistingToGroup === 1
            ? t("import.result.linkedOne", {
                n: batch.linkedExistingToGroup,
              })
            : t("import.result.linkedMany", {
                n: batch.linkedExistingToGroup,
              }),
        );
      }
      if (batch.skippedDuplicateInFile > 0) {
        parts.push(
          batch.skippedDuplicateInFile === 1
            ? t("import.result.fileDupeOne", {
                n: batch.skippedDuplicateInFile,
              })
            : t("import.result.fileDupeMany", {
                n: batch.skippedDuplicateInFile,
              }),
        );
      }
      if (
        batch.skippedDuplicateInDb > 0 &&
        batch.linkedExistingToGroup < batch.skippedDuplicateInDb
      ) {
        const leftover =
          batch.skippedDuplicateInDb - batch.linkedExistingToGroup;
        if (leftover > 0) {
          parts.push(t("import.result.alreadyDb", { n: leftover }));
        }
      }
      const invalidTotal = skippedInvalid + batch.skippedInvalidRow;
      if (invalidTotal > 0) {
        parts.push(
          invalidTotal === 1
            ? t("import.result.skippedOne", { n: invalidTotal })
            : t("import.result.skippedMany", { n: invalidTotal }),
        );
      }
      if (batch.otherErrors > 0) {
        parts.push(
          batch.otherErrors === 1
            ? t("import.result.errorsOne", { n: batch.otherErrors })
            : t("import.result.errorsMany", { n: batch.otherErrors }),
        );
      }

      toast(parts.join(" · "));
      await onImported();
      onClose();
    } catch (e) {
      setImportError(
        e instanceof Error ? e.message : t("import.err.generic"),
      );
    } finally {
      resumeContactsRealtimeRefresh();
      setImporting(false);
      setImportProgress(null);
    }
  }, [
    parsed,
    roles,
    customFieldDefs,
    hasPhoneColumn,
    importing,
    rowIssueStats.ok,
    targetGroupName,
    supabase,
    userId,
    onImported,
    onClose,
    t,
  ]);

  const canSubmit =
    rowIssueStats.ok > 0 ||
    (Boolean(targetGroupName.trim()) && rowIssueStats.existing > 0);
  const submitCount =
    rowIssueStats.ok > 0
      ? rowIssueStats.ok
      : targetGroupName.trim()
        ? rowIssueStats.existing
        : 0;
  const progressPct =
    importProgress && importProgress.total > 0
      ? Math.min(
          100,
          Math.round((importProgress.current / importProgress.total) * 100),
        )
      : 0;

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
        onOpenAutoFocus={preventDialogOpenAutoFocus}
        onPointerDownOutside={(e) => {
          if (importing) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (importing) e.preventDefault();
        }}
      >
        {importing && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl bg-background/85 px-8 backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
            <p className="m-0 text-sm font-medium text-foreground">
              {t("import.progress", {
                current: importProgress?.current ?? 0,
                total: importProgress?.total ?? 0,
              })}
            </p>
            <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="m-0 text-xs text-muted-foreground">{progressPct}%</p>
          </div>
        )}
        <DialogHeader className="shrink-0 flex-row items-center gap-2.5 space-y-0 border-b border-border px-4 py-2.5 text-left">
          <div className={modalIconCls("sm")} aria-hidden>
            <CloudUpload />
          </div>
          <DialogTitle className="min-w-0 flex-1 pr-8 text-base font-semibold leading-none tracking-tight">
            {t("import.title")}
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
              aria-label={t("import.dropZoneAria")}
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
                    {t("import.analyzing")}
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
                      ? t("import.dropHere")
                      : t("import.dropOr")}
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
                    {t("import.browse")}
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
                    {parsed.rows.length === 1
                      ? t("import.rowsOne", { n: parsed.rows.length })
                      : t("import.rowsMany", { n: parsed.rows.length })}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={reset}
                    disabled={importing}
                    className="ml-auto cursor-pointer"
                  >
                    {t("import.change")}
                  </Button>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="import-contacts-target-group"
                  className="text-sm font-medium text-foreground"
                >
                  {t("import.addToGroup")}
                </label>
                <select
                  id="import-contacts-target-group"
                  className="mt-1 flex h-9 w-full max-w-md cursor-pointer rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
                  value={targetGroupName}
                  disabled={importing || groupOptions.length === 0}
                  onChange={(e) => setTargetGroupName(e.target.value)}
                >
                  <option value="">
                    {groupOptions.length === 0
                      ? t("import.noGroups")
                      : t("import.noGroupImportOnly")}
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
                  {t("import.preview")}
                </div>
                {!hasPhoneColumn && (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                    {t("import.needPhone")}
                  </p>
                )}
                <div className="max-h-[min(50vh,420px)] overflow-auto rounded-lg border border-border">
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
                                  {h || t("import.columnN", { n: i + 1 })}
                                </div>
                                <select
                                  className={cn(
                                    "flex h-8 w-full cursor-pointer rounded-md border border-input bg-transparent px-2 text-xs outline-none focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
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
                                  {roleOptions.map((r) => (
                                    <option key={r} value={r}>
                                      {roleLabels[r] ?? r}
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
                                      <RowIssueTip label={t(issueReason!)}>
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
            {(hasRowIssues || rowIssueStats.ok > 0) && parsed && (
              <div
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  hasRowIssues ? "text-destructive" : "text-muted-foreground",
                )}
              >
                <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>
                  {[
                    rowIssueStats.ok > 0 &&
                      (rowIssueStats.ok === 1
                        ? t("import.stats.okOne", { n: rowIssueStats.ok })
                        : t("import.stats.okMany", { n: rowIssueStats.ok })),
                    rowIssueStats.invalid > 0 &&
                      (rowIssueStats.invalid === 1
                        ? t("import.stats.invalidOne", {
                            n: rowIssueStats.invalid,
                          })
                        : t("import.stats.invalidMany", {
                            n: rowIssueStats.invalid,
                          })),
                    rowIssueStats.existing > 0 &&
                      (rowIssueStats.existing === 1
                        ? t("import.stats.existingOne", {
                            n: rowIssueStats.existing,
                          })
                        : t("import.stats.existingMany", {
                            n: rowIssueStats.existing,
                          })),
                    rowIssueStats.fileDupes > 0 &&
                      (rowIssueStats.fileDupes === 1
                        ? t("import.stats.fileDupeOne", {
                            n: rowIssueStats.fileDupes,
                          })
                        : t("import.stats.fileDupeMany", {
                            n: rowIssueStats.fileDupes,
                          })),
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
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="default"
              disabled={
                importing || !parsed || !hasPhoneColumn || !canSubmit
              }
              onClick={() => void handleImport()}
              className="min-w-[11.5rem] cursor-pointer"
            >
              {importing ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t("import.busy")}
                </span>
              ) : submitCount === 1 ? (
                t("import.submitOne", { n: submitCount })
              ) : (
                t("import.submitMany", { n: submitCount })
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
