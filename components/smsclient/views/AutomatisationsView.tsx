"use client";

import { AutomationEditModal } from "@/components/smsclient/modals/AutomationEditModal";
import { CatalogTab } from "@/components/smsclient/views/automatisations/CatalogTab";
import { MesAutomatisationsTab } from "@/components/smsclient/views/automatisations/MesAutomatisationsTab";
import { Button } from "@/components/ui/button";
import type {
  AutomationPresetKey,
  AutomationRowData,
  AutomationSavePayload,
} from "@/lib/types/automation";
import type { ContactRowData } from "@/lib/types/contact";
import { useMemo, useState } from "react";

export type AutomatisationsViewProps = {
  rows: AutomationRowData[];
  contacts: ContactRowData[];
  loading: boolean;
  error: string | null;
  onSave: (payload: AutomationSavePayload) => Promise<void>;
};

type TabId = "mes" | "catalogue";

export function AutomatisationsView({
  rows,
  contacts,
  loading,
  error,
  onSave,
}: AutomatisationsViewProps) {
  const [editRow, setEditRow] = useState<AutomationRowData | null>(null);
  const [tab, setTab] = useState<TabId>("mes");
  const [tabReady, setTabReady] = useState(false);
  const activeCount = useMemo(
    () => rows.filter((r) => r.enabled).length,
    [rows],
  );

  if (!loading && !tabReady) {
    setTabReady(true);
    setTab(activeCount > 0 ? "mes" : "catalogue");
  }

  function handleConfigureFromCatalog(presetKey: AutomationPresetKey) {
    const row = rows.find((r) => r.presetKey === presetKey);
    if (row) setEditRow(row);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Automatisations"
      >
        <Button
          type="button"
          size="sm"
          variant={tab === "mes" ? "default" : "outline"}
          role="tab"
          aria-selected={tab === "mes"}
          onClick={() => setTab("mes")}
        >
          Mes automatisations
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "catalogue" ? "default" : "outline"}
          role="tab"
          aria-selected={tab === "catalogue"}
          onClick={() => setTab("catalogue")}
        >
          Catalogue
        </Button>
      </div>

      {tab === "mes" ? (
        <MesAutomatisationsTab
          rows={rows}
          contacts={contacts}
          loading={loading}
          error={error}
          onSave={onSave}
          onEdit={setEditRow}
        />
      ) : (
        <CatalogTab onConfigure={handleConfigureFromCatalog} />
      )}

      <AutomationEditModal
        open={editRow != null}
        row={editRow}
        onClose={() => setEditRow(null)}
        onSave={onSave}
      />
    </div>
  );
}
