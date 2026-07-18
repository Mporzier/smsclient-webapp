---
title: Automatisations — catalogue + favoris
date: 2026-07-17
status: approved
---

# Automatisations — catalogue + favoris (design)

## Contexte

Vue actuelle (`AutomatisationsView`) : 5 presets (anniversaire + dates fixes) en cards enable / Configurer, branchés sur `sms_automations`.

Catalog JSON déjà riche (`lib/types/automationCatalog.json` + helpers `lib/automations/catalog.ts` : activité, intégrations) — **non branché** sur la vue.

Objectif : revamp browse catalogue (catégories via tags, search, cards, stars pertinence JSON, favoris DB) tout en gardant la config « mes automatisations ».

## Décisions

| Choix | Décision |
|-------|----------|
| Navigation | **2 onglets** : Mes automatisations + Catalogue |
| Layout catalog | Liste filtrée : search + chips tag (1) + sections activité / Autres |
| Tags | Single-select (pas multi). Chips : `promo`, `api`, `fidelisation`, `acquisition`, `calendrier` (+ autres tags présents, tri alpha) |
| Pertinence secteur | `automationMatchesActivity` → section « Pour mon activité » ; hors match → « Autres » |
| Sans `businessActivity` profil | Une seule section (pas de split) ; search + chips OK |
| Stars | Champ JSON `relevance` 1–5, **read-only** (pas de note user) |
| Favoris | Table Supabase `sms_automation_favorites` (pas localStorage) |
| Default tab | Mes automatisations si ≥1 active, sinon Catalogue |
| Config depuis catalog | `available` + id mappé preset actuel → Configurer (modal existante) ; `planned` → CTA disabled « Bientôt » |

## IA / navigation

1. Onglet **Mes automatisations** : comportement actuel inchangé (guide si 0 active, cards enable, modal edit).
2. Onglet **Catalogue** : découverte + favoris + filtres.
3. Source secteur : `businessActivity` profil (`lib/supabase/profile.ts`).

## Catalogue UI

### Toolbar

- Search : filtre case-insensitive sur `label`, `description`, `tags`.
- Chips tags : un seul actif ; chip **Tous** = reset.
- Toggle **Favoris seulement**.

### Sections (activité connue)

1. **Pour mon activité** — `automationMatchesActivity(auto, activityId)`.
2. **Autres** — le reste (ex. auto boucherie-only si user resto).

Tri dans chaque section : `relevance` desc, puis `label` asc.

### Card

- Titre, description courte, étoiles read-only (`relevance`), cœur favori, badge `available` / `planned`.
- Affiche un tag primaire (tag du filtre actif si présent, sinon premier tag).
- CTA : Configurer si `available` et preset connu ; sinon « Bientôt » si `planned`.

### Empty / erreurs

- Aucun résultat filtres → empty state + action reset filtres.
- Favoris API fail → message inline / toast, revert optimistic.
- Table favoris absente → message migration (même ton que `sms_automations`).

## Data

### JSON (`automationCatalog.json`)

- Ajouter `relevance?: number` (1–5) sur chaque automatisation.
- Normaliser / aligner tags vers le set UI principal ; tags legacy restent utilisables en search.
- Étendre `CatalogAutomation` dans `lib/automations/catalog.ts` + helpers :
  - `filterCatalogAutomations({ query, tag, favoritesOnly, favoriteIds })`
  - `splitByActivity(automations, activityId | null)`

### Favoris DB

```sql
create table public.sms_automation_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  automation_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, automation_id)
);
-- RLS : select / insert / delete own only
```

- Module : `lib/supabase/automationFavorites.ts` — `listFavorites`, `addFavorite`, `removeFavorite`.
- Hook : `hooks/useAutomationFavorites.ts` (séparé de `useAutomations`).

### Mes automatisations

Inchangé : `sms_automations` + presets existants. Pas d’enable pour ids catalog hors presets / `planned` en V1.

## Fichiers cibles

| Fichier | Rôle |
|---------|------|
| `components/smsclient/views/AutomatisationsView.tsx` | Tabs + composition |
| `components/smsclient/views/automatisations/MesAutomatisationsTab.tsx` | UI actuelle extraite |
| `components/smsclient/views/automatisations/CatalogTab.tsx` | Search, chips, sections, grid |
| `components/smsclient/views/automatisations/CatalogAutomationCard.tsx` | Card catalog |
| `lib/automations/catalog.ts` | Types + filtres + split |
| `lib/types/automationCatalog.json` | `relevance` + tags |
| `hooks/useAutomationFavorites.ts` | État favoris |
| `lib/supabase/automationFavorites.ts` | Queries |
| `supabase/migrations/…_sms_automation_favorites.sql` | Table + RLS |

Wiring : passer `businessActivity` depuis parent si déjà dispo ; sinon fetch profile léger dans Catalog tab. Éviter gros refactor `usePrototypeApp`.

## Tests (manuel — agent propose, user lance)

- Unit : `automationMatchesActivity`, filter search/tag, split activité / Autres, sort `relevance`.
- Unit : bornes `relevance` 1–5 (ignore / clamp selon helper choisi — **clamp** à l’affichage).
- Pas d’e2e dédié V1 (smoke route existante OK si déjà là).

## Hors scope V1

- Enable / save d’autos `planned` ou hors presets actuels
- Multi-tag filter
- Notation user (stars interactives)
- Sidebar / marketplace layout
- Sync agrégée « score produit » côté serveur

## Critères de succès

1. User avec activité voit autos pertinentes d’abord ; hors-secteur sous Autres.
2. Search + un tag + favoris filtrent correctement.
3. Favoris persistent en DB (multi-device / refresh).
4. Stars affichent `relevance` JSON sans édition.
5. Onglet Mes automatisations reste fonctionnel (toggle + modal).
