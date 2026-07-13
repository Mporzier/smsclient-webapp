---
name: no-heavy-cmds
description: >
  Interdit à l'agent d'exécuter des commandes lourdes (build, test, install,
  lint, tsc, docker, dlx, dev server). L'agent propose les commandes ;
  l'utilisateur les lance. Use when about to run shell verification, install
  deps, shadcn CLI, eslint, or when user says "commandes lourdes", "je run",
  "propose la commande", "/no-heavy-cmds".
  Always-on mirrors: .cursor/rules/agent-session-limits.mdc,
  .cursor/rules/testing-no-auto-run.mdc.
---

# no-heavy-cmds

**Always-on** : `agent-session-limits` + `testing-no-auto-run`.

Tu proposes les commandes. Je les run. Pas de commandes lourdes par toi.

## Priorité

Ce skill + rules `agent-session-limits` / `testing-no-auto-run` **gagnent** sur superpowers (`verification-before-completion`, `executing-plans`).  
Plan/spec « `pnpm build` » / « vérifier » = **proposer** la commande, pas l’exécuter.  
Multi-root : si le travail touche `smsclient-webapp/`, appliquer ces interdits même si un autre root est ouvert.

## Pourquoi (tokens)

Sortie shell / logs longs = injectés dans le contexte → coût élevé + timeouts Cursor.

## Interdit — agent n’exécute jamais

| Catégorie | Exemples |
|-----------|----------|
| Build / types | `pnpm build`, `next build`, `tsc`, `tsc --noEmit` |
| Tests | `pnpm test*`, `vitest`, `playwright test`, `pnpm test:e2e*` |
| Install / deps | `pnpm install`, `pnpm add`, `pnpm update`, `npm i`, `pnpm dlx`, `npx` (packages) |
| Lint | `pnpm lint`, `eslint`, `eslint .` |
| Dev / watch | `pnpm dev`, `next dev`, `vitest watch`, tout serveur / `--watch` |
| Conteneurs | `docker`, `docker compose` |
| CLI lourdes | `pnpm dlx shadcn@…`, `playwright install` |
| Disk dump | `find` repo-wide, `rg`/`grep -r` sans path + limite, `cat`/`head` sur gros lockfiles / `.next` / `node_modules` |
| Git volumineux | `git log -p`, `git diff` sans path sur gros arbres, `git show` de gros blobs |

Aussi : boucles run → fix → run ; claim « build/tests OK » sans log user.

## Autorisé — shell léger seulement

- `ls` / `pwd` ciblés (1 dossier)
- `git status`, `git diff --stat`, `git diff -- path/file` (fichier connu)
- Lecture d’1–2 fichiers via outils `Read`/`Grep` (path + limite)
- Commandes **explicitement** demandées par l’user (« lance X »)

Plafond : ≤ 3 shells / requête user ; 1 intention = 1 commande (pas de `&&` chaînés).

## Fin de tâche

Lister les commandes à copier, ex. :

```bash
pnpm build
pnpm test:unit
pnpm lint
```

Ne pas les exécuter. Attendre le résultat / log user si besoin de corriger.
