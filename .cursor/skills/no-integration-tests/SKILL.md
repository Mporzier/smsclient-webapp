---
name: no-integration-tests
description: >
  Interdit à l'agent d'exécuter les tests d'intégration (pnpm test:integration,
  vitest tests/integration). Manuel seulement. Use when about to run
  integration tests, after editing ImportContactsModal / flow harnesses,
  verification-before-completion urges tests, or user says "pas d'intégration",
  "tests integration manuel", "/no-integration-tests".
  Always-on mirror: .cursor/rules/testing-no-auto-run.mdc.
---

# no-integration-tests

**Always-on** : rule `.cursor/rules/testing-no-auto-run.mdc`.

ne jamais run tests integration. manuel seulement

## Interdit (agent)

- `pnpm test:integration`
- `vitest run tests/integration` (ou tout path sous `tests/integration/`)
- `pnpm test` / `pnpm test:all` si ça inclut l’intégration
- Boucles « fix → test:integration → fix » (y compris sous-agents)

## Autorisé

- Donner la commande à lancer **manuellement**, sans l’exécuter :
  ```bash
  pnpm test:integration
  ```
- Lire / éditer fichiers sous `tests/integration/`
- Diagnostiquer à partir d’un log **fourni** par l’utilisateur (skill `test-debug-vitest`)

## Fin de tâche

Dire ce qui a changé. Proposer `pnpm test:integration` si utile. **Ne pas** le lancer.
