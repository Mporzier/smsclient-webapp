"use client";

import { SearchBar } from "@/components/smsclient/Shell";
import { ConfirmDeleteModal } from "@/components/smsclient/modals/ConfirmDeleteModal";
import { CellTruncate, ProtoBtn, PlusIcon } from "@/components/smsclient/ui";
import { DataTable } from "@/components/smsclient/DataTable";
import { fieldBox } from "@/components/smsclient/flowFieldStyles";
import { cn } from "@/lib/cn";
import {
  normalizeUrl,
  isValidLinkUrl,
  isValidLinkLabel,
  SMS_LINK_LABEL_MAX_LENGTH,
  SMS_LINK_LABEL_MIN_LENGTH,
} from "@/components/smsclient/CreateCampaign/campaignTextUtils";
import { createSmsShortLink, deleteSmsLink } from "@/lib/supabase/links";
import type { LinkRowData } from "@/lib/types/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Copy, Link2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

type LiensViewProps = {
  rows: LinkRowData[];
  loading: boolean;
  error: string | null;
  supabase: SupabaseClient;
  userId: string | undefined;
  onRefresh: () => Promise<void>;
  onToast?: (message: string) => void;
};

export function LiensView({
  rows,
  loading,
  error,
  supabase,
  userId,
  onRefresh,
  onToast,
}: LiensViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LinkRowData | null>(null);

  useEffect(() => {
    document.body.style.overflow = deleteTarget ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [deleteTarget]);

  const showBigEmpty = !loading && !error && rows.length === 0;

  const footerLabel = useMemo(
    () => `${rows.length} lien${rows.length !== 1 ? "s" : ""}`,
    [rows.length]
  );

  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        onToast?.("Lien copié");
      } catch {
        onToast?.("Copie impossible");
      }
    },
    [onToast]
  );

  const handleCreate = useCallback(async () => {
    const normalized = normalizeUrl(originalUrl);
    if (!isValidLinkUrl(originalUrl)) {
      setFormError(
        "Saisissez une URL valide (ex. https://votre-site.fr/promo)."
      );
      return;
    }
    const trimmedLabel = label.trim().slice(0, SMS_LINK_LABEL_MAX_LENGTH);
    if (!isValidLinkLabel(trimmedLabel)) {
      setFormError(
        `Le libellé est obligatoire (${SMS_LINK_LABEL_MIN_LENGTH} caractères minimum).`
      );
      return;
    }
    if (!userId) {
      setFormError("Connectez-vous pour créer un lien.");
      return;
    }
    setCreating(true);
    setFormError(null);
    const { data, error: createError } = await createSmsShortLink(supabase, {
      originalUrl: normalized,
      label: trimmedLabel,
    });
    setCreating(false);
    if (createError || !data) {
      setFormError(createError?.message ?? "Création impossible.");
      return;
    }
    setOriginalUrl("");
    setLabel("");
    await onRefresh();
    onToast?.("Lien court créé");
  }, [originalUrl, label, userId, supabase, onRefresh, onToast]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget || !userId) return;
    const { error: delError } = await deleteSmsLink(
      supabase,
      userId,
      deleteTarget.id
    );
    if (delError) throw delError;
    setDeleteTarget(null);
    await onRefresh();
    onToast?.("Lien supprimé");
  }, [deleteTarget, userId, supabase, onRefresh, onToast]);

  const urlValid = isValidLinkUrl(originalUrl);
  const labelValid = isValidLinkLabel(label);
  const canCreate = urlValid && labelValid && !creating;

  const columns: ColumnDef<LinkRowData, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "createdLabel",
        header: "Créé le",
        size: 130,
      },
      {
        accessorKey: "label",
        header: "Libellé",
        size: 140,
        cell: ({ getValue }) => (
          <CellTruncate as="div">{getValue<string>() || "—"}</CellTruncate>
        ),
      },
      {
        accessorKey: "originalUrl",
        header: "URL d'origine",
        size: 220,
        cell: ({ getValue }) => (
          <CellTruncate as="div" className="font-semibold text-slate-700">
            {getValue<string>()}
          </CellTruncate>
        ),
      },
      {
        accessorKey: "shortUrl",
        header: "Lien court",
        size: 118,
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-1.5">
            <CellTruncate as="span" className="font-extrabold text-[#1f3b77]">
              {row.original.shortUrl}
            </CellTruncate>
            <button
              type="button"
              title="Copier le lien court"
              onClick={(e) => {
                e.stopPropagation();
                void copyToClipboard(row.original.shortUrl);
              }}
              className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-[#2f6fed]/30 hover:text-[#2f6fed]"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ),
      },
      {
        accessorKey: "clickCount",
        header: "Clics",
        size: 40,
        cell: ({ getValue }) => (
          <span className="font-black tabular-nums">{getValue<number>()}</span>
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
    [copyToClipboard]
  );

  const deleteDescription = deleteTarget
    ? `Le lien court ${deleteTarget.shortUrl} ne redirigera plus vers ${deleteTarget.originalUrl}. Cette action est définitive.`
    : "";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-xl font-black text-slate-900">Liens</h1>
          <p className="m-0 mt-1 text-sm font-semibold text-slate-500">
            Minifiez vos URLs et suivez les clics dans vos SMS.
          </p>
        </div>
      </div>

      <div className={cn(fieldBox, "shrink-0 py-4")}>
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#2f6fed]/20 bg-[#eef4ff] text-[#2f6fed]">
            <Link2 className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="m-0 text-sm font-black text-slate-900">
              Créer un lien court
            </h2>
            <p className="m-0 text-xs font-semibold text-slate-500">
              L&apos;URL sera enregistrée et un lien court traçable sera généré.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="min-w-0">
            <label
              htmlFor="liens-create-url"
              className="mb-1.5 block text-xs font-bold text-slate-700"
            >
              URL
            </label>
            <input
              id="liens-create-url"
              type="url"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#2f6fed]/40 focus:ring-2 focus:ring-[#2f6fed]/15"
              placeholder="www.votre-site.fr/promo"
              value={originalUrl}
              onChange={(e) => {
                setOriginalUrl(e.target.value);
                if (formError) setFormError(null);
              }}
            />
          </div>
          <div className="min-w-0">
            <label
              htmlFor="liens-create-label"
              className="mb-1.5 flex items-baseline justify-between gap-2 text-xs font-bold text-slate-700"
            >
              <span>Libellé</span>
              <span className="text-[10px] font-semibold tabular-nums text-slate-400">
                {label.trim().length}/{SMS_LINK_LABEL_MAX_LENGTH} (min.{" "}
                {SMS_LINK_LABEL_MIN_LENGTH})
              </span>
            </label>
            <input
              id="liens-create-label"
              type="text"
              required
              minLength={SMS_LINK_LABEL_MIN_LENGTH}
              maxLength={SMS_LINK_LABEL_MAX_LENGTH}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#2f6fed]/40 focus:ring-2 focus:ring-[#2f6fed]/15"
              placeholder="Promo été"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (formError) setFormError(null);
              }}
            />
          </div>
          <ProtoBtn
            primary
            className="h-10 w-full px-4 sm:w-auto"
            onClick={() => void handleCreate()}
            disabled={!canCreate}
          >
            {!creating ? <PlusIcon /> : null}
            {creating ? "Création…" : "Créer"}
          </ProtoBtn>
        </div>

        {formError ? (
          <p className="m-0 mt-2 text-xs font-bold text-rose-700">
            {formError}
          </p>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <SearchBar
          placeholder="Rechercher un lien…"
          value={searchQuery}
          onChange={setSearchQuery}
        />

        {error ? (
          <p className="m-0 text-sm font-bold text-rose-700">{error}</p>
        ) : null}

        {showBigEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <Link2 className="mb-3 h-10 w-10 text-slate-300" aria-hidden />
            <p className="m-0 text-sm font-extrabold text-slate-700">
              Aucun lien court pour le moment
            </p>
            <p className="m-0 mt-1 max-w-sm text-xs font-semibold text-slate-500">
              Créez votre premier lien ci-dessus ou activez le suivi des liens
              dans une campagne SMS.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            loading={loading}
            pageSize={20}
            globalFilter={searchQuery}
            emptyMessage="Aucun lien."
            searchNoResultsMessage="Aucun résultat pour cette recherche."
            footer={footerLabel}
            clipHorizontalOverflow
            onRowClick={(row) => void copyToClipboard(row.shortUrl)}
          />
        )}
      </div>

      <ConfirmDeleteModal
        open={deleteTarget !== null}
        title="Supprimer ce lien court ?"
        description={deleteDescription}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
