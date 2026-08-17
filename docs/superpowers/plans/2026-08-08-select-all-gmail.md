# Select-all Gmail (listes lazy) — Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` or `subagent-driven-development` task-by-task. Steps use checkbox (`- [ ]`) syntax.
>
> **smsclient overrides:** NEVER run `pnpm test*` / `pnpm build` / `tsc` / `lint` / `install`. NEVER `git commit` / `git push`. Propose commands ; user runs. Commit steps = message + `git add` list for user.

**Goal:** Select-all sur listes lazy = page d’abord, puis bandeau Gmail pour materialiser tous les ids du scope (compte ou search).

**Architecture:** Helpers Supabase ids-only paginés + hook `useGmailSelectAll` + bandeau UI partagé. Surfaces branchent le même pattern ; filtres éligibles vs tous selon la table du spec.

**Tech Stack:** Next.js 16, React 19, Supabase JS, Vitest (unit), Tailwind.

**Spec:** `docs/superpowers/specs/2026-08-08-campaign-select-all-design.md`

## Global Constraints

- Désabo exclus : wizard contacts + ContactsView (`opt_in` + pas `stop_sms`).
- Désabo inclus : GroupModal.
- UnsubscribedContactsModal : hors scope (liste déjà full).
- Search change → clear sélection.
- `recipientMode: "all"` wizard : plus de select-all magique incomplet → toujours `manual` + ids.
- `postgrest-in-chunk` / `POSTGREST_PAGE` pour boucles ids.
- Vérifs = user lance ; agent propose seulement.

---

## File map

| File | Role |
|------|------|
| `lib/supabase/clientSearch.ts` (create) | `escapeIlike` + `applyClientListSearch` partagé (évite drift vs `fetchClientsPage`) |
| `lib/supabase/clients.ts` | `countClientIds`, `fetchClientIds` (eligible flag) |
| `lib/supabase/groups.ts` | `countMatchingGroups`, `fetchMatchingGroups` → `{id,name}[]` |
| `hooks/useGmailSelectAll.ts` (create) | état pageSelect / matchTotal / expand |
| `components/smsclient/SelectAllExpandBanner.tsx` (create) | bandeau CTA |
| `views/ContactsView.tsx` | wire |
| `views/GroupesView.tsx` | wire |
| `modals/GroupModal.tsx` | wire |
| `CreateCampaign/step1/*` + `CampaignWizardStep1.tsx` | wire contacts + groupes |
| `prototypeApp/useCampaignWizard.ts` | si wiring fetch/supabase |
| `tests/unit/hooks/useGmailSelectAll.test.ts` | machine d’état |
| `tests/unit/lib/supabase/clientSearch.test.ts` | escape / pattern search |

---

### Task 1: Shared client search + id fetch/count

**Files:**
- Create: `lib/supabase/clientSearch.ts`
- Modify: `lib/supabase/clients.ts` (`fetchClientsPage` doit réutiliser le helper search)
- Create: `tests/unit/lib/supabase/clientSearch.test.ts`

**Interfaces:**
- Produces:
  - `escapeIlike(raw: string): string`
  - `applyClientListSearch<T>(query: T, search: string): T` — applique le même `.or(...)` que la liste
  - `countClientIds(supabase, { search?: string; eligibleOnly: boolean }): Promise<{ count: number; error: Error | null }>`
  - `fetchClientIds(supabase, { search?: string; eligibleOnly: boolean }): Promise<{ data: string[]; error: Error | null }>`

- [ ] **Step 1: Test `escapeIlike`**

```ts
import { describe, expect, it } from "vitest";
import { escapeIlike } from "@/lib/supabase/clientSearch";

describe("escapeIlike", () => {
  it("escapes % _ and backslash", () => {
    expect(escapeIlike(`a%b_c\\d`)).toBe(`a\\%b\\_c\\\\d`);
  });
});
```

- [ ] **Step 2: User run**

```bash
pnpm test:unit tests/unit/lib/supabase/clientSearch.test.ts
```

Expected: FAIL (module missing) — user colle le résultat.

- [ ] **Step 3: Implement `clientSearch.ts`**

Extraire logique actuelle de `fetchClientsPage` (quotes pattern + `or` sur `first_name`, `last_name`, `phone_e164`, `group_label`). Exporter `escapeIlike` + `applyClientListSearch`.

- [ ] **Step 4: Refactor `fetchClientsPage` pour appeler `applyClientListSearch`**

Aucun changement comportement liste.

- [ ] **Step 5: Add `countClientIds` + `fetchClientIds` in `clients.ts`**

