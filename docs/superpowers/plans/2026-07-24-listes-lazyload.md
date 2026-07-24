# Listes lazyload — Implementation Plan

> **For agent:** no auto commit / no heavy cmds (smsclient rules). Propose `pnpm test:unit` to user.

**Spec:** `docs/superpowers/specs/2026-07-24-listes-lazyload-design.md`

## Files

| File | Role |
|------|------|
| `lib/supabase/postgrestChunk.ts` | + `LIST_PAGE_SIZE` |
| `lib/supabase/clients.ts` | `fetchClientsPage` (+ unsubscribed query) |
| `lib/supabase/groups.ts` | `fetchGroupsPage` |
| `lib/supabase/campaigns.ts` | `fetchSmsCampaignsPage` |
| `lib/supabase/links.ts` | `fetchSmsLinksPage` |
| `lib/supabase/smsTemplates.ts` | `fetchUserSmsTemplatesPage` |
| `lib/supabase/credits.ts` | `fetchPurchasesPage` |
| `hooks/useInfiniteList.ts` | shared loadMore/search/reset |
| `hooks/useContacts.ts` etc. | wire pages |
| `components/smsclient/DataTable.tsx` | infinite scroll, drop Pager |
| Views | pass `onLoadMore` / `hasMore` / server search |

## Task 1 — DataTable infinite

Remove pagination model + Pager. Add sentinel + `onLoadMore` / `hasMore` / `loadingMore`.

## Task 2 — Contacts page fetch + hook

`fetchClientsPage`, memberships for page only, search `or` ilike. Hook search debounce + loadMore. Dedicated unsubscribed fetch.

## Task 3 — Other domains

Same page pattern for groups, campaigns, links, templates, invoices.

## Task 4 — Wire views + prototype data

Remove `pageSize`, wire search to hooks, fix footer counts, groupOptions from groups.

## Verify (user)

```bash
pnpm test:unit
pnpm dev
```

Manual: Contacts 1000+ rows — first paint < few s, scroll loads more, search hits DB, no Pager.
