"use client";

import { ConfirmDeleteModal } from "@/components/smsclient/modals/ConfirmDeleteModal";
import { CreateSmsTemplateModal } from "@/components/smsclient/modals/CreateSmsTemplateModal";
import { CellTruncate } from "@/components/smsclient/ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/smsclient/DataTable";
import { MODELE_SMS_COL } from "@/components/smsclient/listColumnSizes";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useI18n } from "@/lib/i18n";
import {
  createUserSmsTemplate,
  deleteUserSmsTemplate,
} from "@/lib/supabase/smsTemplates";
import type { UserSmsTemplateRow } from "@/lib/types/smsTemplate";
import type { CustomFieldDef } from "@/lib/types/customFields";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LayoutTemplate, MoreHorizontal, Plus, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "@/components/ui/sonner";
import type {
  ColumnDef,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table";

type ModelesSmsViewProps = {
  rows: UserSmsTemplateRow[];
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
  customFieldDefs?: CustomFieldDef[];
};

export function ModelesSmsView({
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
  customFieldDefs = [],
}: ModelesSmsViewProps) {
  const { t } = useI18n();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserSmsTemplateRow | null>(
    null,
  );

  const showBigEmpty =
    !loading && !error && rows.length === 0 && searchQuery.trim() === "";

  const footerN = typeof totalCount === "number" ? totalCount : rows.length;
  const footerLabel = useMemo(
    () =>
      t(footerN === 1 ? "templates.footerOne" : "templates.footerMany", {
        n: footerN,
      }),
    [footerN, t],
  );

  const handleCreate = useCallback(
    async (args: { title: string; description: string; body: string }) => {
      if (!userId) {
        return { data: null, error: t("templates.loginRequired") };
      }
      const { data, error: createError } = await createUserSmsTemplate(
        supabase,
        userId,
        args,
      );
      if (createError || !data) {
        return {
          data: null,
          error: createError?.message ?? t("templates.createFailed"),
        };
      }
      return { data, error: null };
    },
    [userId, supabase, t],
  );

  const handleCreated = useCallback(async () => {
    await onRefresh();
    toast(t("templates.createdToast"));
  }, [onRefresh, t]);

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
    toast(t("templates.deletedToast"));
  }, [deleteTarget, userId, supabase, onRefresh, t]);

  const columns: ColumnDef<UserSmsTemplateRow, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "createdLabel",
        header: t("templates.col.created"),
        size: MODELE_SMS_COL.created,
      },
      {
        accessorKey: "title",
        header: t("templates.col.title"),
        size: MODELE_SMS_COL.title,
        cell: ({ getValue }) => (
          <CellTruncate as="div" className="text-foreground">
            {getValue<string>()}
          </CellTruncate>
        ),
      },
      {
        accessorKey: "description",
        header: t("templates.col.description"),
        size: MODELE_SMS_COL.description,
        cell: ({ getValue }) => (
          <CellTruncate as="div" className="text-muted-foreground">
            {getValue<string>() || "—"}
          </CellTruncate>
        ),
      },
      {
        accessorKey: "body",
        header: t("templates.col.message"),
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
                  aria-label={t("templates.actionsAria", {
                    name: row.original.title,
                  })}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
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
    [t],
  );

  const deleteDescription = deleteTarget
    ? t("templates.deleteDesc", { title: deleteTarget.title })
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
            placeholder={t("templates.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={t("templates.searchAria")}
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
            {t("templates.create")}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
          {error}
        </div>
      ) : null}

      {showBigEmpty ? (
        <Empty className="min-h-[280px] p-0 md:p-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutTemplate aria-hidden />
            </EmptyMedia>
            <EmptyTitle>{t("templates.emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("templates.emptyBody")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="default"
              className="rounded-full"
              onClick={() => setCreateOpen(true)}
            >
              <Plus aria-hidden />
              {t("templates.create")}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          globalFilter={searchQuery}
          loadingMessage={t("templates.loading")}
          emptyMessage={t("templates.emptyTable")}
          searchNoResultsMessage={t("templates.noSearchResults")}
          footer={footerLabel}
          clipHorizontalOverflow
          sorting={sorting}
          onSortingChange={onSortingChange}
          manualSorting
        />
      )}

      <CreateSmsTemplateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
        onCreated={() => void handleCreated()}
        customFieldDefs={customFieldDefs}
      />

      <ConfirmDeleteModal
        open={deleteTarget !== null}
        title={t("templates.deleteTitle")}
        description={deleteDescription}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
