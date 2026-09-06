"use client";

import { ConfirmLinkDeleteModal } from "@/components/smsclient/modals/ConfirmLinkDeleteModal";
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
import { useI18n } from "@/lib/i18n";
import { createSmsShortLink, deleteSmsLink } from "@/lib/supabase/links";
import type { LinkRowData } from "@/lib/types/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Copy, Link2, MoreHorizontal, Plus, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "@/components/ui/sonner";
import type {
  ColumnDef,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table";

type LiensViewProps = {
  rows: LinkRowData[];
  loading: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  totalCount?: number | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  error: string | null;
  supabase: SupabaseClient;
  userId: string | undefined;
  onRefresh: () => Promise<void>;
};

export function LiensView({
  rows,
  loading,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  totalCount = null,
  searchQuery,
  onSearchChange,
  sorting,
  onSortingChange,
  error,
  supabase,
  userId,
  onRefresh,
}: LiensViewProps) {
  const { t } = useI18n();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LinkRowData | null>(null);

  const showBigEmpty =
    !loading && !error && rows.length === 0 && searchQuery.trim() === "";

  const footerN = typeof totalCount === "number" ? totalCount : rows.length;
  const footerLabel = useMemo(
    () =>
      t(footerN === 1 ? "links.footerOne" : "links.footerMany", {
        n: footerN,
      }),
    [footerN, t],
  );

  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast(t("links.copied"));
      } catch {
        toast.error(t("links.copyFailed"));
      }
    },
    [t],
  );

  const handleCreate = useCallback(
    async (args: { originalUrl: string; label: string }) => {
      if (!userId) {
        return { data: null, error: t("links.loginRequired") };
      }
      const { data, error: createError } = await createSmsShortLink(supabase, {
        originalUrl: args.originalUrl,
        label: args.label,
      });
      if (createError || !data) {
        return {
          data: null,
          error: createError?.message ?? t("links.createFailed"),
        };
      }
      return { data, error: null };
    },
    [userId, supabase, t],
  );

  const handleCreated = useCallback(async () => {
    await onRefresh();
    toast(t("links.createdToast"));
  }, [onRefresh, t]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget || !userId) return;
    const { error: delError } = await deleteSmsLink(
      supabase,
      userId,
      deleteTarget.id,
    );
    if (delError) throw delError;
    setDeleteTarget(null);
    await onRefresh();
    toast(t("links.deletedToast"));
  }, [deleteTarget, userId, supabase, onRefresh, t]);

  const columns: ColumnDef<LinkRowData, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "createdLabel",
        header: t("links.col.created"),
        size: LINK_COL.created,
      },
      {
        accessorKey: "label",
        header: t("links.col.label"),
        size: LINK_COL.label,
        cell: ({ getValue }) => (
          <CellTruncate as="div">{getValue<string>() || "—"}</CellTruncate>
        ),
      },
      {
        accessorKey: "originalUrl",
        header: t("links.col.originalUrl"),
        size: LINK_COL.originalUrl,
        cell: ({ getValue }) => (
          <CellTruncate as="div" className="text-muted-foreground">
            {getValue<string>()}
          </CellTruncate>
        ),
      },
      {
        accessorKey: "shortUrl",
        header: t("links.col.shortUrl"),
        size: LINK_COL.shortUrl,
        cell: ({ getValue }) => {
          const shortUrl = getValue<string>();
          return (
            <div className="flex min-w-0 items-center gap-1">
              <CellTruncate as="div" className="min-w-0 flex-1 text-primary">
                {shortUrl}
              </CellTruncate>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7 shrink-0 rounded-full text-muted-foreground"
                aria-label={t("links.copyShort")}
                onClick={(e) => {
                  e.stopPropagation();
                  void copyToClipboard(shortUrl);
                }}
              >
                <Copy className="size-3.5" aria-hidden />
              </Button>
            </div>
          );
        },
      },
      {
        accessorKey: "clickCount",
        header: t("links.col.clicks"),
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
                  aria-label={t("links.actionsAria", {
                    name: row.original.label || row.original.shortUrl,
                  })}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onSelect={() => void copyToClipboard(row.original.shortUrl)}
                >
                  {t("links.copyShort")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleteTarget(row.original)}
                >
                  {t("common.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [copyToClipboard, t],
  );

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
            placeholder={t("links.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={t("links.searchAria")}
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
            {t("links.create")}
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
              {t("links.emptyTitle")}
            </p>
            <p className="m-0 max-w-[400px] text-sm font-semibold leading-relaxed text-slate-500">
              {t("links.emptyBody")}
            </p>
          </div>
        </section>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          globalFilter={searchQuery}
          loadingMessage={t("links.loading")}
          emptyMessage={t("links.emptyTable")}
          searchNoResultsMessage={t("links.noSearchResults")}
          footer={footerLabel}
          clipHorizontalOverflow
          sorting={sorting}
          onSortingChange={onSortingChange}
          manualSorting
        />
      )}

      <CreateSmsLinkModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
        onCreated={() => void handleCreated()}
      />

      <ConfirmLinkDeleteModal
        open={deleteTarget !== null}
        shortUrl={deleteTarget?.shortUrl ?? ""}
        originalUrl={deleteTarget?.originalUrl ?? ""}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
