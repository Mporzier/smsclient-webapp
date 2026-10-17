"use client";

import {
  ListEmptyIntroBanner,
  shouldShowListEmptyIntro,
} from "@/components/smsclient/ListEmptyIntroBanner";
import { useShellHelpActions } from "@/components/smsclient/shell/ShellHeaderTitleContext";
import {
  LIST_VIEW_SEARCH_INPUT_CLASS,
  LIST_VIEW_STACK_CLASS,
  LIST_VIEW_TOOLBAR_BUTTON_SIZE,
  LIST_VIEW_TOOLBAR_CLASS,
} from "@/components/smsclient/listViewLayout";
import { DataTable } from "@/components/smsclient/DataTable";
import { DataTableColumnFilter } from "@/components/smsclient/DataTableColumnFilter";
import { ListFilterChips } from "@/components/smsclient/ListFilterChips";
import {
  AUTOMATION_COL,
  LINK_COL,
  listColFixed,
} from "@/components/smsclient/listColumnSizes";
import { CellTruncate } from "@/components/smsclient/ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  AUTOMATION_CATALOG,
  primaryTagForDisplay,
} from "@/lib/automations/catalog";
import { normalizeListFilters } from "@/lib/proto/listFilters";
import { rowMatchesListFilters } from "@/lib/proto/listRowFilters";
import { automationColumnFilterKind } from "@/lib/proto/listFilterUi";
import type { AutomationRowData } from "@/lib/types/automation";
import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Plus, Search, Zap } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

const TAG_LABEL: Record<string, string> = {
  calendrier: "Calendrier",
  fidelisation: "Fidélisation",
  promo: "Promo",
};

function activityLabel(row: AutomationRowData): string {
  const catalog = AUTOMATION_CATALOG.find((a) => a.id === row.presetKey);
  const tag = catalog ? primaryTagForDisplay(catalog) : undefined;
  if (tag) return TAG_LABEL[tag] ?? tag;
  if (row.kind === "birthday") return "Anniversaire";
  if (row.kind === "recurring") return "Récurrent";
  return "Date fixe";
}

function triggerLabel(row: AutomationRowData): string {
  return `${row.scheduleLabel} · ${row.sendTime}`;
}

export type ActiveAutomationsTableProps = {
  rows: AutomationRowData[];
  loading?: boolean;
  onEdit: (row: AutomationRowData) => void;
  onCreate: () => void;
};

