<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# smsclient-webapp — agent rules

Workspace root = Next.js app (flat). No nested `smsclient/` app folder.

## Skills

`.cursor/skills/` — project skills.

Invoke: `/caveman`, `/caveman-commit`, skill name in chat, or attach skill manually.

## Rules

`.cursor/rules/` — session limits, no auto test run.

## App docs

See `CLAUDE.md` and `wiki/`.
