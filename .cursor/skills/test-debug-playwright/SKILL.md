---
name: test-debug-playwright
description: >
  Diagnose Playwright e2e failure from error message or spec path.
  Use when playwright test fails, selector timeout, auth setup breaks, or route smoke fails.
---

# test-debug-playwright

## Before reading code

1. User paste error line or failed spec path.
2. Classify: public (`tests/e2e/public/`) vs app (`tests/e2e/app/`).

## Entry points (read first)

| Layer | Files |
|-------|-------|
| Config | `playwright.config.ts` |
| Auth setup | `tests/e2e/auth.setup.ts`, `tests/e2e/helpers/auth.ts` |
| Selectors | `tests/e2e/helpers/selectors.ts` |
| Fixtures | `tests/e2e/helpers/fixtures.ts`, `env.ts`, `app.ts` |

## Spec map

| Spec | Domain |
|------|--------|
| `public/auth-login.spec.ts` | login form |
| `public/auth-signup.spec.ts` | signup form |
| `public/capture.spec.ts` | QR capture page |
| `app/routes.smoke.spec.ts` | proto routes smoke |

## Rules

- Never read `Shell.tsx` or `CampaignWizard.tsx` whole — `Grep` + offset.
- One hypothesis → one fix → stop.
- Never run `playwright test` — give user:

```bash
pnpm test:e2e -- tests/e2e/public/auth-login.spec.ts
pnpm test:e2e:ui
```

## Vitest redirect

Unit/integration failure → skill `test-debug-vitest`.
