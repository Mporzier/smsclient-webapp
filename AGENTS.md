<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# smsclient-webapp — agent rules

Workspace = Next.js app (flat).

## Carte d'identité

Lire `CLAUDE.md` (stack, carte, entrées, always-on).

## Always-on rules

`.cursor/rules/` — `agent-session-limits`, `testing-no-auto-run`, `token-economy`, `caveman`, `skill-evolve`.

## Skills (sur trigger / `/nom`)

`.cursor/skills/` — dont `anti-loop`, `token-diet`, `caveman`, `smsclient-map`.

## Mémoire session

`wiki/hot.md` → `wiki/index.md` → code.
