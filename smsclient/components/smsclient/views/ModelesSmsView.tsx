"use client";

import { SearchBar } from "@/components/smsclient/Shell";
import { ConfirmDeleteModal } from "@/components/smsclient/modals/ConfirmDeleteModal";
import { CellTruncate, ProtoBtn, PlusIcon } from "@/components/smsclient/ui";
import { DataTable } from "@/components/smsclient/DataTable";
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
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserSmsTemplateRow | null>(
    null,
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
    [rows.length],
  );

  const handleCreate = useCallback(async () => {
    if (!isValidSmsTemplateTitle(title)) {
      setFormError(
        `Le titre est obligatoire (${SMS_TEMPLATE_TITLE_MIN_LENGTH} caractères minimum).`,
      );
      return;
    }
    if (!isValidSmsTemplateBody(body)) {
      setFormError("Le message SMS ne peut pas être vide.");
      return;
    }
    if (!userId) {
      setFormError("Connectez-vous pour créer un modèle.");
      return;
    }
    setCreating(true);
    setFormError(null);
    const { data, error: createError } = await createUserSmsTemplate(
      supabase,
      userId,
      { title, description, body },
    );
    setCreating(false);
    if (createError || !data) {
      setFormError(createError?.message ?? "Création impossible.");
      return;
    }
    setTitle("");
    setDescription("");
    setBody("");
    await onRefresh();
    onToast?.("Modèle SMS créé");
  }, [title, description, body, userId, supabase, onRefresh, onToast]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget || !userId) return;
    const { error: delError } = await deleteUserSmsTemplate(
      supabase,
      userId,
      deleteTarget.id,
    );
    if (delError) throw delError;
    setDeleteTarget(null);
    await onRefresh();
    onToast?.("Modèle supprimé");
  }, [deleteTarget, userId, supabase, onRefresh, onToast]);

  const canCreate =
    isValidSmsTemplateTitle(title) &&
    isValidSmsTemplateBody(body) &&
    !creating;

  const columns: ColumnDef<UserSmsTemplateRow, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "createdLabel",
        header: "Créé le",
        size: 130,
      },
      {
        accessorKey: "title",
        header: "Titre",
        size: 140,
        cell: ({ getValue }) => (
          <CellTruncate as="div" className="font-black text-slate-900">
            {getValue<string>()}
          </CellTruncate>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        size: 160,
        cell: ({ getValue }) => (
          <CellTruncate as="div" className="text-slate-600">
            {getValue<string>() || "—"}
          </CellTruncate>
        ),
      },
      {
        accessorKey: "body",
        header: "Message",
        size: 280,
        cell: ({ getValue }) => (
          <CellTruncate as="div" className="font-semibold text-slate-700">
            {getValue<string>()}
          </CellTruncate>
        ),
      },
      {
        id: "actions",
        size: 48,
        cell: ({ row }) => (
          <button
            type="button"
            title="Supprimer"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row.original);
            }}
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        ),
      },
    ],
    [],
  );

  const deleteDescription = deleteTarget
    ? `Le modèle « ${deleteTarget.title} » sera supprimé définitivement.`
    : "";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[18px]">
      <div>
        <h1 className="m-0 text-xl font-black text-slate-900">Modèles SMS</h1>
        <p className="m-0 mt-1 text-sm font-semibold text-slate-500">
          Créez et gérez vos modèles personnalisés pour vos campagnes.
        </p>
      </div>

      <div className={cn(fieldBox, "shrink-0 py-4")}>
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#2f6fed]/20 bg-[#eef4ff] text-[#2f6fed]">
            <LayoutTemplate className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="m-0 text-sm font-black text-slate-900">
              Créer un modèle
            </h2>
            <p className="m-0 text-xs font-semibold text-slate-500">
              Réutilisez-le lors de la rédaction d&apos;une campagne SMS.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <label
                htmlFor="modeles-create-title"
                className="mb-1.5 flex items-baseline justify-between gap-2 text-xs font-bold text-slate-700"
              >
                <span>Titre *</span>
                <span className="text-[10px] font-semibold tabular-nums text-slate-400">
                  {title.trim().length}/{SMS_TEMPLATE_TITLE_MAX_LENGTH} (min.{" "}
                  {SMS_TEMPLATE_TITLE_MIN_LENGTH})
                </span>
              </label>
              <input
                id="modeles-create-title"
                type="text"
                maxLength={SMS_TEMPLATE_TITLE_MAX_LENGTH}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#2f6fed]/40 focus:ring-2 focus:ring-[#2f6fed]/15"
                placeholder="Promo été"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (formError) setFormError(null);
                }}
              />
            </div>
            <div className="min-w-0">
              <label
                htmlFor="modeles-create-description"
                className="mb-1.5 block text-xs font-bold text-slate-700"
              >
                Description
              </label>
              <input
                id="modeles-create-description"
                type="text"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#2f6fed]/40 focus:ring-2 focus:ring-[#2f6fed]/15"
                placeholder="Offre de rentrée"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (formError) setFormError(null);
                }}
              />
            </div>
          </div>
          <div className="min-w-0">
            <label
              htmlFor="modeles-create-body"
              className="mb-1.5 block text-xs font-bold text-slate-700"
            >
              Message SMS *
            </label>
            <textarea
              id="modeles-create-body"
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold leading-relaxed text-slate-900 outline-none focus:border-[#2f6fed]/40 focus:ring-2 focus:ring-[#2f6fed]/15"
              placeholder="Bonjour ⟦prénom⟧, profitez de -20 % cette semaine en boutique ! STOP 36000"
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (formError) setFormError(null);
              }}
            />
          </div>
          <div className="flex justify-end">
            <ProtoBtn
              primary
              className="h-10 px-4"
              onClick={() => void handleCreate()}
              disabled={!canCreate}
            >
              {!creating ? <PlusIcon /> : null}
              {creating ? "Création…" : "Créer le modèle"}
            </ProtoBtn>
          </div>
        </div>

        {formError ? (
          <p className="m-0 mt-2 text-xs font-bold text-rose-700">{formError}</p>
        ) : null}
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
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <LayoutTemplate
              className="mb-3 h-10 w-10 text-slate-300"
              aria-hidden
            />
            <p className="m-0 text-sm font-extrabold text-slate-700">
              Aucun modèle personnalisé
            </p>
            <p className="m-0 mt-1 max-w-sm text-xs font-semibold text-slate-500">
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