```ts
export async function countClientIds(
  supabase: SupabaseClient,
  args: { search?: string; eligibleOnly: boolean },
): Promise<{ count: number; error: Error | null }> {
  let query = supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);
  if (args.eligibleOnly) {
    query = query.eq("opt_in", true).eq("stop_sms", false);
  }
  query = applyClientListSearch(query, args.search ?? "");
  const { count, error } = await query;
  if (error) return { count: 0, error: new Error(error.message) };
  return { count: typeof count === "number" ? count : 0, error: null };
}

export async function fetchClientIds(
  supabase: SupabaseClient,
  args: { search?: string; eligibleOnly: boolean },
): Promise<{ data: string[]; error: Error | null }> {
  const ids: string[] = [];
  for (let from = 0; ; from += POSTGREST_PAGE) {
    let query = supabase
      .from("clients")
      .select("id")
      .is("deleted_at", null)
      .order("id", { ascending: true })
      .range(from, from + POSTGREST_PAGE - 1);
    if (args.eligibleOnly) {
      query = query.eq("opt_in", true).eq("stop_sms", false);
    }
    query = applyClientListSearch(query, args.search ?? "");
    const { data, error } = await query;
    if (error) return { data: [], error: new Error(error.message) };
    const page = data ?? [];
    for (const row of page) {
      const id = (row as { id: string }).id;
      if (id) ids.push(id);
    }
    if (page.length < POSTGREST_PAGE) break;
  }
  return { data: ids, error: null };
}
```

- [ ] **Step 6: User re-run unit test** — expect PASS.

- [ ] **Step 7: Commit (user)**

```bash
git add lib/supabase/clientSearch.ts lib/supabase/clients.ts tests/unit/lib/supabase/clientSearch.test.ts
git commit -m "$(cat <<'EOF'
feat(contacts): fetch/count client ids for select-all expand

EOF
)"
```

---

### Task 2: Group id/name fetch + count

**Files:**
- Modify: `lib/supabase/groups.ts`
- Reuse local `escapeIlike` déjà dans `groups.ts` (ou partager si déjà dupliqué — YAGNI : garder local si pas exporté)

**Interfaces:**
- Produces:
  - `countMatchingGroups(supabase, userId, { search?: string })`
  - `fetchMatchingGroups(supabase, userId, { search?: string }): Promise<{ data: { id: string; name: string }[]; error: Error | null }>`

- [ ] **Step 1: Implement count + fetch** (même filtre search que `fetchGroupsPage` : `name` / `description` ilike, `user_id`, `deleted_at is null`). Select `id,name`, order `id`, boucle `POSTGREST_PAGE`.

- [ ] **Step 2: Commit (user)**

```bash
git add lib/supabase/groups.ts
git commit -m "$(cat <<'EOF'
feat(groups): fetch/count matching groups for select-all expand

EOF
)"
```

---

### Task 3: Hook `useGmailSelectAll` + banner

**Files:**
- Create: `hooks/useGmailSelectAll.ts`
- Create: `components/smsclient/SelectAllExpandBanner.tsx`
- Create: `tests/unit/hooks/useGmailSelectAll.test.ts`

**Interfaces:**
- Consumes: callers provide `countMatch()` / `fetchAllIds()` async
- Produces:

```ts
type UseGmailSelectAllArgs = {
  search: string;
  loadedIds: string[];
  selectedIds: ReadonlySet<string> | readonly string[];
  setSelectedIds: (ids: string[]) => void;
  countMatch: () => Promise<{ count: number; error: Error | null }>;
  fetchAllIds: () => Promise<{ data: string[]; error: Error | null }>;
};

type UseGmailSelectAllResult = {
  selectLoaded: () => void;
  clearSelection: () => void;
  showExpandBanner: boolean;
  matchTotal: number | null;
  expanding: boolean;
  expandError: string | null;
  expandToMatchAll: () => Promise<void>;
  onSearchConsumed: () => void; // clear when parent search changes
};
```

Règles :
- `selectLoaded` → `setSelectedIds(loadedIds)` + `pageSelectActive = true` + lance `countMatch` si `hasMore` ou besoin (toujours count pour comparer).
- `showExpandBanner` = `pageSelectActive && matchTotal != null && matchTotal > selectedSize` (selectedSize après page select ≈ intersection loaded∩selected, ou `matchTotal > loadedIds.length` simplifié si selectLoaded remplace toute la sélection par loadedIds).
- Décision produit : `selectLoaded` **remplace** la sélection par les loaded ids (pas merge) pour le header checkbox Contacts/Groupes ; wizard bouton « Tout sélectionner » peut merge — **unifier : replace** pour éviter états flous.
- `expandToMatchAll` → `fetchAllIds` → `setSelectedIds(data)` → `pageSelectActive = false`.
- Quand `search` change (détecter via arg) → clear sélection + reset banner state.

