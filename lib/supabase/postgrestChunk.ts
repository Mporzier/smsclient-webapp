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
