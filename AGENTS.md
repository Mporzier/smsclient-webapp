<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# smsclient-webapp — agent rules

Workspace = Next.js app (flat).

## Carte d'identité

Lire `CLAUDE.md` (stack, carte, entrées, always-on, **priorité**).

## Priorité

Rules/skills smsclient **>** user message détail **>** superpowers/plugins.  
Pas de build/tsc/lint/install/dlx/Task auto. Fin de tâche = **proposer** commandes.  
Multi-root : préférer ouvrir **smsclient seul** pour jobs UI.

## Always-on rules

`.cursor/rules/` (`alwaysApply: true`) — injecté chaque chat :

`agent-session-limits`, `testing-no-auto-run`, `token-economy`, `no-git-commit`, `caveman`, `skill-evolve`.

**Pas** : les 23 fichiers `SKILL.md` en entier. Skills = découverte + Read sur trigger. Miroirs always-on portent l’essentiel des interdits.

## Skills (sur trigger / `/nom`)

`.cursor/skills/` — dont `anti-loop`, `token-diet`, `caveman`, `no-verify-build`, `no-heavy-cmds`, `no-integration-tests`, `no-git-commit`, `smsclient-map`.

## Mémoire session

`wiki/hot.md` → `wiki/index.md` → code.
