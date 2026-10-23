import type { VisibilityState } from "@tanstack/react-table";

/** Clés listes persistées (toolbar Colonnes). */
export type ListColumnPrefsKey =
  | "contacts"
  | "groupes"
  | "campagnes"
  | "liens"
  | "modeles-sms"
  | "automatisations";

export type ListColumnVisibilityStore = Partial<
  Record<ListColumnPrefsKey, VisibilityState>
>;

/** Ne garde que les entrées `false` (colonnes masquées). */
export function normalizeListColumnVisibility(
  visibility: VisibilityState,
): VisibilityState {
  const out: VisibilityState = {};
  for (const [id, value] of Object.entries(visibility)) {
    if (value === false) out[id] = false;
  }
  return out;
}

const CACHE_PREFIX = "smsclient:list-column-visibility:";

export function listColumnVisibilityCacheStorageKey(
  userId: string,
  listKey: ListColumnPrefsKey,
): string {
  return `${CACHE_PREFIX}${userId}:${listKey}`;
}

export function readListColumnVisibilityCache(
  userId: string,
  listKey: ListColumnPrefsKey,
): VisibilityState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(
      listColumnVisibilityCacheStorageKey(userId, listKey),
    );
    if (!raw) return {};
    return normalizeListColumnVisibility(JSON.parse(raw) as VisibilityState);
  } catch {
    return {};
  }
}

export function writeListColumnVisibilityCache(
  userId: string,
  listKey: ListColumnPrefsKey,
  visibility: VisibilityState,
): void {
  if (typeof window === "undefined") return;
  try {
    const normalized = normalizeListColumnVisibility(visibility);
    localStorage.setItem(
      listColumnVisibilityCacheStorageKey(userId, listKey),
      JSON.stringify(normalized),
    );
  } catch {
    /* quota / private mode */
  }
}

export function parseListColumnVisibilityStore(
  raw: unknown,
): ListColumnVisibilityStore {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: ListColumnVisibilityStore = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const vis: VisibilityState = {};
    for (const [colId, hidden] of Object.entries(value)) {
      if (hidden === false) vis[colId] = false;
    }
    out[key as ListColumnPrefsKey] = vis;
  }
  return out;
}
