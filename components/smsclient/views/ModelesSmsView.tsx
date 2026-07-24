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
import { useI18n } from "@/lib/i18n";
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
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  totalCount?: number | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  error: string | null;
  supabase: SupabaseClient;
  userId: string | undefined;
  onRefresh: () => Promise<void>;
  onToast?: (message: string) => void;
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
  error,
  supabase,
  userId,
  onRefresh,
  onToast,
}: ModelesSmsViewProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [creating, setCreating] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserSmsTemplateRow | null>(
    null,
  );

  useEffect(() => {
    document.body.style.overflow = deleteTarget ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [deleteTarget]);

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

  const handleCreate = useCallback(async () => {
    let hasFieldError = false;
    if (!isValidSmsTemplateTitle(title)) {
      setTitleError(
        t("templates.titleRequired", { min: SMS_TEMPLATE_TITLE_MIN_LENGTH }),
      );
      hasFieldError = true;
    } else {
      setTitleError(null);
    }
    if (!isValidSmsTemplateBody(body)) {
      setBodyError(t("templates.bodyRequired"));
      hasFieldError = true;
    } else {
      setBodyError(null);
    }
    if (hasFieldError) return;

    if (!userId) {
      setSaveError(t("templates.loginRequired"));
      return;
    }
    setCreating(true);
    setSaveError(null);
    const { data, error: createError } = await createUserSmsTemplate(
      supabase,
      userId,
      { title, description, body },
    );
    setCreating(false);
    if (createError || !data) {
      setSaveError(createError?.message ?? t("templates.createFailed"));
      return;
    }
    setTitle("");
    setDescription("");
    setBody("");
    setTitleError(null);
    setBodyError(null);
    await onRefresh();
    onToast?.(t("templates.createdToast"));
  }, [title, description, body, userId, supabase, onRefresh, onToast, t]);

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
    onToast?.(t("templates.deletedToast"));
  }, [deleteTarget, userId, supabase, onRefresh, onToast, t]);

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
        cell: ({ row }) => (
          <button
            type="button"
            aria-label={t("common.delete")}
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
    [t],
  );

  const deleteDescription = deleteTarget
    ? t("templates.deleteDesc", { title: deleteTarget.title })
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
              {t("templates.createTitle")}
            </h2>
            <p className="m-0 text-xs font-semibold text-muted-foreground">
              {t("templates.createSubtitle")}
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
                <span>{t("templates.field.title")}</span>
                <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {t("templates.field.titleCount", {
                    current: title.trim().length,
                    max: SMS_TEMPLATE_TITLE_MAX_LENGTH,
                    min: SMS_TEMPLATE_TITLE_MIN_LENGTH,
                  })}
                </span>
              </label>
              <input
                id="modeles-create-title"
                type="text"
                maxLength={SMS_TEMPLATE_TITLE_MAX_LENGTH}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none focus:border-border focus:ring-0"
                placeholder={t("templates.field.titlePlaceholder")}
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
                {t("templates.field.description")}
              </label>
              <input
                id="modeles-create-description"
                type="text"
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none focus:border-border focus:ring-0"
                placeholder={t("templates.field.descriptionPlaceholder")}
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
              {t("templates.field.body")}
            </label>
            <textarea
              id="modeles-create-body"
              rows={4}
              className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold leading-relaxed text-foreground outline-none focus:border-border focus:ring-0"
              placeholder={t("templates.field.bodyPlaceholder")}
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
              {creating ? t("templates.creating") : t("templates.createAction")}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <SearchBar
          placeholder={t("templates.searchPlaceholder")}
          value={searchQuery}
          onChange={onSearchChange}
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
              {t("templates.emptyTitle")}
            </p>
            <p className="m-0 mt-1 max-w-sm text-xs font-semibold text-muted-foreground">
              {t("templates.emptyBody")}
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
            globalFilter={searchQuery}
            emptyMessage={t("templates.emptyTable")}
            searchNoResultsMessage={t("templates.noSearchResults")}
            footer={footerLabel}
            clipHorizontalOverflow
          />
        )}
      </div>

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
