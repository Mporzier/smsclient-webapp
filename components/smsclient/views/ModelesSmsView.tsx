"use client";

import { SearchBar } from "@/components/smsclient/Shell";
import { ConfirmDeleteModal } from "@/components/smsclient/modals/ConfirmDeleteModal";
import { brandBtnPrimaryCls } from "@/components/smsclient/modals/modalChrome";
import { CellTruncate, PlusIcon } from "@/components/smsclient/ui";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/smsclient/DataTable";
import { MODELE_SMS_COL } from "@/components/smsclient/listColumnSizes";
import { fieldBox } from "@/components/smsclient/flowFieldStyles";
import { cn } from "@/lib/cn";
import {
  createUserSmsTemplate,
  deleteUserSmsTemplate,
} from "@/lib/supabase/smsTemplates";
import {
  isValidSmsTemplateBody,
  isValidSmsTemplateTitle,
  SMS_TEMPLATE_TITLE_MAX_LENGTH,
  SMS_TEMPLATE_TITLE_MIN_LENGTH,
  type UserSmsTemplateRow,
} from "@/lib/types/smsTemplate";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LayoutTemplate, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

type ModelesSmsViewProps = {
  rows: UserSmsTemplateRow[];
  loading: boolean;
  error: string | null;
  supabase: SupabaseClient;
  userId: string | undefined;
  onRefresh: () => Promise<void>;
  onToast?: (message: string) => void;
};

