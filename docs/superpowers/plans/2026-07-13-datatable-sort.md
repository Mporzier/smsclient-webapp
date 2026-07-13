# DataTable sort — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clic header sur les DataTable → tri client simple (none → asc → desc → none), une colonne à la fois, sans persistance.

**Architecture:** Tout dans `components/smsclient/DataTable.tsx` via TanStack `getSortedRowModel` + état `SortingState` local. Les vues héritent du tri sans changement obligatoire.

**Tech Stack:** React, `@tanstack/react-table`, Lucide (`ArrowUpDown`, `ArrowUp`, `ArrowDown`), Tailwind tokens existants.

**Spec:** `docs/superpowers/specs/2026-07-13-datatable-sort-design.md`

**Contraintes repo:** ne pas lancer `pnpm test*` / `pnpm build` (skills `no-integration-tests`, `no-verify-build`, `no-heavy-cmds`). Proposer les commandes ; vérif manuelle par l’user.

---

## File map

| File | Role |
|------|------|
| `components/smsclient/DataTable.tsx` | Tri + UI header |
| `docs/design-system.md` | Cocher L2 tri (sans checkbox) |
| Vues (`ContactsView`, etc.) | Touch seulement si colonne non sensée à trier |

---

### Task 1: Wiring TanStack sorting dans DataTable

**Files:**
- Modify: `components/smsclient/DataTable.tsx`

- [ ] **Step 1: Ajouter imports + état**

```tsx
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
```

Dans le composant :

```tsx
const [sorting, setSorting] = useState<SortingState>([]);
```

- [ ] **Step 2: Brancher `useReactTable`**

```tsx
const table = useReactTable({
  data,
  columns: sizedColumns,
  state: { globalFilter, sorting },
  onSortingChange: setSorting,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  enableSorting: true,
  enableMultiSort: false,
  enableSortingRemoval: true,
  columnResizeMode: "onChange",
  enableColumnResizing: true,
  defaultColumn: {
    size: 160,
    minSize: 80,
    maxSize: 800,
  },
  initialState: { pagination: { pageSize } },
});
```

- [ ] **Step 3: Désactiver tri sur colonnes structurelles**

Étendre `withResizeDefaults` (renommer optionnel en `withColumnDefaults`) :

```tsx
const NO_SORT_IDS = new Set(["select", "actions", "avatar"]);

function withColumnDefaults<T>(
  columns: ColumnDef<T, unknown>[]
): ColumnDef<T, unknown>[] {
  return columns.map((col) => {
    const id = columnId(col);
    const noResize = id === "select" || id === "actions";
    const noSort = id != null && NO_SORT_IDS.has(id);
    return {
      ...col,
      enableResizing: noResize ? false : (col.enableResizing ?? true),
      enableSorting: noSort ? false : (col.enableSorting ?? true),
      minSize: col.minSize ?? (noResize ? 40 : 80),
      maxSize: col.maxSize ?? 800,
    };
  });
}
```

Si une vue passe déjà `enableSorting: false`, le `??` conserve l’override quand `noSort` est false. Quand `noSort` est true, forcer `false`.

- [ ] **Step 4: Commit**

```bash
git add components/smsclient/DataTable.tsx
git commit -m "feat(DataTable): wire TanStack sorting state"
```

---

### Task 2: Header cliquable + icônes

**Files:**
- Modify: `components/smsclient/DataTable.tsx` (bloc `<thead>`)

- [ ] **Step 1: Remplacer le contenu header**

Pour chaque `header` :