export function ActiveAutomationsTable({
  rows,
  loading = false,
  onEdit,
  onCreate,
}: ActiveAutomationsTableProps) {
  const { openHelp } = useShellHelpActions();
  const [listIntroDismissed, setListIntroDismissed] = useState(false);
  const [query, setQuery] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const filterLabels = useMemo(
    () => ({
      name: "Automatisation",
      trigger: "Déclenchement",
      activity: "Activité",
    }),
    [],
  );

  const hasActiveFilters = normalizeListFilters(columnFilters).length > 0;

  const renderColumnFilter = useCallback(
    (columnId: string) => {
      const kind = automationColumnFilterKind(columnId);
      if (!kind) return null;
      return (
        <DataTableColumnFilter
          columnId={columnId}
          columnLabel={
            filterLabels[columnId as keyof typeof filterLabels] ?? columnId
          }
          kind={kind}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />
      );
    },
    [columnFilters, filterLabels],
  );

  const activeRows = useMemo(
    () => rows.filter((r) => r.enabled),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activeRows.filter((row) => {
      if (q) {
        const hay = [row.name, triggerLabel(row), activityLabel(row)]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return rowMatchesListFilters(row, columnFilters, (columnId, r) => {
        if (columnId === "name") return { kind: "text", value: r.name };
        if (columnId === "trigger") {
          return { kind: "text", value: triggerLabel(r) };
        }
        if (columnId === "activity") {
          return { kind: "text", value: activityLabel(r) };
        }
        return null;
      });
    });
  }, [activeRows, query, columnFilters]);

  const columns = useMemo<ColumnDef<AutomationRowData, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Automatisation",
        size: AUTOMATION_COL.name,
        cell: ({ getValue }) => (
          <CellTruncate as="div" className="font-semibold text-foreground">
            {getValue<string>()}
          </CellTruncate>
        ),
      },
      {
        id: "trigger",
        header: "Déclenchement",
        size: AUTOMATION_COL.trigger,
        accessorFn: (row) => triggerLabel(row),
        cell: ({ getValue }) => (
          <CellTruncate as="div" className="text-muted-foreground">
            {getValue<string>()}
          </CellTruncate>
        ),
      },
      {
        id: "activity",
        header: "Activité",
        size: AUTOMATION_COL.activity,
        accessorFn: (row) => activityLabel(row),
        cell: ({ getValue }) => (
          <span className="text-sm font-semibold text-foreground">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: "status",
        header: "Statut",
        size: AUTOMATION_COL.status,
        cell: () => (
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
            Active
          </span>
        ),
      },
      {
        id: "lastActivity",
        header: "Dernière activité",
        size: AUTOMATION_COL.lastActivity,
        cell: () => (
          <span className="text-sm text-muted-foreground">—</span>
        ),
      },
      {
        id: "actions",
        ...listColFixed(LINK_COL.actions),
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
                  aria-label={`Actions pour ${row.original.name}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => onEdit(row.original)}>
                  <Pencil aria-hidden />
                  Modifier
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onEdit],
  );

  const emptyState = (
    <Empty className="p-0 md:p-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Zap aria-hidden />
        </EmptyMedia>
        <EmptyTitle>Aucune automatisation active</EmptyTitle>
        <EmptyDescription>
          Programmez des envois SMS automatiques (rappels, fidélisation, dates
          clés). Ajoutez une automatisation pour la retrouver dans cette liste
          une fois activée.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          type="button"
          variant="default"
          className="rounded-full"
          onClick={onCreate}
        >
          <Plus aria-hidden />
          Créer une automatisation
        </Button>
      </EmptyContent>
    </Empty>
  );

  const n = filteredRows.length;
  const footer = n === 1 ? "1 automatisation" : `${n} automatisations`;

  const showListIntro = shouldShowListEmptyIntro({
    loading,
    dataLength: activeRows.length,
    searchQuery: query,
    dismissed: listIntroDismissed,
  });

  return (
    <section className={LIST_VIEW_STACK_CLASS}>
      {showListIntro ? (
        <ListEmptyIntroBanner
          section="automatisations"
          onLearnMore={openHelp}
          onDismiss={() => setListIntroDismissed(true)}
        />
      ) : null}

      <div className={LIST_VIEW_TOOLBAR_CLASS}>
        <InputGroup className={LIST_VIEW_SEARCH_INPUT_CLASS} role="search">
          <InputGroupAddon align="inline-start">
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Rechercher une automatisation…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Rechercher une automatisation active"
          />
        </InputGroup>
        <div className="min-w-0 flex-1" aria-hidden />
        <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="default"
            size={LIST_VIEW_TOOLBAR_BUTTON_SIZE}
            className="rounded-full"
            onClick={onCreate}
          >
            <Plus aria-hidden />
            Créer une automatisation
          </Button>
        </div>
      </div>
      <ListFilterChips
        filters={columnFilters}
        labels={filterLabels}
        onClearId={(id) => {
          setColumnFilters((prev) => prev.filter((f) => f.id !== id));
        }}
        onClearAll={() => setColumnFilters([])}
      />
      <DataTable
        columns={columns}
        data={filteredRows}
        loading={loading}
        emptyMessage={emptyState}
        searchNoResultsMessage="Aucun résultat pour cette recherche."
        globalFilter={query}
        onRowClick={onEdit}
        className="min-h-0 flex-1"
        footer={footer}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        manualFiltering
        hasActiveFilters={hasActiveFilters}
        renderColumnFilter={renderColumnFilter}
      />
    </section>
  );
}
