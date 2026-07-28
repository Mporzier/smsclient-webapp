/** Shared list sort → PostgREST .order specs (primary + id tie-break). */

export type ListSort = { id: string; desc: boolean };

export type OrderSpec = { column: string; ascending: boolean };

export function mapSortToOrders(
  sort: ListSort | null | undefined,
  columnMap: Record<string, string>,
  defaults: OrderSpec[],
): OrderSpec[] {
  if (!sort?.id) return defaults;
  const column = columnMap[sort.id];
  if (!column) return defaults;
  const ascending = !sort.desc;
  return [
    { column, ascending },
    { column: "id", ascending },
  ];
}

/** Groups — défaut member_count desc (plus de contacts d’abord). */
export const GROUP_SORT_COLUMNS: Record<string, string> = {
  name: "name",
  description: "description",
  contactCount: "member_count",
  lastCampaignLabel: "last_campaign_at",
  createdLabel: "created_at",
};

export const GROUP_SORT_DEFAULT: OrderSpec[] = [
  { column: "member_count", ascending: false },
  { column: "id", ascending: false },
];

export function groupSortToOrders(sort: ListSort | null | undefined): OrderSpec[] {
  return mapSortToOrders(sort, GROUP_SORT_COLUMNS, GROUP_SORT_DEFAULT);
}

/** Campaigns — sendLabel désactivé UI (sent_at vs scheduled_at). */
export const CAMPAIGN_SORT_COLUMNS: Record<string, string> = {
  createdLabel: "created_at",
  name: "title",
  recipients: "recipient_count",
  status: "status",
  creditsLabel: "credits_estimated",
};

export const CAMPAIGN_SORT_DEFAULT: OrderSpec[] = [
  { column: "created_at", ascending: false },
  { column: "id", ascending: false },
];

export function campaignSortToOrders(
  sort: ListSort | null | undefined,
): OrderSpec[] {
  return mapSortToOrders(sort, CAMPAIGN_SORT_COLUMNS, CAMPAIGN_SORT_DEFAULT);
}

export const LINK_SORT_COLUMNS: Record<string, string> = {
  createdLabel: "created_at",
  label: "label",
  originalUrl: "original_url",
  shortUrl: "short_code",
  clickCount: "click_count",
};

export const LINK_SORT_DEFAULT: OrderSpec[] = [
  { column: "created_at", ascending: false },
  { column: "id", ascending: false },
];

export function linkSortToOrders(sort: ListSort | null | undefined): OrderSpec[] {
  return mapSortToOrders(sort, LINK_SORT_COLUMNS, LINK_SORT_DEFAULT);
}

export const TEMPLATE_SORT_COLUMNS: Record<string, string> = {
  createdLabel: "created_at",
  title: "title",
  description: "description",
  body: "body",
};

export const TEMPLATE_SORT_DEFAULT: OrderSpec[] = [
  { column: "created_at", ascending: false },
  { column: "id", ascending: false },
];

export function templateSortToOrders(
  sort: ListSort | null | undefined,
): OrderSpec[] {
  return mapSortToOrders(sort, TEMPLATE_SORT_COLUMNS, TEMPLATE_SORT_DEFAULT);
}

/** Factures / achats crédits. */
export const PURCHASE_SORT_COLUMNS: Record<string, string> = {
  createdLabel: "created_at",
  packLabel: "pack_label",
  amountLabel: "amount_cents",
  status: "status",
  creditsLabel: "credits",
};

export const PURCHASE_SORT_DEFAULT: OrderSpec[] = [
  { column: "created_at", ascending: false },
  { column: "id", ascending: false },
];

export function purchaseSortToOrders(
  sort: ListSort | null | undefined,
): OrderSpec[] {
  return mapSortToOrders(sort, PURCHASE_SORT_COLUMNS, PURCHASE_SORT_DEFAULT);
}
