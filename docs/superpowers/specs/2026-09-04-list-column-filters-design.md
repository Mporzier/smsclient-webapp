---
title: Listes — filtres colonnes (contacts + groupes)
date: 2026-09-04
status: approved
---

# Listes — filtres colonnes (design)

## Contexte

`DataTable` (TanStack) a déjà search serveur (`useInfiniteList`) et tri serveur contrôlé (`sorting` / `manualSorting`). Le prop `globalFilter` ne sert qu’au message vide — `getFilteredRowModel` n’est pas branché. Un `filterFn` mort existe sur la colonne `groups` de Contacts.

Filtre client = faux sur listes lazy (buffer chargé seulement). Même contrainte que le tri : appliquer **côté serveur**, même pattern.

Specs liées :

- Tri UI : `2026-07-13-datatable-sort-design.md`
- Tri serveur + lazy : `2026-07-24-contacts-server-sort-lazy-design.md`
- Select-all : `2026-08-08-campaign-select-all-design.md`

## Décisions

| Choix | Décision |
|-------|----------|
| Approche | **A** — `columnFilters` contrôlés, comme le tri |
| Filtre client TanStack | Non (`manualFiltering: true`, pas de `getFilteredRowModel`) |
| Combinaison colonnes | **AND** |
| Multi-valeurs dans une colonne | **OR** (`in` / `isMemberOf`) |
| Search barre | Inchangé ; **AND** avec les filtres colonnes |
| Périmètre UI | `ContactsView` + `GroupesView` |
| Autres DataTable | Pas d’UI filtre v1 (API fetch ignore `filters` si absent) |
| Persistance | Non (état React local, comme le tri) |
| Query builder / OR entre colonnes / vues sauvées | Hors scope |
| Wizard / GroupModal | Pas d’UI filtre v1 ; signatures fetch restent rétrocompatibles |

## Contrat DataTable

Même forme que le tri :

```ts
columnFilters?: ColumnFiltersState;
onColumnFiltersChange?: (updater: SetStateAction<ColumnFiltersState>) => void;
manualFiltering?: boolean; // true sur Contacts / Groupes
```

`useReactTable` : `state.columnFilters` + `onColumnFiltersChange`. Pas de `getFilteredRowModel`.

Colonnes **non filtrables** (comme non triables) : `select`, `actions`, `avatar`.

`globalFilter` reste le flag empty-vs-search-empty. Empty-state « aucun résultat » si search **ou** au moins un filtre actif et `data.length === 0`.

Reset liste (offset 0) + reset sélection (select-all) quand `columnFilters` change — même règle que search aujourd’hui.

## Valeur d’un filtre

TanStack `ColumnFiltersState` : `{ id, value }[]`.

```ts
type ListFilterValue = {
  op: ListFilterOp;
  value?: string | string[] | { from: string; to: string };
};
```

`isEmpty` / `isNotEmpty` / `hasNoGroup` / `hasAnyGroup` : `value` ignoré.

Ids colonnes = ids de tri existants (`firstName`, `custom_<uuid>`, `createdLabel`, …).

## Opérateurs

### Texte

Colonnes : contacts `firstName` `lastName` `phone` `notes` ; perso `text` ; groupes `name` `description`. Source a aussi ces ops.

| op | PostgREST |
|----|-----------|
| `contains` | `ILIKE %v%` (`escapeIlike`) |
| `notContains` | `NOT ILIKE %v%` |
| `equals` | `eq` après trim — **casse exacte** |
| `notEquals` | `neq` **ou** vide/null (une ligne vide « n’est pas » la valeur) |
| `startsWith` | `ILIKE v%` |
| `isEmpty` | `is.null` OR `eq.` (string vide) |
| `isNotEmpty` | inverse |

`notContains` : inclut vide/null (coalesce / OR `isEmpty`). Une ligne sans texte « ne contient pas » la valeur.

### Source (facet + texte)

Ops texte ci-dessus **plus** :

| op | PostgREST |
|----|-----------|
| `in` | `.in("source", values)` — OR interne |
| `notIn` | `.not("source", "in", values)` |

Valeurs facet = distinct `source` du compte (query légère, pas le buffer table).

### Groupes (colonne contacts)

Pas d’ILIKE sur `group_label`. Membership via `client_group_members`.

| op | Sens |
|----|------|
| `isMemberOf` | membre d’**au moins un** des ids (OR) |
| `isNotMemberOf` | membre d’aucun des ids |
| `hasNoGroup` | aucune membership |
| `hasAnyGroup` | ≥1 membership |

`.in()` groupé par chunks (`postgrest-in-chunk`) si beaucoup d’ids.

### Dates

Colonnes : contacts `created` (`created_at`), `lastSms` (`last_sms_sent_at`) ; perso `date` ; groupes `createdLabel` (`created_at`), `lastCampaignLabel` (`last_campaign_at`).

