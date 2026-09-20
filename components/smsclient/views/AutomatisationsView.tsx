"use client";

import { AutomationCatalogModal } from "@/components/smsclient/modals/AutomationCatalogModal";
import { AutomationIntegrationsModal } from "@/components/smsclient/modals/AutomationIntegrationsModal";
import { AutomationEditModal } from "@/components/smsclient/modals/AutomationEditModal";
import { CreateAutomationModal } from "@/components/smsclient/modals/CreateAutomationModal";
import { ActiveAutomationsTable } from "@/components/smsclient/views/automatisations/ActiveAutomationsTable";
import { AutomationQuickActions } from "@/components/smsclient/views/automatisations/AutomationQuickActions";
import type {
  AutomationPresetKey,
  AutomationRowData,
  AutomationSavePayload,
} from "@/lib/types/automation";
import type { ContactRowData } from "@/lib/types/contact";
import type { CustomFieldDef } from "@/lib/types/customFields";
import { useMemo, useState } from "react";

export type AutomatisationsViewProps = {
  rows: AutomationRowData[];
  contacts: ContactRowData[];
  customFieldDefs?: CustomFieldDef[];
  loading: boolean;
  error: string | null;
  onSave: (payload: AutomationSavePayload) => Promise<void>;
};

export function AutomatisationsView({
  rows,
  contacts,
  customFieldDefs = [],
  error,
  onSave,
}: AutomatisationsViewProps) {
  const [editRow, setEditRow] = useState<AutomationRowData | null>(null);
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [integrationsModalOpen, setIntegrationsModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const enabledPresetKeys = useMemo(
    () =>
      new Set(
        rows
          .filter((r) => r.enabled && r.presetKey)
          .map((r) => r.presetKey as AutomationPresetKey),
      ),
    [rows],
  );

  function handleConfigureFromCatalog(presetKey: AutomationPresetKey) {
    const row = rows.find((r) => r.presetKey === presetKey);
    if (row) setEditRow(row);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
          {error}
          <p className="mt-1 text-xs font-semibold text-rose-800">
            Applique la migration Supabase{" "}
            <code className="rounded bg-rose-100 px-1">
              20260528160000_sms_automations.sql
            </code>{" "}
            et{" "}
            <code className="rounded bg-rose-100 px-1">
              20260910120000_sms_automations_custom.sql
            </code>{" "}
            si besoin.
          </p>
        </div>
      )}

      <ActiveAutomationsTable
        rows={rows}
        onEdit={setEditRow}
        onCreate={() => setCreateModalOpen(true)}
      />

      <AutomationQuickActions
        className="shrink-0"
        onActivate={() => setCatalogModalOpen(true)}
        onCreate={() => setCreateModalOpen(true)}
        onConnectTool={() => setIntegrationsModalOpen(true)}
      />

      <AutomationCatalogModal
        open={catalogModalOpen}
        enabledPresetKeys={enabledPresetKeys}
        onClose={() => setCatalogModalOpen(false)}
        onConfigure={handleConfigureFromCatalog}
      />

      <AutomationIntegrationsModal
        open={integrationsModalOpen}
        onClose={() => setIntegrationsModalOpen(false)}
      />

      <CreateAutomationModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={onSave}
        contacts={contacts}
        customFieldDefs={customFieldDefs}
      />

      <AutomationEditModal
        open={editRow != null}
        row={editRow}
        onClose={() => setEditRow(null)}
        onSave={onSave}
        contacts={contacts}
        customFieldDefs={customFieldDefs}
      />
    </div>
  );
}
