"use client";

import { SearchBar } from "@/components/smsclient/Shell";
import { SectionGuideCard } from "@/components/smsclient/SectionGuideCard";
import { ConfirmDeleteModal } from "@/components/smsclient/modals/ConfirmDeleteModal";
import { CreateSmsLinkModal } from "@/components/smsclient/modals/CreateSmsLinkModal";
import { brandBtnPrimaryCls } from "@/components/smsclient/modals/modalChrome";
import { CellTruncate, PlusIcon } from "@/components/smsclient/ui";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/smsclient/DataTable";
import { LINK_COL } from "@/components/smsclient/listColumnSizes";
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
  const [createOpen, setCreateOpen] = useState(false);
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

  const handleCreate = useCallback(
    async (args: { originalUrl: string; label: string }) => {
      if (!userId) {
        return { data: null, error: "Connectez-vous pour créer un lien." };
      }
      const { data, error: createError } = await createSmsShortLink(supabase, {
        originalUrl: args.originalUrl,
        label: args.label,
      });
      if (createError || !data) {
        return {
          data: null,
          error: createError?.message ?? "Création impossible.",
        };
      }
      return { data, error: null };
    },
    [userId, supabase]
  );

  const handleCreated = useCallback(async () => {
    await onRefresh();
    onToast?.("Lien court créé");
  }, [onRefresh, onToast]);

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

  const columns: ColumnDef<LinkRowData, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "createdLabel",
        header: "Créé le",
        size: LINK_COL.created,
      },
      {
        accessorKey: "label",
        header: "Libellé",
        size: LINK_COL.label,
        cell: ({ getValue }) => (
          <CellTruncate as="div">{getValue<string>() || "—"}</CellTruncate>
        ),
      },
      {
        accessorKey: "originalUrl",
        header: "URL d'origine",
        size: LINK_COL.originalUrl,
        cell: ({ getValue }) => (
          <CellTruncate as="div" className="text-muted-foreground">
            {getValue<string>()}
          </CellTruncate>
        ),
      },
      {
        accessorKey: "shortUrl",
        header: "Lien court",
        size: LINK_COL.shortUrl,
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-1.5">
            <CellTruncate as="span" className="text-primary">
              {row.original.shortUrl}
            </CellTruncate>
            <button
              type="button"
              aria-label="Copier le lien court"
              onClick={(e) => {
                e.stopPropagation();
                void copyToClipboard(row.original.shortUrl);
              }}
              className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:border-ring/30 hover:text-ring"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ),
      },
      {
        accessorKey: "clickCount",
        header: "Clics",
        size: LINK_COL.clickCount,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue<number>()}</span>
        ),
      },
      {
        id: "actions",
        size: LINK_COL.actions,
        minSize: LINK_COL.actions,
        maxSize: LINK_COL.actions,
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
    [copyToClipboard]
  );

  const deleteDescription = deleteTarget
    ? `Le lien court ${deleteTarget.shortUrl} ne redirigera plus vers ${deleteTarget.originalUrl}. Cette action est définitive.`
    : "";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {showBigEmpty && (
        <SectionGuideCard
          section="liens"
          onPrimaryAction={() => setCreateOpen(true)}
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <SearchBar
            placeholder="Rechercher un lien…"
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <div className="mt-0.5">
          <Button
            variant="default"
            size="lg"
            className={brandBtnPrimaryCls}
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon />
            Créer un lien
          </Button>
        </div>
      </div>

      {error ? (
        <p className="m-0 text-sm font-bold text-rose-700">{error}</p>
      ) : null}

      {showBigEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <Link2 className="mb-3 h-10 w-10 text-muted-foreground/50" aria-hidden />
          <p className="m-0 text-sm font-extrabold text-foreground">
            Aucun lien court pour le moment
          </p>
          <p className="m-0 mt-1 max-w-sm text-xs font-semibold text-muted-foreground">
            Créez votre premier lien ou activez le suivi des liens dans une
            campagne SMS.
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

      <CreateSmsLinkModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
        onCreated={() => void handleCreated()}
      />

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
