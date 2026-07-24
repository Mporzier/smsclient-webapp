export type ContactListSort = { id: string; desc: boolean };

export type ContactOrderSpec = { column: string; ascending: boolean };

const NATIVE: Record<string, string> = {
  firstName: "first_name",
  lastName: "last_name",
  phone: "phone_e164",
  notes: "notes",
  lastSms: "last_sms_sent_at",
  source: "source",
  created: "created_at",
};

const SAFE_CUSTOM_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_ORDERS: ContactOrderSpec[] = [
  { column: "created_at", ascending: false },
  { column: "id", ascending: false },
];

function resolvePrimaryColumn(sortId: string): string | null {
  if (NATIVE[sortId]) return NATIVE[sortId]!;
  if (sortId.startsWith("custom_")) {
    const fieldId = sortId.slice("custom_".length);
    if (!SAFE_CUSTOM_ID.test(fieldId)) return null;
    return `custom_fields->>${fieldId}`;
  }
  return null;
}

/** Map UI SortingState[0] → PostgREST .order specs (primary + id tie-break). */
export function contactSortToOrders(
  sort: ContactListSort | null | undefined,
): ContactOrderSpec[] {
  if (!sort?.id) return DEFAULT_ORDERS;
  const column = resolvePrimaryColumn(sort.id);
  if (!column) return DEFAULT_ORDERS;
  const ascending = !sort.desc;
  return [
    { column, ascending },
    { column: "id", ascending },
  ];
}
