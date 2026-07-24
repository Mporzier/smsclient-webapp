---
title: listes lazyload design
updated: 2026-07-24
---

# Listes — lazyload (remplace pagination UI)

## Décisions

- Scope : toutes vues `DataTable` (contacts, groupes, campagnes, liens, modèles, factures).
- Search : **serveur** (debounce), reset liste.
- Sélection multiple : **lignes chargées seulement** (A).
- Pattern : infinite scroll + `.range` serveur (approche 1).
- Lot : **50** (`LIST_PAGE_SIZE`).
- Memberships contacts : uniquement IDs du lot (déjà chunkés).

## Non-goals v1

- « Sélectionner tous les N résultats » serveur.
- Virtualisation fenêtre (TanStack Virtual) — pas besoin si pages serveur.
- Commit auto.

## DataTable

- Retirer `Pager` / `getPaginationRowModel` / `pageSize`.
- Props : `hasMore`, `loadingMore`, `onLoadMore`.
- Sentinel `IntersectionObserver` en bas du scroll.
- `globalFilter` client désactivé si parent gère search serveur (`manualFiltering` / pas de filter TanStack).

## Contrats fetch

`fetchXPage(supabase, { userId?, offset, limit, search })` → `{ data, hasMore, error }`  
Optionnel `count` exact head une fois pour footer.

## Hooks

`rows`, `loading`, `loadingMore`, `hasMore`, `loadMore`, `setSearch` / `search`, `refresh`, `totalCount?`.

## Effets annexes contacts

- `unsubscribedContacts` : query dédiée (pas dérivée du lot).
- `groupOptions` : surtout `groupsState` (pas besoin de tous les contacts).
- Modales / wizard qui ont besoin de « tous » les contacts : fetch résumé séparé ou search paginé (hors liste principale).

## Perf

- Premier paint = 1 page clients + memberships du lot (<~1–2s cible).
- Pas de fetch all-clients au mount.
- Realtime contacts : reset + reload page 0 (silent).
