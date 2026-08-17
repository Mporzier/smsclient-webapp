/**
 * PostgREST met les filtres `.in()` dans la query string (GET/PATCH/DELETE).
 * Trop de valeurs → URL trop longue → HTTP 400 Bad Request.
 * UUIDs ~36 chars : rester ≤ ~50 par requête.
 */
export const POSTGREST_IN_CHUNK = 50;

/** Lots d’insert body (moins strict que l’URL, mais garde payload raisonnable). */
export const POSTGREST_INSERT_CHUNK = 40;

/** Page rows quand un select peut dépasser le max-rows PostgREST (~1000). */
export const POSTGREST_PAGE = 1000;

/** Taille d’un lot liste (lazyload / infinite scroll). */
export const LIST_PAGE_SIZE = 50;

export function chunkList<T>(
  items: readonly T[],
  size: number = POSTGREST_IN_CHUNK,
): T[][] {
  if (items.length === 0) return [];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size) as T[]);
  }
  return out;
}

/**
 * Pagination ids-safe : avance de `page.length`, stop seulement sur page vide.
 * `pageSize` défaut = LIST_PAGE_SIZE (50) pour coller au max-rows fréquent.
 * Ne pas utiliser un pageSize > max-rows serveur avec un break `length < pageSize`
 * (faux « fin » après la 1re page).
 */
export async function paginateRange<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => Promise<{ data: T[] | null; error: { message: string } | null }>,
  pageSize: number = LIST_PAGE_SIZE,
): Promise<{ data: T[]; error: Error | null }> {
  const out: T[] = [];
  let from = 0;
  for (let guard = 0; guard < 10_000; guard++) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) {
      // Garde le partiel si déjà des pages — l’appelant décide.
      if (out.length > 0) {
        return { data: out, error: new Error(error.message) };
      }
      return { data: [], error: new Error(error.message) };
    }
    const page = data ?? [];
    if (page.length === 0) break;
    out.push(...page);
    from += page.length;
  }
  return { data: out, error: null };
}
