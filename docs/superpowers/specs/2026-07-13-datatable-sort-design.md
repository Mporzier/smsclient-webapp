---
title: DataTable — tri colonnes
date: 2026-07-13
status: approved
---

# DataTable — tri colonnes (design)

## Contexte

Les listes produit (Contacts, Groupes, Campagnes, Modèles SMS, Liens, Factures) passent par `components/smsclient/DataTable.tsx` (TanStack Table). Filtre global + pagination client existent ; **pas de tri**.

Design system L2 : « tri colonnes UI ».

## Décisions

| Choix | Décision |
|-------|----------|
| Périmètre | Toutes les DataTable |
| Interaction | Clic header : none → asc → desc → none |
| Multi-colonne | Non (une seule colonne à la fois) |
| Persistance | **Non** — pas d’URL, pas de `localStorage`, pas de storage. État React local seulement (perdu au unmount / navigation) |
| Lieu | Central dans `DataTable` (approche A) |
| Tri serveur | Hors scope |

## Comportement

1. Clic sur un header **triable** cycle : aucun tri → croissant → décroissant → aucun.
2. Clic sur une autre colonne remplace le tri courant.
3. Ordre pipeline TanStack : filtre → **tri** → pagination.
4. Colonnes non triables par défaut (ids) : `select`, `actions`, `avatar`. Une vue peut forcer `enableSorting: false` / `true` sur une `ColumnDef`.
5. Poignée de resize : `stopPropagation` déjà en place — ne déclenche pas le tri.
6. Accessibilité : `aria-sort` (`none` | `ascending` | `descending`) sur le `<th>` ; zone cliquable focusable au clavier.

## UI

- Label existant conservé.
- Icône Lucide à droite du label :
  - non trié : `ArrowUpDown` (discret)
  - asc : `ArrowUp`
  - desc : `ArrowDown`
- `cursor-pointer` + hover léger sur le header triable.
- Headers non triables : pas d’icône, pas de clic tri.

## Implémentation (cible)

Fichier principal : `components/smsclient/DataTable.tsx`

- Imports : `getSortedRowModel`, `SortingState`.
- État local `useState<SortingState>([])` + `onSortingChange`.
- `useReactTable` : `state: { globalFilter, sorting }`, `getSortedRowModel()`, `enableSorting: true`, `enableMultiSort: false`, `enableSortingRemoval: true`.
- Header : wrapper cliquable → `header.column.getToggleSortingHandler()`.
- Helper colonnes : `enableSorting: false` si `id` ∈ `{ select, actions, avatar }` sauf override.

Vues : **pas de changement obligatoire**. Vérifier rapidement colonnes sans valeur triable — désactiver si nonsense.

## Hors scope

- Checkbox shadcn (autre moitié L2)
- Virtualisation (L3)
- Tri côté Supabase / `order=`
- Persistance URL / `localStorage` / session
- Tri dans `ImportContactsModal` (aperçu CSV)

## Vérif manuelle

```bash
pnpm build
```

Tester : Contacts — clic Prénom / Nom / Date ; cycle + pagination ; Groupes + Campagnes smoke ; select/actions non triables. Recharger / quitter la vue = tri perdu (attendu).
