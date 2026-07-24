# Contacts server sort + lazyload — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tri Contacts sur toute la base (+2000) : chaque page lazy (`fetch` + `loadMore`) respecte le `ORDER BY` serveur actif.

**Architecture:** Étendre `useInfiniteList` avec `sort` (reset comme search). `fetchClientsPage` applique `.order` via map UI→PostgREST (`lib/proto/contactSort.ts`). `useContacts` détient `SortingState` ; `ContactsView` ne re-trie plus en local.

**Tech Stack:** Next.js 16, React 19, Supabase JS, TanStack Table (`SortingState`, `manualSorting`), Vitest.

**Spec:** `docs/superpowers/specs/2026-07-24-contacts-server-sort-lazy-design.md`

## Global Constraints

- Phase 1 = **Contacts seul** (autres listes = phase 2 après validation user).
- Tri multi-colonnes : non.
- Custom `number` : order SQL **lexicographique** (pas cast).
- Agent : **pas** `pnpm test*` / `pnpm build` / commit / push (skills `no-heavy-cmds`, `no-verify-build`, `no-git-commit`). Proposer commandes ; user lance.
- Commit steps ci-dessous = **à proposer à l’user**, jamais exécutés par l’agent.

---

## File map

| File | Role |
|------|------|
| `lib/proto/contactSort.ts` | Type `ContactListSort` + map UI → specs `.order` |
| `tests/unit/lib/proto/contactSort.test.ts` | Tests map / défaut / custom / reject id unsafe |
| `hooks/useInfiniteList.ts` | `sort` option + pass + reset deps |
| `lib/supabase/clients.ts` | `FetchClientsPageArgs.sort` + apply orders |
| `hooks/useContacts.ts` | State sorting + wire sort → infinite list |
| `components/smsclient/views/ContactsView.tsx` | Props sorting contrôlé ; drop `sortContactRows` |
| `components/smsclient/prototypeApp/routes/audienceRoutes.tsx` | Pass sorting props |
| `lib/proto/sortContactRows.ts` | Plus utilisé en prod — laisser fichier (dead) ou supprimer si aucun import |

---

### Task 1: `contactSort` map + unit tests

**Files:**
- Create: `lib/proto/contactSort.ts`
- Create: `tests/unit/lib/proto/contactSort.test.ts`

**Interfaces:**
- Produces:
  - `export type ContactListSort = { id: string; desc: boolean }`
  - `export type ContactOrderSpec = { column: string; ascending: boolean }`
  - `export function contactSortToOrders(sort: ContactListSort | null | undefined): ContactOrderSpec[]`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { contactSortToOrders } from "@/lib/proto/contactSort";

describe("contactSortToOrders", () => {
  it("defaults to created_at desc, id desc when sort empty", () => {
    expect(contactSortToOrders(null)).toEqual([
      { column: "created_at", ascending: false },
      { column: "id", ascending: false },
    ]);
    expect(contactSortToOrders(undefined)).toEqual([
      { column: "created_at", ascending: false },
      { column: "id", ascending: false },
    ]);
  });

  it("maps native columns and tie-breaks with id same direction", () => {
    expect(contactSortToOrders({ id: "firstName", desc: false })).toEqual([
      { column: "first_name", ascending: true },
      { column: "id", ascending: true },
    ]);
    expect(contactSortToOrders({ id: "lastSms", desc: true })).toEqual([
      { column: "last_sms_sent_at", ascending: false },
      { column: "id", ascending: false },
    ]);
    expect(contactSortToOrders({ id: "phone", desc: false })).toEqual([
      { column: "phone_e164", ascending: true },
      { column: "id", ascending: true },
    ]);
    expect(contactSortToOrders({ id: "created", desc: true })).toEqual([
      { column: "created_at", ascending: false },
      { column: "id", ascending: false },
    ]);
  });

  it("maps custom_<uuid> to jsonb text path", () => {
    const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    expect(contactSortToOrders({ id: `custom_${id}`, desc: false })).toEqual([
      { column: `custom_fields->>${id}`, ascending: true },
      { column: "id", ascending: true },
    ]);
  });

  it("falls back to default for unknown or unsafe column ids", () => {
    expect(contactSortToOrders({ id: "groups", desc: false })).toEqual([
      { column: "created_at", ascending: false },
      { column: "id", ascending: false },
    ]);
    expect(
      contactSortToOrders({ id: "custom_evil,id.desc", desc: false }),
    ).toEqual([
      { column: "created_at", ascending: false },
      { column: "id", ascending: false },
    ]);
  });
});
```

- [ ] **Step 2: Propose unit run (user)**

```bash
pnpm exec vitest run tests/unit/lib/proto/contactSort.test.ts
```

Expected: FAIL (module missing).

- [ ] **Step 3: Implement `lib/proto/contactSort.ts`**

```ts
export type ContactListSort = { id: string; desc: boolean };

