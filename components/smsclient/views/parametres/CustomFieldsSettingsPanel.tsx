"use client";

import { DataTable } from "@/components/smsclient/DataTable";
import { CONTACT_COL } from "@/components/smsclient/listColumnSizes";
import { ConfirmCustomFieldDeleteModal } from "@/components/smsclient/modals/ConfirmCustomFieldDeleteModal";
import {
  dialogContentStackedZCls,
  dialogOverlayStackedCls,
  formDialogContentCls,
  modalIconCls,
  preventDialogOpenAutoFocus,
} from "@/components/smsclient/modals/modalChrome";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { CUSTOM_FIELD_LABEL_MAX_LENGTH } from "@/lib/forms/fieldLimits";
import { useI18n, type MessageKey } from "@/lib/i18n";
import {
  CUSTOM_FIELD_MAX_PER_ACCOUNT,
  type CustomFieldDef,
  type CustomFieldType,
} from "@/lib/types/customFields";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

const TABLE_CLS = "min-h-0 flex-1";
const fieldLabelCls = "text-xs font-semibold text-foreground";
const fieldMetaCls = "text-xs font-normal text-muted-foreground";
const hintTextCls = "text-xs font-normal leading-snug text-muted-foreground";
const modalFieldCls =
  "focus-visible:outline-none focus-visible:ring-0 aria-invalid:ring-0";

const TYPE_KEYS: Record<CustomFieldType, MessageKey> = {
  text: "customFields.type.text",
  number: "customFields.type.number",
  date: "customFields.type.date",
};

export type CustomFieldsSettingsPanelProps = {
  defs: CustomFieldDef[];
  loading?: boolean;
  error?: string | null;
  onCreate: (input: {
    label: string;
    fieldType: CustomFieldType;
  }) => Promise<{ error: Error | null }>;
  onRename: (
    fieldId: string,
    label: string,
  ) => Promise<{ error: Error | null }>;
  onRemove: (fieldIds: string[]) => Promise<{ error: Error | null }>;
};

