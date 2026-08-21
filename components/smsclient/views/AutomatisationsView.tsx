"use client";

import { AutomationEditModal } from "@/components/smsclient/modals/AutomationEditModal";
import { ActiveAutomationsTable } from "@/components/smsclient/views/automatisations/ActiveAutomationsTable";
import { CatalogTab } from "@/components/smsclient/views/automatisations/CatalogTab";
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

export function AutomatisationsView({
  rows,
  error,
  onSave,
}: AutomatisationsViewProps) {
  const [editRow, setEditRow] = useState<AutomationRowData | null>(null);

  const enabledPresetKeys = useMemo(
    () => new Set(rows.filter((r) => r.enabled).map((r) => r.presetKey)),
    [rows],
  );

  function handleConfigureFromCatalog(presetKey: AutomationPresetKey) {
    const row = rows.find((r) => r.presetKey === presetKey);
    if (row) setEditRow(row);
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
          {error}
          <p className="mt-1 text-xs font-semibold text-rose-800">
            Applique la migration Supabase{" "}
            <code className="rounded bg-rose-100 px-1">
              20260528160000_sms_automations.sql
            </code>{" "}
            si la table n&apos;existe pas encore.
          </p>
        </div>
      )}

      <ActiveAutomationsTable rows={rows} onEdit={setEditRow} />

      <CatalogTab
        enabledPresetKeys={enabledPresetKeys}
        onConfigure={handleConfigureFromCatalog}
      />

      <AutomationEditModal
        open={editRow != null}
        row={editRow}
        onClose={() => setEditRow(null)}
        onSave={onSave}
      />
    </div>
  );
}
