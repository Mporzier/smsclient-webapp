# List column filters — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline). Ce repo **interdit** `Task` / subagents sauf demande user (`agent-session-limits`). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Filtres AND sur toutes les colonnes Contacts + Groupes, appliqués serveur (lazy + select-all + delete matching), via `columnFilters` TanStack comme le tri.

**Architecture:** Types + normalize dans `lib/proto/listFilters.ts`. Apply PostgREST async (`clientListFilters` / `groupListFilters`) après search. `useInfiniteList` reset sur `filters` comme `search`/`sort`. DataTable expose `columnFilters` + `manualFiltering` (pas `getFilteredRowModel`). UI = popover header + chips.

**Tech Stack:** Next.js 16, React 19, Supabase JS / PostgREST, TanStack Table (`ColumnFiltersState`), Vitest, i18n `listFilter.*`.

**Spec:** `docs/superpowers/specs/2026-09-04-list-column-filters-design.md`

## Global Constraints

- UI filtres = **ContactsView + GroupesView** seulement.
- Combinaison colonnes = AND ; multi-valeurs (`in`, `isMemberOf`) = OR.
- Search barre AND filtres. Pas de `getFilteredRowModel`.
- `select` / `actions` / `avatar` : jamais filtrables.
- Persist URL / localStorage : non.
- Wizard / GroupModal : pas d’UI ; `filters?` absent = no-op.
- `.in()` : `chunkList` / `POSTGREST_IN_CHUNK` (skill `postgrest-in-chunk`). Jamais `.in(huge)`.
- Custom number : **pas** compare lexico. RPC ids puis `id.in` chunké en OR.
- Custom date : valeurs `YYYY-MM-DD` — compare texte ISO OK.
- Agent : **pas** `pnpm test*` / `pnpm build` / `pnpm lint` / commit / push. Proposer commandes ; user lance.
- Commit steps = **à proposer à l’user**, jamais exécutés par l’agent.
- Pas de `Task` / subagent sauf demande explicite.

---

## File map

| File | Role |
|------|------|
| `lib/proto/listFilters.ts` | Ops, `ListFilterValue`, normalize, presets date, civil day |
| `tests/unit/lib/proto/listFilters.test.ts` | Normalize / skip / presets / bounds |
| `lib/supabase/clientListFilters.ts` | Apply filtres clients (async, membership + custom number) |
| `lib/supabase/groupListFilters.ts` | Apply filtres groupes |
| `tests/unit/lib/supabase/clientListFilters.test.ts` | Resolve clauses / skip / id map |
| `tests/unit/lib/supabase/groupListFilters.test.ts` | Resolve clauses groupes |
| `supabase/migrations/20260904180000_list_client_ids_custom_number.sql` | RPC custom number |
| `lib/supabase/clients.ts` | `filters?` sur page / count / ids / delete |
| `lib/supabase/groups.ts` | `filters?` sur page / count / match |
| `lib/supabase/campaignAudience.ts` | `fetchClientIds` : RPC si pas de filtres, sinon PostgREST |
| `hooks/useInfiniteList.ts` | `filters` option + pass + reset |
| `hooks/useContacts.ts` / `useGroups.ts` | State `columnFilters` |
| `components/smsclient/DataTable.tsx` | Contrat + icône slot header + empty si filtres |
| `components/smsclient/DataTableColumnFilter.tsx` | Popover op + valeur |
| `components/smsclient/ListFilterChips.tsx` | Chips clear |
| `lib/i18n/messages.ts` | `listFilter.*` FR+EN |
| `views/ContactsView.tsx` / `GroupesView.tsx` | Wire + chips + meta colonnes |
| `prototypeApp/routes/audienceRoutes.tsx` | Pass filters aux fetch match-all / delete |
| `prototypeApp/actions/useContactActions.ts` | `deleteClientsMatching` + filters |
| `tests/integration/harness/*` | Props optionnelles si types cassent |

---

### Task 1: Types + normalize + dates

**Files:**
- Create: `lib/proto/listFilters.ts`
- Create: `tests/unit/lib/proto/listFilters.test.ts`

