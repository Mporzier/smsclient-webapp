---
title: select-all gmail (listes lazy) design
updated: 2026-08-08
---

# Select-all style Gmail — toutes listes lazy

## Problème

`Tout sélectionner` / checkbox header ne coche que les lignes **déjà chargées** (lazy pages). User croit sélectionner tout le compte / toute la recherche.

Wizard : même trou pour `recipientMode === "all"` (resolve / count sur mémoire).

## Décisions

- Scope : **tous les select-all de listes lazy** de l’app (voir surfaces).
- UX commune : **Gmail** — page d’abord, bandeau pour étendre au scope complet.
- Sans recherche : étendre = **tous les matchs du compte** (filtre surface).
- Avec recherche : étendre = **tous les matchs de la query** (même filtre serveur que la liste).
- Après clic bandeau : materialiser les **ids** dans l’état de sélection local.
- Changer / vider la recherche : **reset** sélection (évite mélange query A / ids query B).
- Éditeur SMS (`selectAllEditorContents`) : **hors scope** (pas une liste).

## Surfaces

| Surface | Entité | Qui entre dans N / ids | Fetch expand |
|---------|--------|------------------------|--------------|
| Wizard step1 — tab contacts | clients | **Éligibles** (`opt_in`, pas `stop_sms`) | `fetchEligibleClientIds` |
| Wizard step1 — tab groupes | groups | Tous match search | `fetchMatchingGroupIds` (ou équiv.) |
| ContactsView | clients | **Éligibles** (déjà `isCampaignEligibleContact` / rows filtrées) | `fetchEligibleClientIds` |
| GroupesView | groups | Tous match search | `fetchMatchingGroupIds` |
| GroupModal (picker contacts) | clients | **Tous** match search (désabo inclus — membership) | `fetchClientIds` (sans filtre éligible) |
| UnsubscribedContactsModal | désabo | Liste déjà **full fetch** + filtre client | **Pas de bandeau v1** — select-all filtré déjà complet |

## Non-goals v1

- Virtualisation.
- Sélection stable quand la query change.
- Envoi / bulk « by query » sans materialiser ids.
- Changer UnsubscribedContactsModal (sauf si on lazy-load plus tard).

## UX commune

| Action | Effet |
|--------|--------|
| Select-all (bouton / header) | Coche matchs **déjà loadés** (filtre surface). |
| Bandeau si | `matchTotal > selectedLoaded` (ou `hasMore` + total connu). |
| Texte bandeau (sans search) | « Sélectionner les **N** … du compte ? » (libellé par surface). |
| Texte bandeau (avec search) | « Sélectionner les **N** résultats de la recherche ? » |
| Clic bandeau | Fetch tous les ids du scope → set sélection ; loading sur bandeau. |
| Clear / désélection | Vide ids + cache bandeau. |
| Recherche change | Clear sélection + bandeau. |

## Data / API

Helpers (près des fetch page existants) :

```ts
fetchEligibleClientIds(supabase, { search?: string })
fetchClientIds(supabase, { search?: string })           // GroupModal — pas de filtre opt-in
countEligibleClients(supabase, { search?: string })     // ou count via includeTotal
fetchMatchingGroupIds(supabase, { search?: string })
```

Règles clients éligibles :

- `deleted_at is null`
- `opt_in.eq.true`, `stop_sms.eq.false`
- Search : **même** `or` ilike que `fetchClientsPage`

GroupModal `fetchClientIds` : même search / `deleted_at`, **sans** filtre opt-in/stop.

Groupes : même search que `fetchGroupsPage`, select `id` paginé `POSTGREST_PAGE`.

Count exact : 1 requête au moment du bandeau (pas à chaque keystroke).

Expand : pages `id` only ; bulk actions / wizard réutilisent `fetchClientsByIds` / patterns existants. Skill `postgrest-in-chunk` sur `.in("id", …)`.

## État UI

Pattern partagé (hook ou petit helper par surface) :

- `pageSelectActive: boolean`
- `matchTotal: number | null`
- `expandingSelection: boolean`

Wizard `recipientMode: "all"` : select-all → **toujours `manual` + ids** materialisés ; plus de mode « all » incomplet sur lazy pages.

Composant bandeau réutilisable (texte + CTA + loading) pour éviter 5 copies CSS.

## Fichiers touchés (indicatif)

- `lib/supabase/clients.ts` — fetch/count ids clients (± éligible).
- `lib/supabase/groups.ts` — fetch/count ids groupes.
- Hook / composant partagé select-all Gmail (ex. `hooks/useGmailSelectAll.ts` + `SelectAllExpandBanner`).
- `ContactsView`, `GroupesView`, `GroupModal`, `CampaignWizardStep1` + state.
- `useCampaignWizard` wiring si besoin.
- Tests unit helpers fetch/filtre.

## Acceptance

1. Chaque surface lazy : select-all page → bandeau si reste des matchs ; clic → sélection = N scope.
2. Wizard contacts / ContactsView : désabo jamais dans N ni ids.
3. GroupModal : désabo **inclus** si match search.
4. Sans / avec search : scope correct.
5. Clear / changement search : pas de fausse sélection cross-query.
6. UnsubscribedContactsModal : inchangé (déjà full list).
