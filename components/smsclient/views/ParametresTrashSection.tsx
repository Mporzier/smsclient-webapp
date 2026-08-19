"use client";

import { DataTable } from "@/components/smsclient/DataTable";
import { CONTACT_COL } from "@/components/smsclient/listColumnSizes";
import { brandBtnPrimaryCls } from "@/components/smsclient/modals/modalChrome";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/lib/i18n";
import { TRASH_RETENTION_DAYS } from "@/lib/proto/trashRetention";
import type { DeletedContactRow, DeletedGroupRow } from "@/lib/types/trash";
import type { ColumnDef } from "@tanstack/react-table";
import { RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type ParametresTrashSectionProps = {
  contacts: DeletedContactRow[];
  groups: DeletedGroupRow[];
  loading: boolean;
  error: string | null;
  onRestoreContacts: (ids: string[]) => Promise<void>;
  onRestoreGroups: (ids: string[]) => Promise<void>;
  onRefresh: () => Promise<void>;
};

export function ParametresTrashSection({
  contacts,
  groups,
  loading,
  error,
  onRestoreContacts,
  onRestoreGroups,
  onRefresh,
}: ParametresTrashSectionProps) {
  const { t } = useI18n();
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
    new Set(),
  );
  const [restoring, setRestoring] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const toggleContact = (id: string) => {
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const restoreSelected = async () => {
    const contactIds = [...selectedContactIds];
    const groupIds = [...selectedGroupIds];
    if (contactIds.length === 0 && groupIds.length === 0) return;
    setActionError(null);
    setRestoring(true);
    try {
      if (contactIds.length > 0) await onRestoreContacts(contactIds);
      if (groupIds.length > 0) await onRestoreGroups(groupIds);
      setSelectedContactIds(new Set());
      setSelectedGroupIds(new Set());
      await onRefresh();
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : t("trash.restoreFailed"),
      );
    } finally {
      setRestoring(false);
    }
  };

  const empty = !loading && contacts.length === 0 && groups.length === 0;
  const selectedCount = selectedContactIds.size + selectedGroupIds.size;

  const contactColumns = useMemo(
    (): ColumnDef<DeletedContactRow, unknown>[] => [
      {
        id: "select",
        size: CONTACT_COL.select,
        minSize: CONTACT_COL.select,
        maxSize: CONTACT_COL.select,
        enableResizing: false,
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={selectedContactIds.has(row.original.id)}
              onCheckedChange={() => toggleContact(row.original.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={t("common.select")}
            />
          </div>
        ),
      },
      { accessorKey: "name", header: t("trash.col.name") },
      { accessorKey: "phone", header: t("trash.col.phone") },
      { accessorKey: "groupsLabel", header: t("trash.col.groups") },
      { accessorKey: "deletedLabel", header: t("trash.col.deletedAt") },
      { accessorKey: "expiresLabel", header: t("trash.col.expiresAt") },
    ],
    [selectedContactIds, t],
  );

  const groupColumns = useMemo(
    (): ColumnDef<DeletedGroupRow, unknown>[] => [
      {
        id: "select",
        size: CONTACT_COL.select,
        minSize: CONTACT_COL.select,
        maxSize: CONTACT_COL.select,
        enableResizing: false,
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={selectedGroupIds.has(row.original.id)}
              onCheckedChange={() => toggleGroup(row.original.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={t("common.select")}
            />
          </div>
        ),
      },
      { accessorKey: "name", header: t("trash.col.group") },
      {
        accessorKey: "description",
        header: t("trash.col.description"),
        cell: ({ getValue }) => getValue<string>() || "—",
      },
      {
        accessorKey: "contactCount",
        header: t("trash.col.activeContacts"),
        cell: ({ getValue }) => String(getValue<number>()),
      },
      { accessorKey: "deletedLabel", header: t("trash.col.deletedAt") },
      { accessorKey: "expiresLabel", header: t("trash.col.expiresAt") },
    ],
    [selectedGroupIds, t],
  );

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Trash2 className="h-5 w-5 text-muted-foreground" aria-hidden />
              {t("trash.title")}
            </CardTitle>
            <CardDescription className="mt-1.5 max-w-[640px]">
              {t("trash.description", { days: TRASH_RETENTION_DAYS })}
            </CardDescription>
          </div>
          {selectedCount > 0 && (
            <Button
              variant="default"
              size="lg"
              className={brandBtnPrimaryCls}
              disabled={restoring}
              onClick={() => void restoreSelected()}
            >
              <RotateCcw className="mr-1.5 inline h-4 w-4" aria-hidden />
              {restoring
                ? t("trash.restoring")
                : t("trash.restoreSelected", { n: selectedCount })}
            </Button>
          )}
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="font-bold">{error}</AlertDescription>
        </Alert>
      )}
      {actionError && (
        <Alert variant="destructive">
          <AlertDescription className="font-bold">{actionError}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <Card size="sm">
          <CardContent className="grid min-h-[160px] place-items-center">
            <Spinner className="size-6 text-primary" />
          </CardContent>
        </Card>
      )}

      {empty && (
        <Card size="sm" className="border-dashed">
          <CardContent className="py-10 text-center">
            <p className="text-sm font-semibold text-muted-foreground">
              {t("trash.empty")}
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && contacts.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {t("trash.contactsTitle")}
          </h3>
          <DataTable
            columns={contactColumns}
            data={contacts}
            emptyMessage={t("trash.contactsEmpty")}
            minContentWidth={760}
          />
        </div>
      )}

      {!loading && groups.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {t("trash.groupsTitle")}
          </h3>
          <DataTable
            columns={groupColumns}
            data={groups}
            emptyMessage={t("trash.groupsEmpty")}
            minContentWidth={760}
          />
        </div>
      )}
    </div>
  );
}
