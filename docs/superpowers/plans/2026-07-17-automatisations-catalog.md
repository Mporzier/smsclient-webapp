# Automatisations catalogue — Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Onglets Mes automatisations + Catalogue (search, tags single, split activité/Autres, stars `relevance`, favoris DB).

**Architecture:** Extraire l’UI actuelle dans `MesAutomatisationsTab`. Nouveau `CatalogTab` consomme `lib/automations/catalog.ts` + `useAutomationFavorites`. Favoris via table `sms_automation_favorites` + RLS.

**Tech Stack:** Next.js / React, Supabase, Lucide, Tailwind, Vitest (unit).

**Spec:** `docs/superpowers/specs/2026-07-17-automatisations-catalog-design.md`

## Global Constraints

- Agent : **ne pas** lancer `pnpm test*` / `pnpm build` / `tsc` / `lint` / `install` (`no-heavy-cmds`, `no-verify-build`).
- Agent : **ne pas** `git commit` / `git push` (`no-git-commit`) — proposer commandes.
- Vérifs : user lance manuellement.
- Tags UI primary : `promo` | `api` | `fidelisation` | `acquisition` | `calendrier` (normalize `fidélité`→`fidelisation`, `iPaaS`→`api` à l’affichage/filtre).
- Stars : `relevance` JSON 1–5, clamp affichage, read-only.
- Configurer depuis catalog seulement si `id` ∈ presets actuels et `status === "available"`.

---

## File map

| File | Role |
|------|------|
| `lib/automations/catalog.ts` | `relevance`, filtres, split, tags, clamp |
| `lib/types/automationCatalog.json` | `relevance` + tags normalisés |
| `tests/unit/lib/automations/catalog.test.ts` | Unit filtres / split / clamp |
| `supabase/migrations/20260717120000_sms_automation_favorites.sql` | Table + RLS |
| `lib/supabase/automationFavorites.ts` | list / add / remove |
| `hooks/useAutomationFavorites.ts` | État favoris |
| `views/automatisations/MesAutomatisationsTab.tsx` | UI actuelle |
| `views/automatisations/CatalogAutomationCard.tsx` | Card |
| `views/automatisations/CatalogTab.tsx` | Toolbar + sections |
| `views/AutomatisationsView.tsx` | Tabs + wire |
| `prototypeApp/routes/contentRoutes.tsx` | Props inchangées si possible |

---

### Task 1: Helpers catalog + tests

**Files:**
- Modify: `lib/automations/catalog.ts`
- Create: `tests/unit/lib/automations/catalog.test.ts`
- Modify: `lib/types/automationCatalog.json` (via script node one-shot)

**Interfaces:**
- Produces:
  - `clampRelevance(n: unknown): number` → 0–5
  - `normalizeCatalogTag(tag: string): string`
  - `PRIMARY_CATALOG_TAGS: readonly string[]`
  - `listCatalogFilterTags(): string[]`
  - `filterCatalogAutomations(opts): CatalogAutomation[]`
  - `splitByActivity(autos, activityId: string | null): { matched, other }`
  - `sortByRelevance(autos): CatalogAutomation[]`
  - `CatalogAutomation.relevance?: number`

- [x] **Step 1:** Étendre type + helpers dans `catalog.ts` (voir impl).
- [x] **Step 2:** Écrire `catalog.test.ts` (search, tag single, favoritesOnly, split null vs activity, clamp).
- [x] **Step 3:** Script node : pour chaque auto, set `relevance` (available+native-ish=4–5, planned=2–3), normalize tags `fidélité`→`fidelisation`, map `iPaaS`→`api` si présent.
- [ ] **Step 4:** User : `pnpm test:unit -- tests/unit/lib/automations/catalog.test.ts`

---

### Task 2: Favoris DB + hook

**Files:**
- Create: `supabase/migrations/20260717120000_sms_automation_favorites.sql`
- Create: `lib/supabase/automationFavorites.ts`
- Create: `hooks/useAutomationFavorites.ts`

**Interfaces:**
- Produces:
  - `listFavorites(supabase, userId) → { data: string[]; error }`
  - `addFavorite(supabase, userId, automationId)`
  - `removeFavorite(supabase, userId, automationId)`
  - `useAutomationFavorites(enabled?) → { favoriteIds, loading, error, toggleFavorite, refresh }`

- [x] **Step 1:** Migration SQL (PK user_id+automation_id, RLS own).
- [x] **Step 2:** Module supabase.
- [x] **Step 3:** Hook (optimistic toggle + revert on error).

---

### Task 3: UI Catalogue + tabs

**Files:**
- Create: `MesAutomatisationsTab.tsx`, `CatalogAutomationCard.tsx`, `CatalogTab.tsx`
- Modify: `AutomatisationsView.tsx`
- Modify: `contentRoutes.tsx` only if new props needed

**Interfaces:**
- Consumes: helpers Task 1, hook Task 2, `rows`/`onSave` existants, `getOrCreateUserProfile` pour `businessActivity`
- Produces: tabs Mes / Catalogue ; card CTA Configurer → callback `onConfigure(presetKey)` si mappable

- [x] **Step 1:** Extraire UI actuelle → `MesAutomatisationsTab`.
- [x] **Step 2:** `CatalogAutomationCard` (stars, cœur, badge, CTA).
- [x] **Step 3:** `CatalogTab` (search, chips, favoris only, sections, empty).
- [x] **Step 4:** `AutomatisationsView` tabs ; default tab selon `activeCount` ; configure ouvre modal existante si row trouvée.

---

### Task 4: Fin

- [x] **Step 1:** Marquer spec `status: approved`.
- [x] **Step 2:** Proposer commandes vérif + commit (user).

---

## Self-review vs spec

| Spec | Task |
|------|------|
| 2 onglets | 3 |
| search + tag single + favoris | 1+3 |
| split activité / Autres | 1+3 |
| stars JSON | 1+3 |
| favoris DB | 2 |
| Mes autos inchangé | 3 extract |
| tests unit | 1 |
| hors planned enable | 3 CTA Bientôt |