- [ ] **Step 1: Unit test machine**

```ts
import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGmailSelectAll } from "@/hooks/useGmailSelectAll";

describe("useGmailSelectAll", () => {
  it("shows banner when matchTotal > loaded selection", async () => {
    const setSelectedIds = vi.fn();
    const { result } = renderHook(() =>
      useGmailSelectAll({
        search: "",
        loadedIds: ["a", "b"],
        selectedIds: [],
        setSelectedIds,
        countMatch: async () => ({ count: 10, error: null }),
        fetchAllIds: async () => ({ data: ["a", "b", "c"], error: null }),
      }),
    );
    await act(async () => {
      result.current.selectLoaded();
    });
    expect(setSelectedIds).toHaveBeenCalledWith(["a", "b"]);
    expect(result.current.showExpandBanner).toBe(true);
    expect(result.current.matchTotal).toBe(10);
  });
});
```

Adapter si le projet n’a pas `@testing-library/react` pour hooks — alors tester une fonction pure exportée `shouldShowExpandBanner({ pageSelectActive, matchTotal, selectedCount })` + logique search-reset sans RTL.

- [ ] **Step 2: User run unit** — FAIL puis implement → PASS.

- [ ] **Step 3: `SelectAllExpandBanner`**

Props : `matchTotal`, `hasSearch`, `entityLabel` (`contacts` | `groupes` | custom message), `expanding`, `error`, `onExpand`, `onDismiss?`.

Copy FR (i18n keys optionnel v1 — hardcode FR OK si wizard déjà FR ; ContactsView préfère `t(...)` si keys ajoutées dans `lib/i18n/messages.ts`).

Sans search : `Sélectionner les {N} {entity} du compte ?`  
Avec search : `Sélectionner les {N} résultats de la recherche ?`  
CTA bouton « Tout sélectionner ».

- [ ] **Step 4: Commit (user)**

```bash
git add hooks/useGmailSelectAll.ts components/smsclient/SelectAllExpandBanner.tsx tests/unit/hooks/useGmailSelectAll.test.ts
git commit -m "$(cat <<'EOF'
feat(ui): gmail select-all hook and expand banner

EOF
)"
```

---

### Task 4: Wire ContactsView

**Files:**
- Modify: `components/smsclient/views/ContactsView.tsx`
- Props : besoin `supabase` ou callbacks `onCountEligible` / `onFetchEligibleIds` depuis parent (`audienceRoutes` / contacts state). Préférer **callbacks props** pour rester cohérent avec le reste des views (pas d’import supabase dans la view).

**Interfaces:**
- Ajouter props optionnelles :
  - `onCountSelectableMatches: (search: string) => Promise<{ count: number; error: Error | null }>`
  - `onFetchSelectableMatchIds: (search: string) => Promise<{ data: string[]; error: Error | null }>`
- Parent : `eligibleOnly: true`.

- [ ] **Step 1: Wire hook** — `loadedIds = eligibleRows.map(r => r.id)` ; header checkbox / `toggleAll` → `selectLoaded` / clear ; render `SelectAllExpandBanner` sous toolbar ou au-dessus DataTable.

- [ ] **Step 2: Wire parent** (`prototypeApp/routes/audienceRoutes.tsx` ou compositor contacts) vers `countClientIds` / `fetchClientIds` avec `eligibleOnly: true` + `searchQuery`.

- [ ] **Step 3: Search change** — déjà géré par hook si `search` prop = `searchQuery`.

- [ ] **Step 4: Commit (user)**

```bash
git add components/smsclient/views/ContactsView.tsx components/smsclient/prototypeApp/routes/audienceRoutes.tsx
git commit -m "$(cat <<'EOF'
feat(contacts): gmail select-all expand for list view

EOF
)"
```

---

### Task 5: Wire GroupesView

**Files:**
- Modify: `components/smsclient/views/GroupesView.tsx` + parent route

- [ ] **Step 1:** Même pattern ; `loadedIds = rows.map(r => r.id)` ; `countMatchingGroups` / `fetchMatchingGroups` → ids seulement pour `setSelectedIds`.

- [ ] **Step 2: Commit (user)**

