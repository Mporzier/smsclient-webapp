---
name: postgrest-in-chunk
description: >
  Guard PostgREST/Supabase `.in()` and bulk queries against URL-too-long 400s
  and silent max-rows truncation. Use when writing or reviewing lib/supabase/*
  queries, `.in(`, bulk delete/update/insert, or user reports Bad Request on
  large contact/group lists.
---

# postgrest-in-chunk

## Règle

Filtres `.in(...)` → query string. **> ~50 UUID** (ou valeurs longues) = **400 Bad Request**.

Helper : `lib/supabase/postgrestChunk.ts`
- `POSTGREST_IN_CHUNK` (50) — tout `.in()`
- `POSTGREST_INSERT_CHUNK` (40) — inserts multi-rows
- `POSTGREST_PAGE` (1000) — paginer selects qui peuvent dépasser max-rows
- `chunkList(items, size?)`

## Obligatoire

1. Jamais `.in("col", hugeArray)` sans chunk
2. Chunk aussi PATCH/DELETE (filtre toujours en query string)
3. Select potentiellement gros : `.range` + `.order` stable, boucle jusqu’à page courte
4. Erreur chunk → **return** error (pas `continue` silencieux)
5. Preférer `eq` / join / RPC si la liste cible est « tous les rows du user »

## Check avant ship

- [ ] Nouveau `.in(` → `chunkList` / `POSTGREST_IN_CHUNK`
- [ ] Compteurs membres groupes → paginés (pas 1 shot)
- [ ] Bulk delete/restore/resubscribe/stamp → chunkés
