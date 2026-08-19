"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingLabel } from "@/components/ui/loading-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDeleteModal } from "@/components/smsclient/modals/ConfirmDeleteModal";
import { ModalPanel } from "@/components/smsclient/views/parametres/SettingCard";
import { parametresFieldLbl } from "@/components/smsclient/views/parametres/parametresSettings";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { CUSTOM_FIELD_LABEL_MAX_LENGTH } from "@/lib/forms/fieldLimits";
import {
  CUSTOM_FIELD_MAX_PER_ACCOUNT,
  type CustomFieldDef,
  type CustomFieldType,
} from "@/lib/types/customFields";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";

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
  onRemove: (fieldId: string) => Promise<{ error: Error | null }>;
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
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldType>("text");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [labelError, setLabelError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    label: string;
  } | null>(null);

  const atCap = defs.length >= CUSTOM_FIELD_MAX_PER_ACCOUNT;

  const run = async (fn: () => Promise<{ error: Error | null }>) => {
    setBusy(true);
    setLocalError(null);
    try {
      const { error: err } = await fn();
      if (err) setLocalError(err.message);
      return { error: err };
    } finally {
      setBusy(false);
    }
  };

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
        if (err.message.includes("existe déjà") || err.message.includes("already")) {
          setLabelError(err.message);
        } else {
          setLocalError(err.message);
        }
        return;
      }
      setLabel("");
      setFieldType("text");
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async (fieldId: string) => {
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
  };

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const { error: err } = await run(() => onRemove(pendingDelete.id));
    if (!err) setPendingDelete(null);
    else throw err;
  }, [pendingDelete, onRemove]);

  return (
    <>
      <ModalPanel>
        <p className="m-0 mb-3 text-sm font-semibold text-muted-foreground">
          {t("customFields.intro", { n: CUSTOM_FIELD_MAX_PER_ACCOUNT })}
        </p>

        {(error || localError) && (
          <Alert variant="destructive" className="mb-3">
            <AlertDescription className="font-bold">
              {localError ?? error}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <p className="m-0 mb-3 text-sm font-semibold text-muted-foreground">
            <LoadingLabel>{t("common.loading")}</LoadingLabel>
          </p>
        ) : (
          <ul className="m-0 mb-4 list-none space-y-2 p-0">
            {defs.length === 0 && (
              <li className="text-sm font-semibold text-muted-foreground">
                {t("customFields.empty")}
              </li>
            )}
            {defs.map((def) => (
              <li key={def.id}>
                <Card
                  size="sm"
                  className="flex flex-wrap items-center gap-2 px-3 py-2"
                >
                {editingId === def.id ? (
                  <>
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
                      onClick={() => void handleRename(def.id)}
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
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-foreground">
                        {def.label}
                      </div>
                      <div className="text-xs font-semibold text-muted-foreground">
                        {t(TYPE_KEYS[def.fieldType])}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={busy}
                      aria-label={t("customFields.renameAria")}
                      onClick={() => {
                        setEditingId(def.id);
                        setEditLabel(def.label);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={busy}
                      aria-label={t("customFields.deleteAria")}
                      onClick={() =>
                        setPendingDelete({ id: def.id, label: def.label })
                      }
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </>
                )}
                </Card>
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-3 border-t border-border pt-3">
          <div className="grid gap-1.5">
            <Label className={parametresFieldLbl} htmlFor="custom-field-new-label">
              {t("customFields.newField")}
            </Label>
            <Input
              id="custom-field-new-label"
              maxLength={CUSTOM_FIELD_LABEL_MAX_LENGTH}
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (labelError) setLabelError(null);
                if (localError) setLocalError(null);
              }}
              placeholder={t("customFields.placeholder")}
              disabled={busy || atCap}
              aria-invalid={Boolean(labelError)}
            />
            {labelError ? (
              <p className="m-0 text-xs font-medium text-destructive">
                {labelError}
              </p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <Label className={parametresFieldLbl}>{t("customFields.type")}</Label>
            <Select
              value={fieldType}
              onValueChange={(v) => setFieldType(v as CustomFieldType)}
              disabled={busy || atCap}
            >
              <SelectTrigger className="w-full">
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
          <Button
            type="button"
            disabled={busy || atCap}
            onClick={() => void handleCreate()}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {t("customFields.add")}
          </Button>
          {atCap && (
            <p className="m-0 text-xs font-bold text-muted-foreground">
              {t("customFields.atCap", { n: CUSTOM_FIELD_MAX_PER_ACCOUNT })}
            </p>
          )}
        </div>
      </ModalPanel>

      <ConfirmDeleteModal
        open={pendingDelete !== null}
        stacked
        title={
          pendingDelete
            ? t("customFields.deleteTitle", { label: pendingDelete.label })
            : t("customFields.deleteTitleFallback")
        }
        description={t("customFields.deleteDesc")}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