**Interfaces:**
- Produces:
  - `ListFilterOp`, `ListFilterValue`, `DatePreset`, `ListColumnFilter`
  - `OPS_WITHOUT_VALUE: ReadonlySet<ListFilterOp>`
  - `isListFilterValue(v: unknown): v is ListFilterValue`
  - `normalizeListFilters(filters: readonly ListColumnFilter[]): NormalizedListFilter[]`
  - `civilDayBounds(isoDate: string): { startIso: string; endIso: string }`
  - `expandDatePreset(preset: DatePreset, now: Date): { op: "on" | "between"; value: string | { from: string; to: string } }`
  - `listFiltersKey(filters: readonly ListColumnFilter[]): string`

- [x] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import {
  expandDatePreset,
  isListFilterValue,
  listFiltersKey,
  normalizeListFilters,
} from "@/lib/proto/listFilters";

describe("isListFilterValue", () => {
  it("accepts op-only empty filters", () => {
    expect(isListFilterValue({ op: "isEmpty" })).toBe(true);
  });
  it("rejects missing op", () => {
    expect(isListFilterValue({ value: "x" })).toBe(false);
  });
});

describe("normalizeListFilters", () => {
  it("drops unknown shape, empty string, empty array", () => {
    expect(
      normalizeListFilters([
        { id: "notes", value: { op: "contains", value: "  " } },
        { id: "source", value: { op: "in", value: [] } },
        { id: "notes", value: { op: "contains", value: "vip" } },
        { id: "select", value: { op: "contains", value: "x" } },
      ]),
    ).toEqual([{ id: "notes", op: "contains", value: "vip" }]);
  });

  it("keeps value-less ops", () => {
    expect(
      normalizeListFilters([{ id: "notes", value: { op: "isEmpty" } }]),
    ).toEqual([{ id: "notes", op: "isEmpty" }]);
  });

  it("drops select/actions/avatar ids", () => {
    expect(
      normalizeListFilters([
        { id: "actions", value: { op: "isNotEmpty" } },
      ]),
    ).toEqual([]);
  });
});

describe("expandDatePreset", () => {
  const now = new Date(2026, 8, 4, 15, 0, 0); // 4 sep 2026 local
  it("today -> on that civil day", () => {
    expect(expandDatePreset("today", now)).toEqual({
      op: "on",
      value: "2026-09-04",
    });
  });
  it("last7 inclusive 7 days", () => {
    expect(expandDatePreset("last7", now)).toEqual({
      op: "between",
      value: { from: "2026-08-29", to: "2026-09-04" },
    });
  });
  it("thisMonth is calendar month", () => {
    expect(expandDatePreset("thisMonth", now)).toEqual({
      op: "between",
      value: { from: "2026-09-01", to: "2026-09-30" },
    });
  });
});

describe("listFiltersKey", () => {
  it("stable for same filters", () => {
    const a = [{ id: "source", value: { op: "equals", value: "Import CSV" } }];
    expect(listFiltersKey(a)).toBe(listFiltersKey([...a]));
  });
});
```

- [ ] **Step 2: User runs** `pnpm test:unit tests/unit/lib/proto/listFilters.test.ts` — expect FAIL (module missing).

- [x] **Step 3: Implement `lib/proto/listFilters.ts`**

```ts
export const FILTER_SKIP_IDS = new Set(["select", "actions", "avatar"]);

export type ListFilterOp =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "isEmpty"
  | "isNotEmpty"
  | "in"
  | "notIn"
  | "isMemberOf"
  | "isNotMemberOf"
  | "hasNoGroup"
  | "hasAnyGroup"
  | "on"
  | "before"
  | "after"
  | "between"
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte";

export type DatePreset = "today" | "last7" | "last30" | "thisMonth";

export type ListFilterRange = { from: string; to: string };

export type ListFilterValue = {
  op: ListFilterOp;
  value?: string | string[] | ListFilterRange;
};

export type ListColumnFilter = { id: string; value: unknown };

export type NormalizedListFilter = {
  id: string;
  op: ListFilterOp;
  value?: string | string[] | ListFilterRange;
};

export const OPS_WITHOUT_VALUE: ReadonlySet<ListFilterOp> = new Set([
  "isEmpty",
  "isNotEmpty",
  "hasNoGroup",
  "hasAnyGroup",
]);

const OPS: ReadonlySet<string> = new Set<ListFilterOp>([
  "contains",
  "notContains",
  "equals",
  "notEquals",
  "startsWith",
  "isEmpty",
  "isNotEmpty",
  "in",
  "notIn",
  "isMemberOf",
  "isNotMemberOf",
  "hasNoGroup",
  "hasAnyGroup",
  "on",
  "before",
  "after",
  "between",
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
]);