export type ContactOrderSpec = { column: string; ascending: boolean };

const NATIVE: Record<string, string> = {
  firstName: "first_name",
  lastName: "last_name",
  phone: "phone_e164",
  notes: "notes",
  lastSms: "last_sms_sent_at",
  source: "source",
  created: "created_at",
};

const SAFE_CUSTOM_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_ORDERS: ContactOrderSpec[] = [
  { column: "created_at", ascending: false },
  { column: "id", ascending: false },
];

function resolvePrimaryColumn(sortId: string): string | null {
  if (NATIVE[sortId]) return NATIVE[sortId]!;
  if (sortId.startsWith("custom_")) {
    const fieldId = sortId.slice("custom_".length);
    if (!SAFE_CUSTOM_ID.test(fieldId)) return null;
    return `custom_fields->>${fieldId}`;
  }
  return null;
}

/** Map UI SortingState[0] → PostgREST .order specs (primary + id tie-break). */
export function contactSortToOrders(
  sort: ContactListSort | null | undefined,
): ContactOrderSpec[] {
  if (!sort?.id) return DEFAULT_ORDERS;
  const column = resolvePrimaryColumn(sort.id);
  if (!column) return DEFAULT_ORDERS;
  const ascending = !sort.desc;
  return [
    { column, ascending },
    { column: "id", ascending },
  ];
}
```

- [ ] **Step 4: Propose re-run (user)** — same vitest command. Expected: PASS.

- [ ] **Step 5: Propose commit (user)**

```bash
git add lib/proto/contactSort.ts tests/unit/lib/proto/contactSort.test.ts
git commit -m "$(cat <<'EOF'
feat(contacts): map UI sort to PostgREST order specs

EOF
)"
```

---

### Task 2: `useInfiniteList` — prop `sort`

**Files:**
- Modify: `hooks/useInfiniteList.ts`

**Interfaces:**
- Consumes: `ContactListSort` shape `{ id: string; desc: boolean }` (generic, not import required)
- Produces: `FetchPageFn` args include `sort: { id: string; desc: boolean } | null` ; options include `sort?`

- [ ] **Step 1: Extend types**

Replace `FetchPageFn` / options :

```ts
export type ListSort = { id: string; desc: boolean };

type FetchPageFn<T> = (args: {
  offset: number;
  limit: number;
  search: string;
  sort: ListSort | null;
}) => Promise<PageResult<T>>;

