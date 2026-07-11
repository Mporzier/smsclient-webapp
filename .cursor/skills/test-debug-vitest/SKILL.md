---
name: test-debug-vitest
description: >
  Diagnose Vitest unit/integration test failure from error message or failed test name.
  Use when vitest fails, assertion mismatch, mock/harness issue, or importContacts/groupes flow breaks.
---

# test-debug-vitest

## Before reading code

1. User must paste error line or failed test name.
2. Classify: unit (`tests/unit/`) vs integration (`tests/integration/`).

## Entry points (read these first, not whole app)

| Layer | Files |
|-------|-------|
| Setup | `tests/setup/vitest.setup.ts`, `vitest.config.ts` |
| Unit lib | `tests/unit/lib/`, `tests/unit/components/` |
| Integration harness | `tests/integration/harness/ContactsFlowHarness.tsx`, `GroupesFlowHarness.tsx` |
| Mock data | `tests/integration/helpers/mockData.ts` |

## Domain shortcuts

- Routes: `lib/proto/routes.ts` + `tests/unit/lib/proto/routes.test.ts`
- SMS encoding/stop: `lib/proto/smsEncoding.ts`, `smsStopMention.ts` + matching unit tests
- Dashboard helpers: `components/smsclient/views/dashboard/dashboardHelpers.ts` + unit test
- Knowledge base: `lib/knowledgeBase.ts` + unit test
- Contacts import flow: `tests/integration/contacts.import.test.tsx`, `contacts.flow.test.tsx`
- Groupes flow: `tests/integration/groupes.flow.test.tsx`

## Rules

- Never read `PrototypeApp.tsx` whole — use `Grep` + `offset`/`limit`.
- One hypothesis → one minimal fix → stop.
- Never run `vitest` — give user command:

```bash
pnpm test:unit
pnpm test:integration
pnpm test:unit -- tests/unit/lib/proto/routes.test.ts
```

## Playwright (if e2e, not vitest)

Redirect to selectors first: `tests/e2e/helpers/selectors.ts`, `fixtures.ts`, `auth.ts`.

```bash
pnpm test:e2e -- tests/e2e/public/auth-login.spec.ts
```
