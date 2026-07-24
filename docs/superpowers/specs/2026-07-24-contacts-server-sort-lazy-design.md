---
title: Contacts — tri serveur + lazyload
date: 2026-07-24
status: approved
---

# Contacts — tri serveur cohérent avec lazyload

## Contexte

Lazyload listes : `docs/superpowers/specs/2026-07-24-listes-lazyload-design.md`  
Tri UI DataTable (client) : `docs/superpowers/specs/2026-07-13-datatable-sort-design.md` — **tri serveur y était hors scope**.

Avec +2000 contacts, tri client ne réordonne que le buffer déjà chargé. Faux classement global.

## Décisions

| Choix | Décision |
|-------|----------|
| Approche | **A** — `ORDER BY` PostgREST dans `fetchClientsPage` |
| Scope phase 1 | **Contacts** seul |
| Scope phase 2 | Autres listes lazy (groupes, campagnes, liens, modèles, …) **après validation contacts** |
| Custom fields | Triables serveur (`custom_fields->>id`) |
| Custom `number` | Order **lexicographique** SQL (pas cast). Écart connu vs ancien `localeCompare numeric` |
| Multi-colonne | Non (1 colonne, comme DataTable) |
| Persistance tri | Non (état React local) |
| Tri vide | Défaut `created_at desc, id desc` (comportement fetch actuel) |

## Comportement

1. Clic header triable → `SortingState` mis à jour → reset liste (comme search) → refetch offset 0 avec order serveur.
2. `loadMore` / pagination lazy → **même** order + search actifs.
3. Pas de re-tri client sur le buffer (`sortContactRows` retiré du chemin prod).
4. Search + tri coexistent : filtre `or` ILIKE puis `order` + `range`.
5. Colonnes non triables inchangées : `select`, `avatar`, `actions`, `groups`.

## Map UI → PostgREST

| UI column id | Order column |
|--------------|--------------|
| `firstName` | `first_name` |
| `lastName` | `last_name` |
| `phone` | `phone_e164` |
| `notes` | `notes` |
| `lastSms` | `last_sms_sent_at` |
| `source` | `source` |
| `created` | `created_at` |
| `custom_<uuid>` | clé JSON text via `custom_fields->>'<uuid>'` (PostgREST / supabase-js `.order`) |

Toujours tie-break : `id` (même sens asc/desc que la colonne primaire).  
Nulls : `nullsFirst: false` (proche “empty last” client).  
`SortingState` vide **ou** `sort` null/absent → défaut `created_at desc, id desc`.

## Contrats

### `useInfiniteList`

Étendre `FetchPageFn` :

```ts
sort?: { id: string; desc: boolean } | null
```

- Passer `sort` à chaque `fetchPage` (offset 0 et loadMore).
- `sort` dans les deps du reset (comme `search` / `reloadKey`).

### `fetchClientsPage`

`FetchClientsPageArgs` + `sort?`. Appliquer `.order(...)` via map ; défaut si absent/vide = `created_at desc, id desc`.

### Wire UI

`ContactsView` → `useContacts` → `useInfiniteList` → `fetchClientsPage`.  
`manualSorting` reste true ; `data` = rows serveur bruts.

## Fichiers (phase 1)

- `hooks/useInfiniteList.ts`
- `hooks/useContacts.ts`
- `lib/supabase/clients.ts`
- `lib/proto/contactSort.ts` (nouveau — map + helpers testables)
- `components/smsclient/views/ContactsView.tsx`
- `lib/proto/sortContactRows.ts` — retirer usage prod ; garder ou migrer tests vers map serveur

## Hors scope

- Phase 2 autres listes (même pattern après OK contacts)
- Index SQL dédiés (follow-up perf)
- RPC / cast numeric custom
- Tri multi-colonnes
- « Sélectionner tous » serveur (déjà hors lazyload v1)
- Commit auto

## Succès

Compte +2000 contacts : tri Nom (asc) → première page = vrais premiers du **compte** ; scroll charge la suite dans le **même** ordre ; search + tri OK.

## Vérif manuelle (user)

```bash
pnpm test:unit
pnpm build
```

UI : Contacts grosse base — cycle tri Prénom / Date / champ perso ; loadMore ; search + tri ; colonnes non triables inertes.

## Relation specs

- Complète lazyload (search serveur) avec **sort serveur**.
- Amendement de facto de `2026-07-13-datatable-sort-design.md` : pour Contacts, tri n’est plus client-only.
)