export function ModelesSmsView({
  rows,
  loading,
  error,
  supabase,
  userId,
  onRefresh,
  onToast,
}: ModelesSmsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [creating, setCreating] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserSmsTemplateRow | null>(
    null
  );

  useEffect(() => {
    document.body.style.overflow = deleteTarget ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [deleteTarget]);

  const showBigEmpty = !loading && !error && rows.length === 0;

  const footerLabel = useMemo(
    () => `${rows.length} modèle${rows.length !== 1 ? "s" : ""}`,
    [rows.length]
  );

  const handleCreate = useCallback(async () => {
    let hasFieldError = false;
    if (!isValidSmsTemplateTitle(title)) {
      setTitleError(
        `Le titre est obligatoire (${SMS_TEMPLATE_TITLE_MIN_LENGTH} caractères minimum).`
      );
      hasFieldError = true;
    } else {
      setTitleError(null);
    }
    if (!isValidSmsTemplateBody(body)) {
      setBodyError("Le message SMS ne peut pas être vide.");
      hasFieldError = true;
    } else {
      setBodyError(null);
    }
    if (hasFieldError) return;

    if (!userId) {
      setSaveError("Connectez-vous pour créer un modèle.");
      return;
    }
    setCreating(true);
    setSaveError(null);
    const { data, error: createError } = await createUserSmsTemplate(
      supabase,
      userId,
      { title, description, body }
    );
    setCreating(false);
    if (createError || !data) {
      setSaveError(createError?.message ?? "Création impossible.");
      return;
    }
    setTitle("");
    setDescription("");
    setBody("");
    setTitleError(null);
    setBodyError(null);
    await onRefresh();
    onToast?.("Modèle SMS créé");
  }, [title, description, body, userId, supabase, onRefresh, onToast]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget || !userId) return;
    const { error: delError } = await deleteUserSmsTemplate(
      supabase,
      userId,
      deleteTarget.id
    );
    if (delError) throw delError;
    setDeleteTarget(null);
    await onRefresh();
    onToast?.("Modèle supprimé");
  }, [deleteTarget, userId, supabase, onRefresh, onToast]);

  const columns: ColumnDef<UserSmsTemplateRow, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "createdLabel",
        header: "Créé le",
        size: MODELE_SMS_COL.created,
      },
      {
        accessorKey: "title",
        header: "Titre",
        size: MODELE_SMS_COL.title,
        cell: ({ getValue }) => (
          <CellTruncate as="div" className="text-foreground">
            {getValue<string>()}
          </CellTruncate>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        size: MODELE_SMS_COL.description,
        cell: ({ getValue }) => (
          <CellTruncate as="div" className="text-muted-foreground">
            {getValue<string>() || "—"}
          </CellTruncate>
        ),
      },
      {
        accessorKey: "body",
        header: "Message",
        size: MODELE_SMS_COL.body,
        cell: ({ getValue }) => (
          <CellTruncate as="div" className="text-muted-foreground">
            {getValue<string>()}
          </CellTruncate>
        ),
      },
      {
        id: "actions",
        size: MODELE_SMS_COL.actions,
        minSize: MODELE_SMS_COL.actions,
        maxSize: MODELE_SMS_COL.actions,
        enableResizing: false,
        cell: ({ row }) => (
          <button
            type="button"
            aria-label="Supprimer"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row.original);
            }}
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        ),
      },
    ],
    []
  );

  const deleteDescription = deleteTarget
    ? `Le modèle « ${deleteTarget.title} » sera supprimé définitivement.`
    : "";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className={cn(fieldBox, "shrink-0 py-4")}>
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-ring/20 bg-accent text-ring">
            <LayoutTemplate className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="m-0 text-sm font-black text-foreground">
              Créer un modèle
            </h2>
            <p className="m-0 text-xs font-semibold text-muted-foreground">
              Réutilisez-le lors de la rédaction d&apos;une campagne SMS.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <label
                htmlFor="modeles-create-title"
                className="mb-1.5 flex items-baseline justify-between gap-2 text-xs font-bold text-foreground"
              >
                <span>Titre *</span>
                <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {title.trim().length}/{SMS_TEMPLATE_TITLE_MAX_LENGTH} (min.{" "}
                  {SMS_TEMPLATE_TITLE_MIN_LENGTH})
                </span>
              </label>
              <input
                id="modeles-create-title"
                type="text"
                maxLength={SMS_TEMPLATE_TITLE_MAX_LENGTH}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none focus:border-ring/40 focus:ring-2 focus:ring-ring/15"
                placeholder="Promo été"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError(null);
                  if (saveError) setSaveError(null);
                }}
                aria-invalid={Boolean(titleError)}
              />
              {titleError ? (
                <p className="m-0 mt-1.5 text-xs font-medium text-destructive">
                  {titleError}
                </p>
              ) : null}
            </div>
            <div className="min-w-0">
              <label
                htmlFor="modeles-create-description"
                className="mb-1.5 block text-xs font-bold text-foreground"
              >
                Description
              </label>
              <input
                id="modeles-create-description"
                type="text"
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none focus:border-ring/40 focus:ring-2 focus:ring-ring/15"
                placeholder="Offre de rentrée"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (saveError) setSaveError(null);
                }}
              />
            </div>
          </div>
          <div className="min-w-0">
            <label
              htmlFor="modeles-create-body"
              className="mb-1.5 block text-xs font-bold text-foreground"
            >
              Message SMS *
            </label>
            <textarea
              id="modeles-create-body"
              rows={4}
              className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold leading-relaxed text-foreground outline-none focus:border-ring/40 focus:ring-2 focus:ring-ring/15"
              placeholder="Bonjour ⟦prénom⟧, profitez de -20 % cette semaine en boutique !"
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (bodyError) setBodyError(null);
                if (saveError) setSaveError(null);
              }}
              aria-invalid={Boolean(bodyError)}
            />
            {bodyError ? (
              <p className="m-0 mt-1.5 text-xs font-medium text-destructive">
                {bodyError}
              </p>
            ) : null}
          </div>
          {saveError ? (
            <p className="m-0 text-xs font-medium text-destructive">{saveError}</p>
          ) : null}
          <div className="flex justify-end">
            <Button
              variant="default"
              size="lg"
              className={cn(brandBtnPrimaryCls, "h-10 px-4")}
              onClick={() => void handleCreate()}
              disabled={creating}
            >
              {!creating ? <PlusIcon /> : null}
              {creating ? "Création…" : "Créer le modèle"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <SearchBar
          placeholder="Rechercher un modèle…"
          value={searchQuery}
          onChange={setSearchQuery}
        />

        {error ? (
          <p className="m-0 text-sm font-bold text-rose-700">{error}</p>
        ) : null}

        {showBigEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <LayoutTemplate
              className="mb-3 h-10 w-10 text-muted-foreground/50"
              aria-hidden
            />
            <p className="m-0 text-sm font-extrabold text-foreground">
              Aucun modèle personnalisé
            </p>
            <p className="m-0 mt-1 max-w-sm text-xs font-semibold text-muted-foreground">
              Créez votre premier modèle ci-dessus pour le retrouver dans le
              wizard campagne.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            loading={loading}
            pageSize={20}
            globalFilter={searchQuery}
            emptyMessage="Aucun modèle."
            searchNoResultsMessage="Aucun résultat pour cette recherche."
            footer={footerLabel}
            clipHorizontalOverflow
          />
        )}
      </div>

      <ConfirmDeleteModal
        open={deleteTarget !== null}
        title="Supprimer ce modèle ?"
        description={deleteDescription}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