```bash
git add components/smsclient/views/GroupesView.tsx components/smsclient/prototypeApp/routes/audienceRoutes.tsx
git commit -m "$(cat <<'EOF'
feat(groups): gmail select-all expand for list view

EOF
)"
```

---

### Task 6: Wire GroupModal

**Files:**
- Modify: `components/smsclient/modals/GroupModal.tsx`
- Modify: `prototypeApp/PrototypeAppModals.tsx` / `useGroupModalContacts.ts` si callbacks

- [ ] **Step 1:** `eligibleOnly: false` pour count/fetch. Remplacer `selectAllFiltered` / header toggle par hook (`selectLoaded` = contacts page loadés). Bandeau dans panneau liste contacts.

- [ ] **Step 2:** Sur `searchQuery` change → clear (hook). Attention : en mode edit, ne pas wipe la sélection initiale membres au premier mount — reset seulement quand **query string change** après sync initial (comparer prev search).

- [ ] **Step 3: Commit (user)**

```bash
git add components/smsclient/modals/GroupModal.tsx components/smsclient/prototypeApp/PrototypeAppModals.tsx hooks/useGroupModalContacts.ts
git commit -m "$(cat <<'EOF'
feat(groups): gmail select-all expand in group modal picker

EOF
)"
```

---

### Task 7: Wire CampaignWizard step 1

**Files:**
- Modify: `CreateCampaign/step1/useCampaignWizardStep1State.ts`
- Modify: `CreateCampaign/CampaignWizardStep1.tsx`
- Modify: `CreateCampaign/campaignTypes.ts` / `CampaignWizard.tsx` / `useCampaignWizard.ts` pour callbacks supabase

**Contacts tab:**
- `Tout sélectionner` → `selectLoaded` sur `selectableFilteredContacts` ids (`eligibleOnly: true`).
- Bandeau + expand → `setSelectedContactIds(ids)` ; `setRecipientMode("manual")` ; clear groups si besoin (comportement actuel page-select).
- Ne plus viser `recipientMode === "all"` pour ce flux.
- `Tout désélectionner` → clear + banner reset.

**Groups tab:**
- `Tout sélectionner` → noms des `filteredGroups` loadés.
- Expand → `fetchMatchingGroups` → `setSelectedGroupNames(data.map(g => g.name))` ; `setRecipientMode("lists")`.
- Count = `countMatchingGroups`.

- [ ] **Step 1: Props callbacks** sur wizard : `onCountEligibleContacts`, `onFetchEligibleContactIds`, `onCountGroups`, `onFetchMatchingGroups`.

- [ ] **Step 2: State + UI bandeau** (un bandeau selon `tab`).

- [ ] **Step 3: Search change déjà clear via `setSearch` / switchTab — brancher `onSearchConsumed` / clear sélection manuelle+groupes selon tab.

- [ ] **Step 4: Retirer / neutraliser message `recipientMode === "all"` si plus atteignable ; ou laisser dead path.

- [ ] **Step 5: Commit (user)**

```bash
git add components/smsclient/CreateCampaign/ components/smsclient/prototypeApp/useCampaignWizard.ts
git commit -m "$(cat <<'EOF'
feat(campaign): gmail select-all expand on wizard step 1

EOF
)"
```

---

### Task 8: Acceptance pass (manuel user)

- [ ] **Step 1: User runs**

```bash
pnpm test:unit
pnpm lint
pnpm build
```

- [ ] **Step 2: Manuel UI**

1. Contacts : search → ~250 ; select header → page cochée + bandeau N ; expand → sélection = N éligibles ; désabo exclus.
2. Groupes : idem avec groupes.
3. GroupModal : expand inclut désabo matchés.
4. Wizard contacts / groupes : idem ; destinataires finaux = N après expand.
5. Changer search → sélection vide.
6. Unsubscribed modal : inchangé.

---

## Spec coverage (self-review)

| Spec item | Task |
|-----------|------|
| UX Gmail page + bandeau | 3–7 |
| Sans / avec search | 1–2 filters + hook search reset |
| Éligibles wizard + ContactsView | 1 (`eligibleOnly`), 4, 7 |
| GroupModal tous | 6 |
| Groupes list + wizard groups | 2, 5, 7 |
| Unsubscribed hors scope | noté Task 0 / non-goal |
| Materialize ids | 1–2 fetch + expand |
| `recipientMode all` fix | 7 |
| postgrest page / chunk | 1–2 |
| Shared banner | 3 |

No TBD placeholders. Types `fetchClientIds` / `fetchMatchingGroups` coherents Tasks 4–7.
