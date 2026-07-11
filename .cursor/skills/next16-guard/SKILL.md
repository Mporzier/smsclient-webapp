---
name: next16-guard
description: >
  Guard before writing Next.js code in smsclient. Next 16 breaks vs training data.
  Use when adding routes, layouts, server components, middleware, or data fetching.
---

# next16-guard

## Mandatory

Read relevant guide in `node_modules/next/dist/docs/` before writing Next code.

## smsclient layout

- `app/` — App Router only (/, auth/*, capture)
- `app/layout.tsx` — root layout
- Proto UI = client components under `components/smsclient/`
- No pages/ directory

## Check before edit

1. API still exists in Next 16 docs?
2. Deprecation notice in `node_modules/next/dist/docs/`?
3. Server vs client boundary (`"use client"`)?

## Do not

- Assume Pages Router patterns
- Read all of `node_modules/next/` — docs path only
- Copy Stack Overflow answers pre-2025 without doc check

## Quick refs

- New route: `app/<segment>/page.tsx`
- Client-only proto: keep in `components/`, import from `app/page.tsx`