export function CustomFieldsSettingsPanel({
  defs,
  loading = false,
  error = null,
  onCreate,
  onRename,
  onRemove,
}: CustomFieldsSettingsPanelProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldType>("text");
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [labelError, setLabelError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);

  const atCap = defs.length >= CUSTOM_FIELD_MAX_PER_ACCOUNT;
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return defs;
    return defs.filter((def) => {
      const typeLabel = t(TYPE_KEYS[def.fieldType]).toLowerCase();
      return def.label.toLowerCase().includes(q) || typeLabel.includes(q);
    });
  }, [defs, q, t]);

  const selectedCount = useMemo(
    () => filtered.filter((def) => selectedIds.has(def.id)).length,
    [filtered, selectedIds],
  );

  const allSelected =
    filtered.length > 0 && filtered.every((def) => selectedIds.has(def.id));

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const every =
        filtered.length > 0 && filtered.every((def) => prev.has(def.id));
      if (every) return new Set();
      return new Set(filtered.map((def) => def.id));
    });
  }, [filtered]);

  const handleCreate = async () => {
    const next = label.trim();
    if (!next) {
      setLabelError(t("customFields.labelRequired"));
      return;
    }
    setLabelError(null);
    setBusy(true);
    setLocalError(null);
    try {
      const { error: err } = await onCreate({ label: next, fieldType });
      if (err) {
        if (
          err.message.includes("existe déjà") ||
          err.message.includes("already")
        ) {
          setLabelError(err.message);
        } else {
          setLocalError(err.message);
        }
        return;
      }
      setLabel("");
      setFieldType("text");
      setCreateOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const handleRename = useCallback(
    async (fieldId: string) => {
      const next = editLabel.trim();
      if (!next) {
        setLocalError(t("customFields.labelRequired"));
        return;
      }
      setBusy(true);
      setLocalError(null);
      try {
        const { error: err } = await onRename(fieldId, next);
        if (err) {
          setLocalError(err.message);
          return;
        }
        setEditingId(null);
      } finally {
        setBusy(false);
      }
    },
    [editLabel, onRename, t],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteIds?.length) return;
    setBusy(true);
    setLocalError(null);
    try {
      const { error: err } = await onRemove(deleteIds);
      if (err) throw err;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of deleteIds) next.delete(id);
        return next;
      });
      setDeleteIds(null);
    } finally {
      setBusy(false);
    }
  }, [deleteIds, onRemove]);

  const closeCreate = () => {
    if (busy) return;
    setCreateOpen(false);
    setLabel("");
    setFieldType("text");
    setLabelError(null);
  };

  const deleteLabels = (deleteIds ?? [])
    .map((id) => defs.find((def) => def.id === id)?.label)
    .filter((label): label is string => Boolean(label));

  const columns = useMemo(
    (): ColumnDef<CustomFieldDef, unknown>[] => [
      {
        id: "select",
        size: CONTACT_COL.select,
        minSize: CONTACT_COL.select,
        maxSize: CONTACT_COL.select,
        enableResizing: false,
        header: () => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                allSelected
                  ? true
                  : selectedCount > 0
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={() => toggleAll()}
              aria-label={t("customFields.selectAllAria")}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={selectedIds.has(row.original.id)}
              onCheckedChange={() => toggle(row.original.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={t("common.select")}
            />
          </div>
        ),
      },
      {
        accessorKey: "label",
        header: t("customFields.col.label"),
        cell: ({ row }) =>
          editingId === row.original.id ? (
            <div
              className="flex min-w-0 items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Input
                className="min-w-0 flex-1"
                maxLength={CUSTOM_FIELD_LABEL_MAX_LENGTH}
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                disabled={busy}
                aria-label={t("customFields.newLabelAria")}
              />
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={() => void handleRename(row.original.id)}
              >
                {t("common.ok")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => setEditingId(null)}
              >
                {t("common.cancel")}
              </Button>
            </div>
          ) : (
            <span className="truncate">{row.original.label}</span>
          ),
      },
      {
        accessorKey: "fieldType",
        header: t("customFields.col.type"),
        cell: ({ row }) => t(TYPE_KEYS[row.original.fieldType]),
      },
      {
        id: "actions",
        size: CONTACT_COL.actions,
        minSize: CONTACT_COL.actions,
        maxSize: CONTACT_COL.actions,
        enableResizing: false,
        header: () => null,
        cell: ({ row }) => (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={busy}
            aria-label={t("customFields.renameAria")}
            onClick={(e) => {
              e.stopPropagation();
              setEditingId(row.original.id);
              setEditLabel(row.original.label);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [
      allSelected,
      selectedCount,
      selectedIds,
      toggleAll,
      toggle,
      t,
      editingId,
      editLabel,
      busy,
      handleRename,
    ],
  );

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <InputGroup
            className="max-w-sm shrink-0 bg-transparent dark:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0"
            role="search"
          >
            <InputGroupAddon align="inline-start">
              <Search aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              placeholder={t("customFields.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t("customFields.searchAria")}
            />
          </InputGroup>
          <div className="min-w-0 flex-1" aria-hidden />
          <Button
            variant="destructive"
            size="lg"
            className="rounded-full"
            disabled={selectedCount === 0 || busy}
            onClick={() =>
              setDeleteIds(
                filtered.filter((def) => selectedIds.has(def.id)).map((d) => d.id),
              )
            }
          >
            <Trash2 aria-hidden />
            {selectedCount === 0
              ? t("common.delete")
              : t("customFields.deleteSelected", { n: selectedCount })}
          </Button>
          <Button
            variant="default"
            size="lg"
            className="rounded-full"
            disabled={busy || atCap}
            onClick={() => setCreateOpen(true)}
          >
            <Plus aria-hidden />
            {t("customFields.create")}
          </Button>
        </div>

        {(error || localError) && (
          <Alert variant="destructive" className="shrink-0">
            <AlertDescription className="font-bold">
              {localError ?? error}
            </AlertDescription>
          </Alert>
        )}

        {atCap && (
          <p className="m-0 shrink-0 text-xs font-bold text-muted-foreground">
            {t("customFields.atCap", { n: CUSTOM_FIELD_MAX_PER_ACCOUNT })}
          </p>
        )}

        {loading ? (
          <Card size="sm" className="shrink-0">
            <CardContent className="grid min-h-[160px] place-items-center">
              <Spinner className="size-6 text-primary" />
            </CardContent>
          </Card>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            emptyMessage={t("customFields.empty")}
            searchNoResultsMessage={t("customFields.noSearchResults")}
            globalFilter={query}
            minContentWidth={480}
            onRowClick={(row) => {
              if (editingId === row.id) return;
              toggle(row.id);
            }}
            className={TABLE_CLS}
            footer={t(
              filtered.length === 1
                ? "customFields.footerOne"
                : "customFields.footerMany",
              { n: filtered.length },
            )}
          />
        )}
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(next) => {
          if (!next) closeCreate();
        }}
      >
        <DialogContent
          showCloseButton={!busy}
          overlayClassName={dialogOverlayStackedCls}
          className={cn(
            formDialogContentCls,
            "rounded-xl shadow-lg sm:max-w-[640px]",
            dialogContentStackedZCls,
          )}
          onOpenAutoFocus={preventDialogOpenAutoFocus}
          onPointerDownOutside={(e) => {
            if (busy) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (busy) e.preventDefault();
          }}
        >
          <DialogHeader className="shrink-0 flex-row items-center gap-2.5 space-y-0 border-b border-border px-4 py-2.5 text-left">
            <div className={modalIconCls("sm")} aria-hidden>
              <Plus />
            </div>
            <DialogTitle className="min-w-0 flex-1 pr-8 text-base font-semibold leading-none tracking-tight">
              {t("customFields.createTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4">
            <div className="space-y-1.5">
              <Label
                className="flex justify-between gap-2"
                htmlFor="custom-field-new-label"
              >
                <span className={fieldLabelCls}>
                  {t("customFields.newField")}{" "}
                  <span className="text-destructive">*</span>
                </span>
                <span className={fieldMetaCls}>
                  {label.length}/{CUSTOM_FIELD_LABEL_MAX_LENGTH}
                </span>
              </Label>
              <Input
                id="custom-field-new-label"
                className={modalFieldCls}
                maxLength={CUSTOM_FIELD_LABEL_MAX_LENGTH}
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                  if (labelError) setLabelError(null);
                  if (localError) setLocalError(null);
                }}
                placeholder={t("customFields.placeholder")}
                disabled={busy}
                aria-invalid={Boolean(labelError)}
                aria-describedby={
                  labelError ? "custom-field-new-label-err" : undefined
                }
              />
              {labelError ? (
                <p
                  id="custom-field-new-label-err"
                  className={cn(hintTextCls, "text-destructive")}
                >
                  {labelError}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label className={fieldLabelCls}>{t("customFields.type")}</Label>
              <Select
                value={fieldType}
                onValueChange={(v) => setFieldType(v as CustomFieldType)}
                disabled={busy}
              >
                <SelectTrigger className={cn("w-full", modalFieldCls)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {(Object.keys(TYPE_KEYS) as CustomFieldType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(TYPE_KEYS[type])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 shrink-0 flex-row flex-wrap items-center justify-end gap-2 rounded-b-xl p-2.5 px-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={closeCreate}
              className="cursor-pointer"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="default"
              disabled={busy}
              onClick={() => void handleCreate()}
              className="cursor-pointer"
            >
              {t("customFields.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmCustomFieldDeleteModal
        open={deleteIds !== null}
        labels={deleteLabels}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteIds(null)}
      />
    </>
  );
}