type UseInfiniteListOptions<T> = {
  enabled: boolean;
  fetchPage: FetchPageFn<T>;
  searchDebounceMs?: number;
  pageSize?: number;
  /** Active server sort — change resets list like search. */
  sort?: ListSort | null;
};
```

- [ ] **Step 2: Wire sort into hook**

Add param `sort = null` to destructuring.

Serialize for deps:

```ts
const sortKey = sort ? `${sort.id}:${sort.desc ? "d" : "a"}` : "";
```

Pass `sort: sort ?? null` in **all** three `fetchPage` call sites (initial effect, `loadMore`, `refresh`).

Add `sortKey` to:
- initial fetch `useEffect` deps: `[enabled, search, pageSize, reloadKey, sortKey]`
- `loadMore` deps (+ use `sort` inside)
- `refresh` deps

Other list hooks (`useGroups`, etc.) : update `fetchPage` callbacks to accept `sort` and **ignore** it (phase 2). Signature must compile.

- [ ] **Step 3: Fix other `use*` fetchPage signatures**

In each of: `hooks/useGroups.ts`, `hooks/useCampaigns.ts`, `hooks/useLinks.ts`, `hooks/useSmsTemplates.ts`, `hooks/useGroupModalContacts.ts` — add `sort: _sort` (or `sort`) to the destructured args so TypeScript accepts new `FetchPageFn`. Do not change their Supabase order yet.

- [ ] **Step 4: Propose commit (user)**

```bash
git add hooks/useInfiniteList.ts hooks/useGroups.ts hooks/useCampaigns.ts hooks/useLinks.ts hooks/useSmsTemplates.ts hooks/useGroupModalContacts.ts
git commit -m "$(cat <<'EOF'
feat(lists): pass sort through useInfiniteList

EOF
)"
```

---

### Task 3: `fetchClientsPage` applies server order

**Files:**
- Modify: `lib/supabase/clients.ts` (`FetchClientsPageArgs` + `fetchClientsPage`)

**Interfaces:**
- Consumes: `contactSortToOrders` from `@/lib/proto/contactSort`
- Produces: `FetchClientsPageArgs.sort?: ContactListSort | null`

- [ ] **Step 1: Extend args + apply orders**

```ts
import {
  contactSortToOrders,
  type ContactListSort,
} from "@/lib/proto/contactSort";

export type FetchClientsPageArgs = {
  offset: number;
  limit?: number;
  search?: string;
  includeTotal?: boolean;
  sort?: ContactListSort | null;
};
```

Inside `fetchClientsPage`, replace fixed:

```ts
.order("created_at", { ascending: false })
.order("id", { ascending: false })
```

with:

```ts
const orders = contactSortToOrders(args.sort);
// build query without order first, then:
for (const o of orders) {
  query = query.order(o.column, {
    ascending: o.ascending,
    nullsFirst: false,
  });
}
```

Keep `.range` after orders. Search `or` filter unchanged (apply before or after order — both OK; keep current filter placement).

- [ ] **Step 2: Propose commit (user)**

```bash
git add lib/supabase/clients.ts
git commit -m "$(cat <<'EOF'
feat(contacts): order fetchClientsPage by active sort

EOF
)"
```

---

### Task 4: Wire `useContacts` + view + route

**Files:**
- Modify: `hooks/useContacts.ts`
- Modify: `components/smsclient/views/ContactsView.tsx`
- Modify: `components/smsclient/prototypeApp/routes/audienceRoutes.tsx`

**Interfaces:**
- Produces from `useContacts`: `sorting: SortingState`, `setSorting: Dispatch<SetStateAction<SortingState>>`
- `ContactsProps`: `sorting` + `onSortingChange` (controlled) — remove local `useState` sorting

- [ ] **Step 1: `useContacts` owns sort**

```ts
import type { SortingState } from "@tanstack/react-table";
import type { ContactListSort } from "@/lib/proto/contactSort";
import { useCallback, useEffect, useMemo, useState } from "react";

// inside useContacts:
const [sorting, setSorting] = useState<SortingState>([]);
const sort: ContactListSort | null = sorting[0]
  ? { id: sorting[0].id, desc: !!sorting[0].desc }
  : null;

