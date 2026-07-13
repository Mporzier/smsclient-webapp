---
name: no-verify-build
description: >
  Interdit à l'agent toute vérification build (pnpm build, next build, tsc).
  Le build est fait par l'utilisateur. Use when finishing a task, claiming
  "done"/"fixed", verification-before-completion urges a build, or user says
  "pas de verification build", "build moi", "/no-verify-build".
  Always-on mirror: .cursor/rules/testing-no-auto-run.mdc.
---

# no-verify-build

**Always-on** : rule `.cursor/rules/testing-no-auto-run.mdc`.

Pas de verification build. Le build est fait par moi.

Voir aussi skill `no-heavy-cmds` (install, lint, tests, dlx, docker, …).

## Interdit (agent)

- `pnpm build`, `next build`, `pnpm exec next build`
- `tsc`, `tsc --noEmit`, `pnpm exec tsc`
- Boucles « fix → build → fix » (y compris sous-agents)
- Contourner via skill `verification-before-completion` ou claim « build OK » sans que l’user ait lancé le build

## Autorisé

- Donner la commande à lancer **manuellement**, sans l’exécuter :
  ```bash
  pnpm build
  ```
- Lire une erreur / log **fourni** par l’utilisateur

## Fin de tâche

Dire ce qui a changé. Proposer `pnpm build` si utile. **Ne pas** le lancer.