| op | Sens |
|----|------|
| `on` | jour civil `[00:00, +1j)` |
| `before` | `<` début du jour |
| `after` | `≥` lendemain 00:00 (strict après le jour) ou `>` fin de jour — un seul sens, documenté à l’implémentation : **après = `>` fin du jour choisi** |
| `between` | `{ from, to }` inclus jours civils |
| `isEmpty` / `isNotEmpty` | null / non-null |

Presets UI (expand côté apply, pas un op serveur) : `today` · `last7` · `last30` · `thisMonth` → `on` / `between`.

Timezone : locale user (même convention que `formatFrDate` / affichage liste).

### Nombres

Colonnes : groupes `contactCount` ; perso `number`.

| op | Sens |
|----|------|
| `eq` `neq` `gt` `gte` `lt` `lte` | compare numérique |
| `between` | `{ from, to }` inclus |
| `isEmpty` / `isNotEmpty` | vide / non vide |

Perso number/date : valeurs JSONB **string**. Compare via cast SQL. Si PostgREST ne permet pas le cast proprement → **une RPC** `filter_clients_page` (ou clause dans RPC existante), pas de filtre client.

### lastSms hybride

Un popover, **deux** entrées `columnFilters` (AND) :

| id | Cible |
|----|--------|
| `lastSms` | ops date sur `last_sms_sent_at` |
| `lastSmsBody` | `contains` / `isEmpty` / `isNotEmpty` sur `last_sms_body` |

`lastSmsBody` n’est pas une colonne visible.

## UI

- Icône filtre dans chaque header filtrable (`ListFilter`), `stopPropagation` — le clic label continue de trier.
- Popover : select op + input (texte / nombre / date / multi-select groupes ou sources). Presets date en raccourcis.
- Icône accent si filtre actif sur la colonne.
- Rangée de **chips** sous la barre search : `Colonne : op valeur` + clear un / clear tous.
- Pas de 2e rangée d’inputs (champs perso + scroll horizontal).

i18n : clés `listFilter.*` (ops, presets, chips, empty, aria).

## Pipeline serveur

Search existant (`applyClientListSearch` / équivalent groupes) **puis** AND des clauses filtre.

Étendre `FetchPageFn` / `useInfiniteList` :

```ts
filters?: ColumnFiltersState;
```

`filters` dans les deps de reset, comme `search` / `sort`.

Appliquer partout où search s’applique déjà pour ces deux listes :

- `fetchClientsPage` / `fetchGroupsPage`
- count + fetch ids select-all (`fetchEligibleClientIds`, `fetchMatchingGroupIds`, et callbacks `onCountSelectableMatches` / `onFetchSelectableMatchIds`)

Signatures match-all : `(search: string, filters?: ColumnFiltersState)`. Absent / `[]` = pas de clause filtre (wizard / GroupModal inchangés).

Helpers testables (miroir `contactSort.ts`) :

- `lib/proto/listFilters.ts` — types + normalize / presets → intervalle
- `lib/supabase/clientListFilters.ts` — apply PostgREST clients
- `lib/supabase/groupListFilters.ts` — apply PostgREST groupes

Filtre id inconnu ou value vide (sauf ops sans value) → ignore la clause, pas d’erreur.

## Fichiers (cible)

- `components/smsclient/DataTable.tsx`
- `components/smsclient/DataTableColumnFilter.tsx` (nouveau — popover header)
- `components/smsclient/ListFilterChips.tsx` (nouveau)
- `lib/proto/listFilters.ts` (nouveau)
- `lib/supabase/clientListFilters.ts` / `groupListFilters.ts` (nouveaux)
- `lib/supabase/clients.ts` / `groups.ts`
- `hooks/useInfiniteList.ts` / `useContacts.ts` / `useGroups.ts`
- `views/ContactsView.tsx` / `GroupesView.tsx`
- `prototypeApp/routes/audienceRoutes.tsx` + `PrototypeAppModals.tsx` (signatures match-all)
- `lib/i18n/messages.ts`
- `tests/unit/` apply + normalize filtres
- RPC SQL seulement si cast JSONB/number bloqué

Retirer le `filterFn` mort colonne `groups` (remplacé par membership serveur).

## Hors scope

- Campagnes, liens, modèles, factures, wizard step1, GroupModal picker
- OR entre colonnes, regex, save de vues, URL / localStorage
- Filtre « désabonné » (surface déjà séparée)
- Index SQL dédiés (follow-up perf)
- Commit auto

## Succès

- Filtrer Source = Import CSV **et** groupe X → pages lazy + footer + select-all = **même** ensemble.
- Champ perso text `contains` + date `created` `last30` → AND réel, pas le buffer.
- Clear chip / clear tous → refetch offset 0, sélection reset.
- Header `select` / `actions` : pas d’icône filtre ; tri inchangé.

## Vérif manuelle (user)

```bash
pnpm test:unit
pnpm lint
pnpm build
```

UI Contacts + Groupes : un filtre, deux filtres AND, search + filtres, presets date, champ perso, expand select-all, clear.
)
