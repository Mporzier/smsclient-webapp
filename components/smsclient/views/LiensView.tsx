"use client";

import { ConfirmDeleteModal } from "@/components/smsclient/modals/ConfirmDeleteModal";
import { CreateSmsLinkModal } from "@/components/smsclient/modals/CreateSmsLinkModal";
import { CellTruncate } from "@/components/smsclient/ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/smsclient/DataTable";
import { LINK_COL } from "@/components/smsclient/listColumnSizes";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { createSmsShortLink, deleteSmsLink } from "@/lib/supabase/links";
import type { LinkRowData } from "@/lib/types/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Link2, MoreHorizontal, Plus, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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
        cell: ({ getValue }) => (
          <CellTruncate as="div" className="text-primary">
            {getValue<string>()}
          </CellTruncate>
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
        header: () => null,
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 rounded-full text-muted-foreground"
                  aria-label={`Actions pour ${row.original.label || row.original.shortUrl}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onSelect={() => void copyToClipboard(row.original.shortUrl)}
                >
                  Copier le lien court
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleteTarget(row.original)}
                >
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [copyToClipboard]
  );

  const deleteDescription = deleteTarget
    ? `Le lien court ${deleteTarget.shortUrl} ne redirigera plus vers ${deleteTarget.originalUrl}. Cette action est définitive.`
    : "";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <InputGroup
          className="max-w-sm bg-transparent dark:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0"
          role="search"
        >
          <InputGroupAddon align="inline-start">
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Rechercher un lien…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Rechercher un lien"
          />
        </InputGroup>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            size="lg"
            className="rounded-full"
            onClick={() => setCreateOpen(true)}
          >
            <Plus aria-hidden />
            Créer un lien
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
          {error}
        </div>
      ) : null}

      {showBigEmpty ? (
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <Link2
              className="h-14 w-14 text-slate-400"
              strokeWidth={1.25}
              aria-hidden
            />
            <p className="m-0 max-w-[360px] text-lg font-extrabold text-slate-800">
              Aucun lien court pour le moment
            </p>
            <p className="m-0 max-w-[400px] text-sm font-semibold leading-relaxed text-slate-500">
              Créez votre premier lien ou activez le suivi des liens dans une
              campagne SMS.
            </p>
          </div>
        </section>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          pageSize={25}
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
