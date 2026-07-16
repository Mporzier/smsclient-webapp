import type { SortingState } from "@tanstack/react-table";
import { compareIsoTimestampsStable } from "@/lib/proto/compareIso";
import { formatCustomFieldDisplay } from "@/lib/customFields/validate";
import type { ContactRowData } from "@/lib/types/contact";
import type { CustomFieldDef } from "@/lib/types/customFields";

function cmpStr(a: string, b: string): number {
  return a.localeCompare(b, "fr", { sensitivity: "base", numeric: true });
}

function compareContactColumn(
  a: ContactRowData,
  b: ContactRowData,
  columnId: string,
  customFieldDefs: CustomFieldDef[],
): number {
  switch (columnId) {
    case "firstName":
      return cmpStr(a.firstName.trim(), b.firstName.trim());
    case "lastName":
      return cmpStr(a.lastName.trim(), b.lastName.trim());
    case "phone":
      return cmpStr(a.phone, b.phone);
    case "notes": {
      const an = a.notes.trim();
      const bn = b.notes.trim();
      if (!an && !bn) return 0;
      if (!an) return 1;
      if (!bn) return -1;
      return cmpStr(an, bn);
    }
    case "lastSms":
      return compareIsoTimestampsStable(
        a.lastSmsAt,
        b.lastSmsAt,
        a.id,
        b.id,
      );
    case "source":
      return cmpStr(a.source, b.source);
    case "created":
      return compareIsoTimestampsStable(a.createdAt, b.createdAt, a.id, b.id);
    default: {
      if (columnId.startsWith("custom_")) {
        const fieldId = columnId.slice("custom_".length);
        const def = customFieldDefs.find((d) => d.id === fieldId);
        const at = formatCustomFieldDisplay(
          a.customFields?.[fieldId],
          def?.fieldType ?? "text",
        ).trim();
        const bt = formatCustomFieldDisplay(
          b.customFields?.[fieldId],
          def?.fieldType ?? "text",
        ).trim();
        const aEmpty = !at || at === "—";
        const bEmpty = !bt || bt === "—";
        if (aEmpty && bEmpty) return 0;
        if (aEmpty) return 1;
        if (bEmpty) return -1;
        return cmpStr(at, bt);
      }
      return a.id.localeCompare(b.id);
    }
  }
}

/** Tri client stable pour la liste Contacts (évite quirks getSortedRowModel). */
export function sortContactRows(
  rows: ContactRowData[],
  sorting: SortingState,
  customFieldDefs: CustomFieldDef[] = [],
): ContactRowData[] {
  if (sorting.length === 0 || rows.length < 2) return rows;
  const { id, desc } = sorting[0]!;
  const dir = desc ? -1 : 1;
  return [...rows].sort((a, b) => {
    const c = compareContactColumn(a, b, id, customFieldDefs);
    if (c !== 0) return c * dir;
    return a.id < b.id ? -dir : a.id > b.id ? dir : 0;
  });
}
