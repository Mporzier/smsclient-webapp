import type { ColumnDef } from "@tanstack/react-table";
import type { ColumnFilterKind } from "@/lib/proto/listFilterUi";

/** Colonnes jamais masquables (toolbar Colonnes). */
export const LIST_COLUMN_PINNED_IDS = new Set([
  "select",
  "actions",
  "avatar",
  "icon",
]);

export function listColumnDefId<T>(
  col: ColumnDef<T, unknown>,
): string | undefined {
  if (col.id) return col.id;
  if ("accessorKey" in col && col.accessorKey != null) {
    return String(col.accessorKey);
  }
  return undefined;
}

export type ListColumnFilterSpec = {
  columnId: string;
  columnLabel: string;
  kind: ColumnFilterKind;
};

export function buildListFilterSpecs(
  columnIds: string[],
  labels: Record<string, string>,
  kindOf: (id: string) => ColumnFilterKind | null | undefined,
): ListColumnFilterSpec[] {
  return columnIds.flatMap((columnId) => {
    const kind = kindOf(columnId);
    if (!kind) return [];
    return [
      {
        columnId,
        columnLabel: labels[columnId] ?? columnId,
        kind,
      },
    ];
  });
}

export function buildListColumnToggleOptions<T>(
  columns: ColumnDef<T, unknown>[],
  labels: Record<string, string>,
): { id: string; label: string }[] {
  return columns.flatMap((col) => {
    const id = listColumnDefId(col);
    if (!id || LIST_COLUMN_PINNED_IDS.has(id)) return [];
    if (col.enableHiding === false) return [];
    const label = labels[id]?.trim();
    if (!label) return [];
    return [{ id, label }];
  });
}
