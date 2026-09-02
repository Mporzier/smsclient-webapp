"use client";

import { DataTable } from "@/components/smsclient/DataTable";
import { CONTACT_COL } from "@/components/smsclient/listColumnSizes";
import { TrashRestoreModal } from "@/components/smsclient/modals/TrashRestoreModal";import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/lib/i18n";
import type {
  DeletedContactRow,
  DeletedGroupRow,
  TrashRestoreResult,
} from "@/lib/types/trash";
import type { ColumnDef } from "@tanstack/react-table";
import { RotateCcw, Search } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

/** Lignes montées d'emblée — corbeille peut contenir des milliers de contacts. */
const TRASH_PAGE = 50;

/**
 * Table bornée par la hauteur restante : scrollbar unique (celle de la liste),
 * et sentinel de lazyload hors viewport — sinon onLoadMore se rappelle jusqu'à
 * la dernière ligne (updates imbriqués, « Maximum update depth exceeded »).
 */
const TRASH_TABLE_CLS = "min-h-0 flex-1";

type TrashTab = "contacts" | "groups";

type ParametresTrashSectionProps = {
  contacts: DeletedContactRow[];
  groups: DeletedGroupRow[];
  loading: boolean;
  error: string | null;
  onRestoreContacts: (ids: string[]) => Promise<TrashRestoreResult>;
  onRestoreGroups: (ids: string[]) => Promise<TrashRestoreResult>;
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
  const [visibleContacts, setVisibleContacts] = useState(TRASH_PAGE);
  const [visibleGroups, setVisibleGroups] = useState(TRASH_PAGE);
  const [tab, setTab] = useState<TrashTab>("contacts");
  const [query, setQuery] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const toggleContact = useCallback((id: string) => {
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleGroup = useCallback((id: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const restoreSelected = async (): Promise<TrashRestoreResult> => {
    const ids =
      tab === "contacts" ? [...selectedContactIds] : [...selectedGroupIds];
    if (ids.length === 0) return { restored: 0, duplicates: 0 };

    const result =
      tab === "contacts"
        ? await onRestoreContacts(ids)
        : await onRestoreGroups(ids);

    if (tab === "contacts") setSelectedContactIds(new Set());
    else setSelectedGroupIds(new Set());
    await onRefresh();
    return result;
  };

  const switchTab = (next: TrashTab) => {
    if (next === tab) return;
    if (next === "contacts") setSelectedGroupIds(new Set());
    else setSelectedContactIds(new Set());
    setTab(next);
  };

  const selectedCount =
    tab === "contacts" ? selectedContactIds.size : selectedGroupIds.size;

  const q = query.trim().toLowerCase();

  const filteredContacts = useMemo(() => {
    if (!q) return contacts;
    return contacts.filter((row) =>
      [row.name, row.phone, row.groupsLabel].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  }, [contacts, q]);

  const filteredGroups = useMemo(() => {
    if (!q) return groups;
    return groups.filter((row) =>
      [row.name, row.description].some((v) => v.toLowerCase().includes(q)),
    );
  }, [groups, q]);

  // Reset pagination pendant le render (pas dans un effect : évite le render
  // en cascade signalé par react-hooks/set-state-in-effect).
  const [contactsPager, setContactsPager] = useState({ rows: contacts, q });
  if (contactsPager.rows !== contacts || contactsPager.q !== q) {
    setContactsPager({ rows: contacts, q });
    setVisibleContacts(TRASH_PAGE);
  }

  const [groupsPager, setGroupsPager] = useState({ rows: groups, q });
  if (groupsPager.rows !== groups || groupsPager.q !== q) {
    setGroupsPager({ rows: groups, q });
    setVisibleGroups(TRASH_PAGE);
  }

  const contactRows = useMemo(
    () => filteredContacts.slice(0, visibleContacts),
    [filteredContacts, visibleContacts],
  );
  const groupRows = useMemo(
    () => filteredGroups.slice(0, visibleGroups),
    [filteredGroups, visibleGroups],
  );

  const allContactsSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((row) => selectedContactIds.has(row.id));
  const allGroupsSelected =
    filteredGroups.length > 0 &&
    filteredGroups.every((row) => selectedGroupIds.has(row.id));

  const toggleAllContacts = useCallback(() => {
    setSelectedContactIds((prev) => {
      const allSelected =
        filteredContacts.length > 0 &&
        filteredContacts.every((row) => prev.has(row.id));
      if (allSelected) return new Set();
      return new Set(filteredContacts.map((row) => row.id));
    });
  }, [filteredContacts]);

  const toggleAllGroups = useCallback(() => {
    setSelectedGroupIds((prev) => {
      const allSelected =
        filteredGroups.length > 0 &&
        filteredGroups.every((row) => prev.has(row.id));
      if (allSelected) return new Set();
      return new Set(filteredGroups.map((row) => row.id));
    });
  }, [filteredGroups]);

  const growLockRef = useRef(false);
  const takeGrowLock = useCallback(() => {
    if (growLockRef.current) return false;
    growLockRef.current = true;
    requestAnimationFrame(() => {
      growLockRef.current = false;
    });
    return true;
  }, []);

  const loadMoreContacts = useCallback(() => {
    if (!takeGrowLock()) return;
    setVisibleContacts((n) =>
      Math.min(n + TRASH_PAGE, filteredContacts.length),
    );
  }, [filteredContacts.length, takeGrowLock]);

  const loadMoreGroups = useCallback(() => {
    if (!takeGrowLock()) return;
    setVisibleGroups((n) => Math.min(n + TRASH_PAGE, filteredGroups.length));
  }, [filteredGroups.length, takeGrowLock]);

  const contactColumns = useMemo(
    (): ColumnDef<DeletedContactRow, unknown>[] => [
      {
        id: "select",
        size: CONTACT_COL.select,
        minSize: CONTACT_COL.select,
        maxSize: CONTACT_COL.select,
        enableResizing: false,
        header: () => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                allContactsSelected
                  ? true
                  : selectedContactIds.size > 0
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={() => toggleAllContacts()}
              aria-label={t("contacts.selectAllAria")}
            />
          </div>
        ),
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
    [selectedContactIds, allContactsSelected, toggleAllContacts, toggleContact, t],
  );

  const groupColumns = useMemo(
    (): ColumnDef<DeletedGroupRow, unknown>[] => [
      {
        id: "select",
        size: CONTACT_COL.select,
        minSize: CONTACT_COL.select,
        maxSize: CONTACT_COL.select,
        enableResizing: false,
        header: () => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                allGroupsSelected
                  ? true
                  : selectedGroupIds.size > 0
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={() => toggleAllGroups()}
              aria-label={t("groups.selectAllAria")}
            />
          </div>
        ),
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
    [selectedGroupIds, allGroupsSelected, toggleAllGroups, toggleGroup, t],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <InputGroup
          className="max-w-sm shrink-0 bg-transparent dark:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0"
          role="search"
        >
          <InputGroupAddon align="inline-start">
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={
              tab === "contacts"
                ? t("trash.searchContacts")
                : t("trash.searchGroups")
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t("trash.searchAria")}
          />
        </InputGroup>
        <div
          className="flex shrink-0 items-center gap-1"
          role="tablist"
          aria-label={t("trash.title")}
        >
          <Button
            type="button"
            size="sm"
            role="tab"
            aria-selected={tab === "contacts"}
            variant={tab === "contacts" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => switchTab("contacts")}
          >
            {t("nav.contacts")}
          </Button>
          <Button
            type="button"
            size="sm"
            role="tab"
            aria-selected={tab === "groups"}
            variant={tab === "groups" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => switchTab("groups")}
          >
            {t("nav.groupes")}
          </Button>
        </div>
        <div className="min-w-0 flex-1" aria-hidden />
        <Button
          variant="default"
          size="lg"
          className="rounded-full"
          disabled={selectedCount === 0}
          onClick={() => setConfirmOpen(true)}
        >
          <RotateCcw aria-hidden />
          {selectedCount === 0
            ? t("trash.restore")
            : t("trash.restoreSelected", { n: selectedCount })}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="shrink-0">
          <AlertDescription className="font-bold">{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <Card size="sm" className="shrink-0">
          <CardContent className="grid min-h-[160px] place-items-center">
            <Spinner className="size-6 text-primary" />
          </CardContent>
        </Card>
      )}

      {!loading && tab === "contacts" && (
        <DataTable
          columns={contactColumns}
          data={contactRows}
          emptyMessage={t("trash.contactsEmpty")}
          searchNoResultsMessage={t("trash.noSearchResults")}
          globalFilter={query}
          minContentWidth={760}
          hasMore={contactRows.length < filteredContacts.length}
          onLoadMore={loadMoreContacts}
          onRowClick={(row) => toggleContact(row.id)}
          className={TRASH_TABLE_CLS}
          footer={t(
            filteredContacts.length === 1
              ? "contacts.footerOne"
              : "contacts.footerMany",
            { n: filteredContacts.length },
          )}
        />
      )}

      {!loading && tab === "groups" && (
        <DataTable
          columns={groupColumns}
          data={groupRows}
          emptyMessage={t("trash.groupsEmpty")}
          searchNoResultsMessage={t("trash.noSearchResults")}
          globalFilter={query}
          minContentWidth={760}
          hasMore={groupRows.length < filteredGroups.length}
          onLoadMore={loadMoreGroups}
          onRowClick={(row) => toggleGroup(row.id)}
          className={TRASH_TABLE_CLS}
          footer={t(
            filteredGroups.length === 1
              ? "groups.footerOne"
              : "groups.footerMany",
            { n: filteredGroups.length },
          )}
        />
      )}

      <TrashRestoreModal
        open={confirmOpen}
        kind={tab}
        count={selectedCount}
        onConfirm={restoreSelected}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