const fetchPage = useCallback(
  async ({
    offset,
    limit,
    search,
    sort: pageSort,
  }: {
    offset: number;
    limit: number;
    search: string;
    sort: ContactListSort | null;
  }) => {
    const res = await fetchClientsPage(supabase, {
      offset,
      limit,
      search,
      sort: pageSort,
      includeTotal: offset === 0,
    });
    return {
      data: res.data,
      hasMore: res.hasMore,
      totalCount: res.totalCount,
      error: res.error,
    };
  },
  [supabase],
);

const list = useInfiniteList<ContactRowData>({
  enabled,
  fetchPage,
  sort,
});
// destructure from list as today…

return {
  // …existing
  sorting,
  setSorting,
};
```

- [ ] **Step 2: `ContactsView` controlled sorting**

- Remove import `sortContactRows`.
- Extend props:

```ts
import type { ColumnDef, SortingState, OnChangeFn } from "@tanstack/react-table";

// in ContactsProps:
sorting: SortingState;
onSortingChange: OnChangeFn<SortingState>;
```

- Remove local `const [sorting, setSorting] = useState…` and `sortedRows` memo.
- Table:

```tsx
<DataTable
  columns={selectColumns}
  data={eligibleRows}
  // …
  sorting={sorting}
  onSortingChange={onSortingChange}
  manualSorting
/>
```

- [ ] **Step 3: `audienceRoutes` wire**

```tsx
<ContactsView
  // …existing
  sorting={contactsState.sorting}
  onSortingChange={contactsState.setSorting}
/>
```

- [ ] **Step 4: Dead code**

If `sortContactRows` has zero imports: delete `lib/proto/sortContactRows.ts` **or** leave with a one-line comment `// superseded by contactSort + server order`. Prefer delete if unused.

- [ ] **Step 5: Propose commit (user)**

```bash
git add hooks/useContacts.ts components/smsclient/views/ContactsView.tsx components/smsclient/prototypeApp/routes/audienceRoutes.tsx lib/proto/sortContactRows.ts
git commit -m "$(cat <<'EOF'
feat(contacts): server sort drives lazy pages

EOF
)"
```

---

### Task 5: Spec status + manual verify checklist

**Files:**
- Modify: `docs/superpowers/specs/2026-07-24-contacts-server-sort-lazy-design.md` — `status: approved`

- [ ] **Step 1: Mark spec approved** (`status: draft` → `status: approved`).

- [ ] **Step 2: Propose verify (user)**

```bash
pnpm test:unit
pnpm build
pnpm dev
```

Manual UI (+2000 contacts) :
1. Tri Prénom asc → page 1 = vrais premiers compte ; scroll = suite même ordre.
2. Tri Date / champ perso custom.
3. Search + tri ensemble.
4. Headers `select` / `groups` / `actions` non triables.
5. Reset tri (3e clic) → retour défaut `created_at desc`.

- [ ] **Step 3: Propose commit docs (user)**

```bash
git add docs/superpowers/specs/2026-07-24-contacts-server-sort-lazy-design.md docs/superpowers/plans/2026-07-24-contacts-server-sort-lazy.md
git commit -m "$(cat <<'EOF'
docs: approve contacts server-sort spec + plan

EOF
)"
```

---

## Spec coverage (self-review)

| Spec item | Task |
|-----------|------|
| Order PostgREST in `fetchClientsPage` | 3 |
| `useInfiniteList` sort + reset + loadMore same order | 2 |
| Custom `custom_<uuid>` | 1 + 3 |
| Number = lexico (no cast) | 1 (path text) — no cast code |
| Default empty sort | 1 |
| Wire ContactsView / no client re-sort | 4 |
| Phase 2 other lists out of scope | 2 only ignores sort |
| Nulls last | 3 `nullsFirst: false` |
| Tests map | 1 |
| Manual verify | 5 |

No TBD / placeholders. Types `ContactListSort` / `ListSort` aligned (`id` + `desc`).

## Phase 2 (hors plan)

Après OK user sur Contacts : même pattern groupes / campagnes / liens / modèles (map domain + `fetchXPage` + controlled sorting).
