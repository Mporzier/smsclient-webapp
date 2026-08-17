/** Escape ILIKE wildcards / backslash for PostgREST filters. */
export function escapeIlike(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

type WithOr<T> = { or: (filters: string) => T };

/**
 * Same search as `fetchClientsPage` / picker pages:
 * first_name, last_name, phone_e164, group_label ILIKE.
 */
export function applyClientListSearch<T extends WithOr<T>>(
  query: T,
  search: string,
): T {
  const q = search.trim();
  if (!q) return query;
  const safe = escapeIlike(q);
  const pattern = `%${safe}%`;
  const p = `"${pattern.replace(/"/g, '\\"')}"`;
  return query.or(
    [
      `first_name.ilike.${p}`,
      `last_name.ilike.${p}`,
      `phone_e164.ilike.${p}`,
      `group_label.ilike.${p}`,
    ].join(","),
  );
}
