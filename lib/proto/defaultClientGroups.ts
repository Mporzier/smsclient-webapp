/** Noms créés à l'inscription — voir `create_default_client_groups_for_new_user`. */
export const DEFAULT_CLIENT_GROUP_NAMES = [
  "Prospects",
  "Clients",
  "Clients VIP",
] as const;

export type DefaultClientGroupName =
  (typeof DEFAULT_CLIENT_GROUP_NAMES)[number];

export function isDefaultClientGroupsOnly(
  rows: { name: string }[],
  options?: {
    totalCount?: number | null;
    hasMore?: boolean;
  },
): boolean {
  const expected = DEFAULT_CLIENT_GROUP_NAMES.length;

  if (typeof options?.totalCount === "number") {
    if (options.totalCount !== expected) return false;
  } else if (options?.hasMore) {
    return false;
  }

  if (rows.length !== expected) return false;

  const names = new Set(rows.map((r) => r.name.trim()));
  if (names.size !== expected) return false;

  for (const name of DEFAULT_CLIENT_GROUP_NAMES) {
    if (!names.has(name)) return false;
  }
  return true;
}
