"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/smsclient/modals/ConfirmDeleteModal";
import { ModalPanel } from "@/components/smsclient/views/parametres/SettingCard";
import {
  parametresFieldInp,
  parametresFieldLbl,
} from "@/components/smsclient/views/parametres/parametresSettings";
import {
  CUSTOM_FIELD_MAX_PER_ACCOUNT,
  CUSTOM_FIELD_TYPE_LABELS,
  type CustomFieldDef,
  type CustomFieldType,
} from "@/lib/types/customFields";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";

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
    const t = label.trim();
    if (!t) {
      setLabelError("Libellé requis.");
      return;
    }
    setLabelError(null);
    setBusy(true);
    setLocalError(null);
    try {
      const { error: err } = await onCreate({ label: t, fieldType });
      if (err) {
        if (err.message.includes("existe déjà")) {
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
    const t = editLabel.trim();
    if (!t) {
      setLocalError("Libellé requis.");
      return;
    }
    setBusy(true);
    setLocalError(null);
    try {
      const { error: err } = await onRename(fieldId, t);
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
        <p className="m-0 mb-3 text-sm font-semibold text-slate-500">
          Champs date, texte ou nombre visibles sur la liste et les fiches
          contacts (max {CUSTOM_FIELD_MAX_PER_ACCOUNT}).
        </p>

        {(error || localError) && (
          <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
            {localError ?? error}
          </p>
        )}

        {loading ? (
          <p className="m-0 mb-3 text-sm font-semibold text-slate-500">
            Chargement…
          </p>
        ) : (
          <ul className="m-0 mb-4 list-none space-y-2 p-0">
            {defs.length === 0 && (
              <li className="text-sm font-semibold text-slate-500">
                Aucun champ personnalisé pour l&apos;instant.
              </li>
            )}
            {defs.map((def) => (
              <li
                key={def.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"
              >
                {editingId === def.id ? (
                  <>
                    <input
                      className={parametresFieldInp}
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      disabled={busy}
                      aria-label="Nouveau libellé"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      onClick={() => void handleRename(def.id)}
                    >
                      OK
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setEditingId(null)}
                    >
                      Annuler
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-foreground">
                        {def.label}
                      </div>
                      <div className="text-xs font-semibold text-muted-foreground">
                        {CUSTOM_FIELD_TYPE_LABELS[def.fieldType]}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={busy}
                      aria-label="Renommer"
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
                      aria-label="Supprimer"
                      onClick={() =>
                        setPendingDelete({ id: def.id, label: def.label })
                      }
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-3 border-t border-border pt-3">
          <div>
            <label className={parametresFieldLbl} htmlFor="custom-field-new-label">
              Nouveau champ
            </label>
            <input
              id="custom-field-new-label"
              className={parametresFieldInp}
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (labelError) setLabelError(null);
                if (localError) setLocalError(null);
              }}
              placeholder="Ex. Date d'inscription"
              disabled={busy || atCap}
              aria-invalid={Boolean(labelError)}
            />
            {labelError ? (
              <p className="m-0 mt-1.5 text-xs font-medium text-destructive">
                {labelError}
              </p>
            ) : null}
          </div>
          <div>
            <label className={parametresFieldLbl}>Type</label>
            <select
              className={parametresFieldInp}
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value as CustomFieldType)}
              disabled={busy || atCap}
            >
              {(Object.keys(CUSTOM_FIELD_TYPE_LABELS) as CustomFieldType[]).map(
                (t) => (
                  <option key={t} value={t}>
                    {CUSTOM_FIELD_TYPE_LABELS[t]}
                  </option>
                ),
              )}
            </select>
          </div>
          <Button
            type="button"
            disabled={busy || atCap}
            onClick={() => void handleCreate()}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Ajouter
          </Button>
          {atCap && (
            <p className="m-0 text-xs font-bold text-slate-500">
              Limite de {CUSTOM_FIELD_MAX_PER_ACCOUNT} champs atteinte.
            </p>
          )}
        </div>
      </ModalPanel>

      <ConfirmDeleteModal
        open={pendingDelete !== null}
        stacked
        title={
          pendingDelete
            ? `Supprimer « ${pendingDelete.label} » ?`
            : "Supprimer ce champ ?"
        }
        description="Les valeurs de ce champ sur les contacts seront perdues."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