export function isListFilterValue(v: unknown): v is ListFilterValue {
  return (
    typeof v === "object" &&
    v !== null &&
    "op" in v &&
    typeof (v as { op: unknown }).op === "string" &&
    OPS.has((v as { op: string }).op)
  );
}

function valueIsFilled(
  op: ListFilterOp,
  value: ListFilterValue["value"],
): boolean {
  if (OPS_WITHOUT_VALUE.has(op)) return true;
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some((x) => x.trim().length > 0);
  return value.from.trim().length > 0 && value.to.trim().length > 0;
}

export function normalizeListFilters(
  filters: readonly ListColumnFilter[],
): NormalizedListFilter[] {
  const out: NormalizedListFilter[] = [];
  for (const f of filters) {
    if (FILTER_SKIP_IDS.has(f.id)) continue;
    if (!isListFilterValue(f.value)) continue;
    if (!valueIsFilled(f.value.op, f.value.value)) continue;
    const trimmed =
      typeof f.value.value === "string" ? f.value.value.trim() : f.value.value;
    out.push({ id: f.id, op: f.value.op, value: trimmed });
  }
  return out;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function civilDayBounds(isoDate: string): {
  startIso: string;
  endIso: string;
} {
  const [y, m, d] = isoDate.split("-").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export function expandDatePreset(
  preset: DatePreset,
  now: Date,
): { op: "on" | "between"; value: string | { from: string; to: string } } {
  if (preset === "today") return { op: "on", value: ymd(now) };
  if (preset === "last7") {
    const from = new Date(now);
    from.setDate(from.getDate() - 6);
    return { op: "between", value: { from: ymd(from), to: ymd(now) } };
  }
  if (preset === "last30") {
    const from = new Date(now);
    from.setDate(from.getDate() - 29);
    return { op: "between", value: { from: ymd(from), to: ymd(now) } };
  }
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { op: "between", value: { from: ymd(from), to: ymd(to) } };
}

export function listFiltersKey(filters: readonly ListColumnFilter[]): string {
  return JSON.stringify(normalizeListFilters(filters));
}
```

- [x] **Step 4: User runs** same vitest path — expect PASS.

- [ ] **Step 5: Propose commit**

```bash
git add lib/proto/listFilters.ts tests/unit/lib/proto/listFilters.test.ts
git commit -m "feat: normalize list column filters and date presets"
```

---

### Task 2: Resolve + apply clients (hors UI)

**Files:**
- Create: `lib/supabase/clientListFilters.ts`
- Create: `tests/unit/lib/supabase/clientListFilters.test.ts`
- Create: `supabase/migrations/20260904180000_list_client_ids_custom_number.sql`

**Interfaces:**
- Consumes: `normalizeListFilters`, `civilDayBounds`, `escapeIlike` (`lib/supabase/clientSearch.ts`)
- Produces:
  - `CLIENT_FILTER_COLUMNS: Record<string, { kind: "text" | "date" | "source" | "groups" | "lastSms" | "lastSmsBody" | "custom" }>`
  - `resolveClientFilterColumn(id: string): ResolvedClientColumn | null`
  - `applyClientListFilters(supabase, query, filters): Promise<T>`
  - `applyIdOrFilter(query, ids: string[]): T` — empty ids = match nothing

**Resolved map (native):**

| id | column | kind |
|----|--------|------|
| `firstName` | `first_name` | text |
| `lastName` | `last_name` | text |
| `phone` | `phone_e164` | text |
| `notes` | `notes` | text |
| `source` | `source` | source |
| `created` | `created_at` | date |
| `lastSms` | `last_sms_sent_at` | date |
| `lastSmsBody` | `last_sms_body` | text |
| `groups` | membership | groups |
| `custom_<uuid>` | `custom_fields->>uuid` | custom (type fourni à apply via optional `customFieldTypes?: Record<string, "text" \| "number" \| "date">`) |

`applyClientListFilters` 4e arg optionnel `opts?: { customFieldTypes?: Record<string, CustomFieldType> }`. Si type absent, traiter custom comme **text**.

- [x] **Step 1: Failing tests** sur `resolveClientFilterColumn` + skip unknown id + custom uuid safe (même regex que `contactSort.ts`) + `orFilterForText` snapshots (string PostgREST).

```ts
import { describe, expect, it } from "vitest";
import {
  orFilterForText,
  resolveClientFilterColumn,
} from "@/lib/supabase/clientListFilters";

describe("resolveClientFilterColumn", () => {
  it("maps native ids", () => {
    expect(resolveClientFilterColumn("firstName")).toEqual({
      kind: "text",
      column: "first_name",
    });
    expect(resolveClientFilterColumn("lastSms")).toEqual({
      kind: "date",
      column: "last_sms_sent_at",
    });
    expect(resolveClientFilterColumn("groups")).toEqual({ kind: "groups" });
  });
  it("maps safe custom_ uuid", () => {
    const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    expect(resolveClientFilterColumn(`custom_${id}`)).toEqual({
      kind: "custom",
      fieldId: id,
    });
  });
  it("returns null for junk", () => {
    expect(resolveClientFilterColumn("custom_nope")).toBeNull();
    expect(resolveClientFilterColumn("avatar")).toBeNull();
  });
});

describe("orFilterForText", () => {
  it("contains uses escaped ilike", () => {
    expect(orFilterForText("notes", "contains", "a%b")).toBe(
      `notes.ilike."%a\\%b%"`,
    );
  });
  it("notContains includes empty", () => {
    expect(orFilterForText("notes", "notContains", "x")).toBe(
      `notes.is.null,notes.eq.,notes.not.ilike."%x%"`,
    );
  });
  it("isEmpty is null or empty string", () => {
    expect(orFilterForText("notes", "isEmpty")).toBe(`notes.is.null,notes.eq.`);
  });
});
```

- [ ] **Step 2: User runs** `pnpm test:unit tests/unit/lib/supabase/clientListFilters.test.ts` — FAIL.

- [x] **Step 3: Implement apply**

Text : `query.or(orFilterForText(...))`.

Date native (`timestamptz`) :

- `on` : `.gte(col, startIso).lte(col, endIso)` (`civilDayBounds`)
- `before` : `.lt(col, startIso)`
- `after` : `.gt(col, endIso)`
- `between` : `.gte(from.start).lte(to.end)`
- `isEmpty` : `.is(col, null)`
- `isNotEmpty` : `.not(col, "is", null)`

Source `in` / `notIn` : `chunkList(values)` ; `in` = `.or(values.map(v => `source.eq.${v}`).join(","))` si peu, ou `.in` par chunk **OR** (`source.in.(a,b)` chunks joints par `.or`). `notIn` = AND de `.not("source", "in", chunk)`.

Membership (async, user courant) :

1. `hasAnyGroup` / `hasNoGroup` : paginer `client_group_members` → `client_id` distincts du user (via embed ou `client_id` où `group_id` in groups du user). Plus simple : `from("client_group_members").select("client_id")` paginé (`paginateRange` + `POSTGREST_PAGE`) — RLS limite au user.
2. `isMemberOf` / `isNotMemberOf` : même table `.in("group_id", chunk group ids)` puis ids clients.
3. `hasAnyGroup` / `isMemberOf` : `applyIdOrFilter(query, ids)` (`id.in.(chunk),id.in.(chunk2)` via `.or`).
4. `hasNoGroup` / `isNotMemberOf` : `applyIdNotFilter` = AND `.not("id", "in", chunk)` pour chaque chunk. Si `ids` vide : `hasNoGroup` = tous (no-op) ; `isMemberOf` vide = match nothing.

Custom text : `orFilterForText(\`custom_fields->>${fieldId}\`, op, value)` — **seulement** si `fieldId` match `SAFE_CUSTOM_ID`.

Custom date : mêmes ops date mais colonnes texte `YYYY-MM-DD` : `on` = `.eq(col, isoDay)` ; `before` = `.lt(col, isoDay)` ; `after` = `.gt(col, isoDay)` ; `between` = `.gte(from).lte(to)` ; empty = null OR `eq.`

Custom number : si op numérique, appeler RPC ci-dessous → ids → `applyIdOrFilter` / `applyIdNotFilter` (`neq` = not those ids **plus** empty? `neq` = pas cette valeur : OR empty + autres nombres. RPC doit renvoyer les ids qui **matchent** l’op, puis `in`).

RPC :

```sql
create or replace function public.list_client_ids_custom_number(
  p_field_id uuid,
  p_op text,
  p_a numeric,
  p_b numeric default null,
  p_eligible_only boolean default true
)
returns uuid[]
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(array_agg(c.id order by c.id), '{}'::uuid[])
  from public.clients c
  where c.user_id = auth.uid()
    and c.deleted_at is null
    and (
      not p_eligible_only
      or (c.opt_in = true and c.stop_sms = false)
    )
    and nullif(c.custom_fields->>p_field_id::text, '') is not null
    and (
      (p_op = 'eq' and (c.custom_fields->>p_field_id::text)::numeric = p_a)
      or (p_op = 'neq' and (c.custom_fields->>p_field_id::text)::numeric <> p_a)
      or (p_op = 'gt' and (c.custom_fields->>p_field_id::text)::numeric > p_a)
      or (p_op = 'gte' and (c.custom_fields->>p_field_id::text)::numeric >= p_a)
      or (p_op = 'lt' and (c.custom_fields->>p_field_id::text)::numeric < p_a)
      or (p_op = 'lte' and (c.custom_fields->>p_field_id::text)::numeric <= p_a)
      or (
        p_op = 'between'
        and (c.custom_fields->>p_field_id::text)::numeric >= p_a
        and (c.custom_fields->>p_field_id::text)::numeric <= coalesce(p_b, p_a)
      )
    );
$$;

grant execute on function public.list_client_ids_custom_number(uuid, text, numeric, numeric, boolean) to authenticated;
```

`isEmpty` / `isNotEmpty` custom number : PostgREST `custom_fields->>id` null/eq. / not — **pas** la RPC.

Cast invalide : ignorer la ligne (SQL exception abort). Wrap : `and (c.custom_fields->>p_field_id::text) ~ '^-?[0-9]+(\\.[0-9]+)?$'` avant cast.

AND : enchaîner les `.or` / `.gte` sur le même `query`.

Unknown id : skip (normalize déjà, resolve null = skip).

- [ ] **Step 4: User runs** unit tests + applique la migration sur son projet Supabase (user). Agent **ne** lance **pas** supabase CLI.

- [ ] **Step 5: Propose commit**

```bash
git add lib/supabase/clientListFilters.ts tests/unit/lib/supabase/clientListFilters.test.ts supabase/migrations/20260904180000_list_client_ids_custom_number.sql
git commit -m "feat: apply client list column filters on PostgREST"
```

---

### Task 3: Apply groupes

**Files:**
- Create: `lib/supabase/groupListFilters.ts`
- Create: `tests/unit/lib/supabase/groupListFilters.test.ts`

**Interfaces:**
- Produces: `applyGroupListFilters(query, filters): T` (sync — pas de membership)
- Map :

| id | column | kind |
|----|--------|------|
| `name` | `name` | text |
| `description` | `description` | text |
| `contactCount` | `member_count` | number |
| `lastCampaignLabel` | `last_campaign_at` | date |
| `createdLabel` | `created_at` | date |

Number native PostgREST : `.eq` / `.neq` / `.gt` / `.gte` / `.lt` / `.lte` ; `between` = gte+lte ; `isEmpty` : `member_count` est NOT NULL (default 0) — `eq(0)` pour empty **uniquement si** on documente empty = 0. Spec « vide » sur count : traiter `isEmpty` comme `eq(0)`, `isNotEmpty` comme `gt(0)`.

- [x] **Step 1:** Tests resolve + `orFilterForText` reuse (importer depuis `clientListFilters` **ou** extraire `lib/supabase/listFilterSql.ts` si duplication > 15 lignes — préférer extraire `orFilterForText` + `applyDateColumn` dans `lib/supabase/listFilterSql.ts` à ce moment, update Task 2 imports).

- [x] **Step 2–4:** FAIL / impl / PASS (user).

- [ ] **Step 5: Propose commit** `feat: apply group list column filters`

---

### Task 4: Wire fetch supabase

**Files:**
- Modify: `lib/supabase/clients.ts` — `FetchClientsPageArgs.filters?`, `countClientIds`, `fetchClientIds`, `deleteClientsMatching`
- Modify: `lib/supabase/groups.ts` — page / count / fetchMatching
- Modify: `lib/supabase/campaignAudience.ts` — `listClientIdsRpc` inchangé ; `fetchClientIds` branche

**Interfaces:**
- `filters?: ListColumnFilter[]` partout (compatible `ColumnFiltersState`)
- Après `applyClientListSearch` / `applyGroupListSearch` : `query = await applyClientListFilters(...)` (clients) / `applyGroupListFilters` (groupes)
- `fetchClientIds` : si `normalizeListFilters(filters).length === 0` → RPC `list_client_ids` existant ; sinon `paginateRange` `select("id")` + search + apply filters + `eligibleOnly`
- `countClientIds` / `deleteClientsMatching` : toujours apply filters (no-op si vide)
- `fetchMatchingGroups` / `countMatchingGroups` : `filters?`
- Distinct sources (pour UI Task 7) : ajouter `fetchDistinctClientSources(supabase): Promise<string[]>` — `select("source")` paginé + `Set` (liste courte). Pas de DISTINCT SQL requis.

`applyClientListFilters` a besoin `eligibleOnly` pour la RPC number : passer `args.eligibleOnly ?? true`.

- [x] **Step 1:** Pas de test auto lourd. Grep manuel : chaque `applyClientListSearch` **liste principale** (page, count, ids, delete) a un apply filters à la suite. **Ne pas** toucher picker `fetchContactPickerPage` / wizard RPCs.

- [x] **Step 2: Implement** les 4 fonctions clients + 3 groupes.

Exemple page :

```ts
query = applyClientListSearch(query, args.search ?? "");
query = await applyClientListFilters(supabase, query, args.filters ?? [], {
  customFieldTypes: args.customFieldTypes,
  eligibleOnly: args.eligibleOnly ?? false,
});
```

`FetchClientsPageArgs` + `customFieldTypes?` pour que le hook passe les defs.

- [ ] **Step 3: Propose commit** `feat: pass column filters through contact and group fetches`

---

### Task 5: `useInfiniteList` + hooks

**Files:**
- Modify: `hooks/useInfiniteList.ts`
- Modify: `hooks/useContacts.ts`
- Modify: `hooks/useGroups.ts`

**Interfaces:**
- `UseInfiniteListOptions.filters?: ListColumnFilter[]`
- `FetchPageFn` gagne `filters: ListColumnFilter[]`
- `filtersKey = listFiltersKey(filters ?? [])` dans deps reset (avec `search`, `sortKey`, `reloadKey`)
- `fetchPage({ ..., filters: filtersRef.current ?? [] })` sur offset 0, loadMore, refresh
- `useContacts` / `useGroups` : `const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])` ; passer à `useInfiniteList` + `fetchPage`
- `useContacts.fetchPage` passe `filters` + `customFieldTypes` depuis defs déjà dispo ? Si defs vivent hors du hook, passer `filters` seul et types text par défaut **ou** lire defs dans `useContacts` si déjà fetch. Si `useContacts` n’a pas les defs : `customFieldTypes` optionnel — text fallback OK jusqu’à Task 8 où `useContacts` reçoit defs **ou** ContactsView ne peut pas passer types au fetch.

**Décision :** `useContacts` expose `columnFilters` / `setColumnFilters`. `customFieldTypes` : ajouter arg optionnel `useContacts({ customFieldTypes })` **seulement si** defs déjà au compositor. Sinon Task 8 : passer types via ref/callback `setCustomFieldTypes` depuis la vue après load defs. Plus simple : `usePrototypeData` a déjà les defs contacts — passer dans `useContacts(true, customFieldTypes)`.

Chercher où `customFieldDefs` est chargé (`useCustomFieldDefs` / params). Si hors contacts hook : Task 8 passe `customFieldTypes` dans `fetchClientsPage` via un `useRef` tenu par `useContacts` + `setCustomFieldFilterTypes` exporté.

- [x] **Step 1:** Étendre `FetchPageFn` + 3 appels `fetchPage` dans `useInfiniteList` (effect, loadMore, refresh).

- [x] **Step 2:** Hooks state + return `columnFilters`, `setColumnFilters`.

- [ ] **Step 3: Propose commit** `feat: reset infinite lists when column filters change`

---

### Task 6: DataTable contrat

**Files:**
- Modify: `components/smsclient/DataTable.tsx`

**Interfaces:**
- Props : `columnFilters?: ColumnFiltersState` ; `onColumnFiltersChange?: (updater: SetStateAction<ColumnFiltersState>) => void` ; `manualFiltering?: boolean` (défaut false, **true** sur contacts/groupes) ; `hasActiveFilters?: boolean`
- `useReactTable` : `state: { sorting, columnSizing, columnFilters: columnFilters ?? [] }`, `onColumnFiltersChange`, `manualFiltering: manualFiltering ?? true` (listes proto = toujours manuel ; pas de `getFilteredRowModel`)
- `NO_FILTER_IDS` = même set que `NO_SORT_IDS`
- `withColumnDefaults` : `enableColumnFilter: false` si id dans NO_FILTER_IDS
- Empty : `isSearchEmpty` si `data.length === 0` && (`globalFilter.trim()` **ou** `hasActiveFilters`)
- Header : après le bouton tri (ou à droite du label), si `header.column.getCanFilter()`, rendre `{header.column.columnDef.meta?.filterSlot?.(header.column)}`  
  **Mieux :** prop render

```ts
renderColumnFilter?: (columnId: string) => ReactNode;
```

DataTable appelle `renderColumnFilter(header.column.id)` dans le `<th>`, wrapper `onClick={(e) => e.stopPropagation()}` pour ne pas toggler le tri.

Ne pas importer le popover dans DataTable (reste générique).

- [ ] **Step 1:** Ajouter props + state table + empty + slot.

- [ ] **Step 2: Propose commit** `feat: DataTable controlled columnFilters like sorting`

---

### Task 7: i18n + popover + chips

**Files:**
- Modify: `lib/i18n/messages.ts` — clés **identiques** dans `fr` et `en` (type `MessageKey`)
- Create: `components/smsclient/DataTableColumnFilter.tsx`
- Create: `components/smsclient/ListFilterChips.tsx`

**Interfaces:**
- `DataTableColumnFilterProps` :
  - `columnId: string`
  - `kind: "text" | "source" | "groups" | "date" | "number" | "lastSms"`
  - `value: ListFilterValue | undefined` (pour `lastSms` : lire aussi `lastSmsBody` via helpers)
  - `onChange: (next: ListColumnFilter[]) => void` — merge dans `columnFilters` (replace same id ; lastSms écrit 1–2 ids)
  - `sourceOptions?: string[]`
  - `groupOptions?: { id: string; name: string }[]`
- `ListFilterChips` : `filters`, `labels: Record<string, string>`, `onClearId`, `onClearAll`

**i18n keys (FR + EN, coller les deux blocs) :**

```
listFilter.aria
listFilter.apply
listFilter.clear
listFilter.clearAll
listFilter.op.contains
listFilter.op.notContains
listFilter.op.equals
listFilter.op.notEquals
listFilter.op.startsWith
listFilter.op.isEmpty
listFilter.op.isNotEmpty
listFilter.op.in
listFilter.op.notIn
listFilter.op.isMemberOf
listFilter.op.isNotMemberOf
listFilter.op.hasNoGroup
listFilter.op.hasAnyGroup
listFilter.op.on
listFilter.op.before
listFilter.op.after
listFilter.op.between
listFilter.op.eq
listFilter.op.neq
listFilter.op.gt
listFilter.op.gte
listFilter.op.lt
listFilter.op.lte
listFilter.preset.today
listFilter.preset.last7
listFilter.preset.last30
listFilter.preset.thisMonth
listFilter.lastSms.date
listFilter.lastSms.body
listFilter.valuePlaceholder
listFilter.chipBody
```

FR `listFilter.aria` = `Filtrer la colonne` ; `listFilter.chipBody` = `{column} : {op} {value}`.

UI :
- Trigger : `ListFilter` lucide, `text-primary` si actif.
- `Popover` + `Select` op + input (`Input`) / `DatePicker` / multi checkbox groupes-sources / number `Input type="number"`.
- Presets date : 4 boutons qui set `on`/`between` via `expandDatePreset(preset, new Date())`.
- lastSms : deux sous-blocs (date + body contains/empty).
- `stopPropagation` sur tout le trigger.

Chips : `Badge` + bouton × ; `onClearId` enlève l’entrée ; lastSms date+body = 2 chips.

Helper exporté `upsertColumnFilter(prev, id, value | undefined): ColumnFiltersState` — `undefined` retire l’id.

- [ ] **Step 1:** Ajouter clés FR puis EN (même set, sinon `tsc` MessageKey casse).

- [ ] **Step 2:** Composants.

- [ ] **Step 3: Propose commit** `feat: column filter popover and chips`

---

### Task 8: Vues + match-all + delete

**Files:**
- Modify: `components/smsclient/views/ContactsView.tsx`
- Modify: `components/smsclient/views/GroupesView.tsx`
- Modify: `components/smsclient/prototypeApp/routes/audienceRoutes.tsx`
- Modify: `components/smsclient/prototypeApp/actions/useContactActions.ts`
- Modify: harnesses si les props nouvelles sont requises — les rendre **optionnelles** avec défaut `[]`
- Remove `filterFn` mort colonne `groups`

**Interfaces:**
- Props vues : `columnFilters`, `onColumnFiltersChange` (contrôlé comme `sorting`)
- `DataTable` : `columnFilters` `onColumnFiltersChange` `manualFiltering` `hasActiveFilters={normalizeListFilters(columnFilters).length > 0}` `renderColumnFilter={(id) => ...}`
- `useGmailSelectAll({ search: `${searchQuery}::${listFiltersKey(columnFilters)}`, ... })` — reset sélection si filtres changent. `countMatch` / `fetchAllIds` ferment sur `searchQuery` **et** `columnFilters`.
- `onCountSelectableMatches?: (search: string, filters?: ColumnFiltersState) => ...`
- `onFetchSelectableMatchIds` idem
- `onDeleteContactsMatching?: (search: string, countHint: number, filters?: ColumnFiltersState) => void`
- `audienceRoutes` : passer `columnFilters` / setters depuis `useContacts` / `useGroups` ; count/fetch/delete avec `filters`
- `handleDeleteContactsMatching(search, countHint, filters)` → `deleteClientsMatching({ search, eligibleOnly: true, filters })`
- Groupes create-campaign-from-selection : `fetchMatchingGroups(..., { search: groupsState.searchInput, filters: groupsState.columnFilters })`
- `enableColumnFilter: false` déjà DataTable pour select/actions/avatar
- `meta` pas obligatoire si `kindForContactColumn(id, defs)` dans la vue
- `sourceOptions` : `useEffect` load `fetchDistinctClientSources` une fois sur mount contacts
- `groupOptions` : `fetchMatchingGroups(supabase, userId, {})` au mount (déjà paginé) — **ne pas** utiliser seulement `groupsState.rows` (lazy incomplet)

`kindForContactColumn` :
- custom_* → fieldType def → text/number/date
- groups → groups
- source → source
- lastSms → lastSms
- created → date
- sinon text

`kindForGroupColumn` : contactCount → number ; createdLabel / lastCampaignLabel → date ; sinon text.

- [ ] **Step 1:** Props + DataTable + chips sous la barre search (entre search row et error).

- [ ] **Step 2:** Routes + delete action + retire `filterFn`.

- [ ] **Step 3: Propose commit** `feat: wire column filters on contacts and groups lists`

---

### Task 9: Spec status + wiki one-liner (si user OK wiki)

**Files:**
- Already : spec `status: approved`
- Optional : `wiki/hot.md` 4 lignes session filtres — **seulement si** user demande. Sinon skip.

- [ ] **Step 1:** Skip wiki sauf demande.

---

## Vérif manuelle (user, jamais agent)

```bash
pnpm test:unit
pnpm lint
pnpm build
```

Migration : appliquer `20260904180000_list_client_ids_custom_number.sql` sur le projet Supabase.

UI Contacts : filtre source + groupe AND ; search + filtres ; champ perso text ; date created preset 30j ; lastSms date+body ; clear chip ; expand select-all = même set ; delete matching avec filtres.  
UI Groupes : name contains + contactCount gte ; created thisMonth.  
Headers select/actions : pas d’icône filtre ; tri inchangé.

---

## Self-review (plan vs spec)

| Spec | Task |
|------|------|
| columnFilters + manualFiltering | 6 |
| AND colonnes / OR multi | 2–3 |
| Search AND filtres | 4–5 |
| Toutes colonnes + perso | 2, 8 |
| Ops texte / source / groups / date / number | 2–3, 7 |
| lastSms hybride | 7–8 |
| Presets date | 1, 7 |
| Chips + popover header | 7–8 |
| Select-all + delete matching | 4, 8 |
| Wizard `filters?` no-op | 4, 8 |
| Retirer filterFn mort | 8 |
| Pas getFilteredRowModel | 6 |
| chunk .in() | 2 |
| Custom number RPC | 2 |
)
