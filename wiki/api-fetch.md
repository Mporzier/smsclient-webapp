---
title: API fetch — anti-surcharge
tags:
  - agent
  - performance
  - supabase
  - hooks
aliases:
  - fetch-discipline
  - api-calls
---

# API fetch — éviter les calls inutiles

Règles durables pour agents. Origine : perf liste contacts (20k+) + Network tab, 2026-08.

Point d'entrée : `prototypeApp/usePrototypeData.ts` + `usePrototypeApp.ts`.

## Principe

Ne **pas** charger toutes les données proto au mount de l'app. Chaque hook liste / snapshot doit accepter un flag `enabled` / `active` / `withX` et ne fetch **que** si la route (ou l'UI) en a besoin.

> [!warning] Anti-pattern
> Monter `useCampaigns()`, `useLinks()`, `useStatistics()`, `useUserQrCode()`, etc. sans condition dans `usePrototypeData` → N requests PostgREST dès `#contacts`, même si la vue n'affiche rien de ces domaines.

## Gating route (`usePrototypeData`)

| Hook | Actif quand | Raison |
| ---- | ----------- | ------ |
| `useContacts(withUnsubscribed)` | toujours (liste) ; unsub count si `contacts` \| `statistiques` | Shell / wizard / modales touchent contacts ; unsub lazy |
| `useCustomFieldDefs` | toujours | colonnes contacts + modales |
| `useGroups` | toujours | `groupOptions` modale contact |
| `useCampaigns(active)` | `dashboard` \| `campagnes` \| `nouvelle-campagne` | dashboard cards |
| `useCredits(withPurchases)` | balance **toujours** (badge Shell) ; purchases seulement `parametres` | badge ≠ historique achats |
| `useLinks` / `useSmsTemplates` | `liens` / `modeles-sms` | listes dédiées |
| `useAutomations` | `automatisations` | déjà gated |
| `useUserQrCode` / `useQrWheel` | `qr-boutique` | |
| `useTrashItems` | `parametres` | |
| `useStatistics(range, enabled)` | **seulement** `statistiques` (`usePrototypeApp`) | 4 queries lourdes sinon |

Nouveau domaine / hook dans le compositor → **ajouter un flag route** sauf besoin global explicite (profil, balance crédits, defs champs perso).

## Contacts — liste vs désabonnés

Fichiers : `hooks/useContacts.ts`, `lib/supabase/clients.ts`.

| Besoin UI | Call | Interdit |
| --------- | ---- | -------- |
| Ouvrir `#contacts` | `fetchClientsPage` offset 0, `LIST_PAGE_SIZE` (50) | `fetchClients()` full dump ; boucle pages au mount |
| Compteur « N désabonnés » footer | `countUnsubscribedContacts` (`head: true`) | `fetchUnsubscribedContacts` (jusqu'à 500 rows) |
| Modale « Voir la liste » | `loadUnsubscribed` → `fetchUnsubscribedContacts` | précharger la liste au mount |

`includeTotal` / `count: "exact"` sur la 1ʳᵉ page liste = coût Postgres (COUNT sous RLS). Garder seulement si l'UI affiche un total exact ; sinon `hasMore` suffit.

Select liste : éviter colonnes/embeds inutiles (`notes`, `custom_fields`, embed `client_group_members`…) si `group_label` miroir suffit pour l'affichage.

## Crédits

Fichiers : `hooks/useCredits.ts`, `lib/supabase/credits.ts`.

- Lecture balance Shell : `fetchCreditsSnapshot(..., { withPurchases: false })` → **1** `select` sur `sms_credits_accounts`.
- Pas d'`upsert` / `ensureCreditsAccount` sur le chemin lecture (création compte au buy).
- Historique achats + `count: "exact"` : seulement route `parametres` (`withPurchases: true`).

## Statistiques

`useStatistics` = 4 calls parallèles (`sms_campaigns` range + 2 × count clients + top groups). **Jamais** hors route `statistiques`.

## Dev vs prod

React Strict Mode (dev) **double** les effects mount → Network montre 2× chaque GET. Ne pas « corriger » en désactivant Strict Mode. Dédup / cache partagé = chantier séparé si besoin.

## Checklist agent (nouveau fetch)

1. La route / l'action courante a-t-elle **besoin** de cette data maintenant ?
2. Flag `enabled` / lazy (modale ouverte, scroll `loadMore`) plutôt que mount global.
3. Preférer `head: true` / count pour un compteur ; rows seulement à l'affichage.
4. Pas de `count: "exact"` « au cas où » sur chaque page.
5. Pas de second hook qui refetch le même tableau (vérifier `usePrototypeData` + wizard + modales).
6. Après changement : Network tab sur `#contacts` — viser ~profil + balance + page contacts + defs champs + count unsub (hors doublons Strict Mode).

## Fichiers clés

- `prototypeApp/usePrototypeData.ts` — gating
- `prototypeApp/usePrototypeApp.ts` — `useStatistics(..., route === "statistiques")`
- `hooks/useInfiniteList.ts` — pagination 50
- `lib/supabase/postgrestChunk.ts` — `LIST_PAGE_SIZE`
- Skill bulk PostgREST : `postgrest-in-chunk`
