"use client";

import { DataTable } from "@/components/smsclient/DataTable";
import { CellTruncate } from "@/components/smsclient/ui";
import { Button } from "@/components/ui/button";
import {
  Empty,
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
import type { AutomationRowData } from "@/lib/types/automation";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Search, Zap } from "lucide-react";
import { useMemo, useState } from "react";

const TAG_LABEL: Record<string, string> = {
  promo: "Promo",
  api: "API",
  fidelisation: "Fidélisation",
  acquisition: "Acquisition",
  calendrier: "Calendrier",
  cadeau: "Cadeau",
};

function activityLabel(row: AutomationRowData): string {
  const catalog = AUTOMATION_CATALOG.find((a) => a.id === row.presetKey);
  const tag = catalog ? primaryTagForDisplay(catalog) : undefined;
  if (tag) return TAG_LABEL[tag] ?? tag;
  return row.kind === "birthday" ? "Anniversaire" : "Date fixe";
}

function triggerLabel(row: AutomationRowData): string {
  return `${row.scheduleLabel} · ${row.sendTime}`;
}

export type ActiveAutomationsTableProps = {
  rows: AutomationRowData[];
  onEdit: (row: AutomationRowData) => void;
};

export function ActiveAutomationsTable({
  rows,
  onEdit,
}: ActiveAutomationsTableProps) {
  const [query, setQuery] = useState("");

  const activeRows = useMemo(
    () => rows.filter((r) => r.enabled),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeRows;
    return activeRows.filter((row) => {
      const hay = [
        row.name,
        triggerLabel(row),
        activityLabel(row),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [activeRows, query]);

  const columns = useMemo<ColumnDef<AutomationRowData, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Automatisation",
        size: 180,
        cell: ({ getValue }) => (
          <CellTruncate as="div" className="font-semibold text-foreground">
            {getValue<string>()}
          </CellTruncate>
        ),
      },
      {
        id: "trigger",
        header: "Déclenchement",
        size: 260,
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
        size: 140,
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
        size: 110,
        cell: () => (
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
            Active
          </span>
        ),
      },
      {
        id: "lastActivity",
        header: "Dernière activité",
        size: 150,
        cell: () => (
          <span className="text-sm text-muted-foreground">—</span>
        ),
      },
    ],
    [],
  );

  const emptyState = (
    <Empty className="gap-2 p-0 md:p-0">
      <EmptyHeader className="gap-1">
        <EmptyMedia variant="icon" className="mb-0 size-8 [&_svg:not([class*='size-'])]:size-4">
          <Zap aria-hidden />
        </EmptyMedia>
        <EmptyTitle className="text-sm">Aucune automatisation active</EmptyTitle>
        <EmptyDescription className="text-xs">
          Configurez une automatisation du catalogue ci-dessous pour
          l&apos;afficher ici.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );

  const n = filteredRows.length;
  const footer = n === 1 ? "1 automatisation" : `${n} automatisations`;

  return (
    <section className="flex shrink-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <InputGroup
          className="max-w-sm shrink-0 bg-transparent dark:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0"
          role="search"
        >
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
            size="lg"
            className="rounded-full"
            onClick={() => {
              document
                .getElementById("automatisations-disponibles")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <Plus aria-hidden />
            Créer une automatisation
          </Button>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredRows}
        emptyMessage={emptyState}
        searchNoResultsMessage="Aucun résultat pour cette recherche."
        globalFilter={query}
        clipHorizontalOverflow
        onRowClick={onEdit}
        className="flex-none"
        emptyRowClassName="py-4"
        footer={footer}
      />
    </section>
  );
}