```tsx
const canSort = header.column.getCanSort();
const sorted = header.column.getIsSorted(); // false | "asc" | "desc"
const ariaSort =
  sorted === "asc"
    ? "ascending"
    : sorted === "desc"
      ? "descending"
      : canSort
        ? "none"
        : undefined;

<th
  key={header.id}
  aria-sort={ariaSort}
  className={cn(
    "relative whitespace-nowrap border-b border-border bg-muted py-3.5 text-sm font-medium text-foreground",
    isSelectCol ? "px-3 text-center" : "px-[18px] text-left"
  )}
>
  {header.isPlaceholder ? null : canSort ? (
    <button
      type="button"
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-md text-left",
        "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
      onClick={header.column.getToggleSortingHandler()}
    >
      <span className="min-w-0 truncate">
        {flexRender(header.column.columnDef.header, header.getContext())}
      </span>
      {sorted === "asc" ? (
        <ArrowUp className="h-3.5 w-3.5 shrink-0 text-foreground" aria-hidden />
      ) : sorted === "desc" ? (
        <ArrowDown className="h-3.5 w-3.5 shrink-0 text-foreground" aria-hidden />
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
      )}
    </button>
  ) : (
    flexRender(header.column.columnDef.header, header.getContext())
  )}
  {/* resize handle inchangé — stopPropagation déjà présent */}
</th>
```

- [ ] **Step 2: Smoke mental**

- Clic Prénom → asc → desc → none
- Clic Nom pendant tri Prénom → remplace
- Resize ne trie pas
- `select` / `actions` / `avatar` : pas de bouton tri

- [ ] **Step 3: Commit**

```bash
git add components/smsclient/DataTable.tsx
git commit -m "feat(DataTable): sortable column headers"
```

---

### Task 3: Colonnes vues + design-system

**Files:**
- Modify (si besoin) : vues listées ci-dessous
- Modify: `docs/design-system.md`

- [ ] **Step 1: Scan rapide `enableSorting: false`**

Ouvrir et, si une colonne n’a ni `accessorKey` ni `accessorFn` utile (ex. menu actions déjà id `actions`), rien à faire. Sinon ajouter `enableSorting: false` sur colonnes purement décoratives hors `{select,actions,avatar}`.

Fichiers à parcourir (grep `ColumnDef` / `id:` / `accessorKey`) :

- `components/smsclient/views/ContactsView.tsx`
- `components/smsclient/views/GroupesView.tsx`
- `components/smsclient/views/CampagnesView.tsx`
- `components/smsclient/views/ModelesSmsView.tsx`
- `components/smsclient/views/LiensView.tsx`
- `components/smsclient/views/parametres/InvoicesTable.tsx`

- [ ] **Step 2: Design system**

Dans `docs/design-system.md`, section L2 :

```markdown
- [x] L2 : tri colonnes UI (+ Checkbox shadcn encore ouvert)
```

Ou scinder :

```markdown
- [x] L2a : tri colonnes UI
- [ ] L2b : Checkbox shadcn
```

- [ ] **Step 3: Commit**

```bash
git add docs/design-system.md components/smsclient/views/
git commit -m "docs: mark DataTable column sort done"
```

---

### Task 4: Handoff vérif manuelle

- [ ] **Step 1: Donner à l’user (ne pas exécuter)**

```bash
pnpm build
```

Checklist UI :

1. Contacts — tri Prénom / Nom / Date d’ajout (cycle 3 états)
2. Changer de page pagination — ordre tri conservé **dans la session** (état React)
3. Quitter la vue Contacts puis revenir — tri **réinitialisé** (pas de storage)
4. Groupes + Campagnes — smoke clic header
5. Colonne checkbox / actions — pas d’icône tri

---

## Self-review (plan vs spec)

| Spec | Task |
|------|------|
| Toutes DataTable via central | Task 1–2 |
| Cycle none/asc/desc | Task 2 (`enableSortingRemoval`) |
| Mono-colonne | Task 1 `enableMultiSort: false` |
| Pas de persistance | Task 1 `useState` only — rien d’autre |
| ids non triables | Task 1 `NO_SORT_IDS` |
| aria-sort + clavier | Task 2 `button` + `aria-sort` |
| Hors scope import CSV / serveur | non touché |
