---
name: caveman-compress
description: >
  Compress natural language memory files (CLAUDE.md, wiki/*.md) into caveman format
  to save input tokens. Preserves code blocks, paths, URLs exactly.
  Trigger: /caveman-compress FILEPATH or "compress memory file"
---

# Caveman Compress

Compress prose in `.md` memory files. Backup original as `<filename>.original.md` before overwrite.

## Process (manual — no scripts in this repo)

1. Read target file
2. Copy full content to `<filename>.original.md` if backup not exists
3. Compress prose per rules below — code blocks untouched
4. Write compressed version over original
5. Report char reduction estimate

## Remove

Articles, filler (just/really/basically), pleasantries, hedging, connective fluff.

## Preserve EXACTLY

Code blocks, inline code, URLs, file paths, commands, version numbers, env vars, headings structure.

## Compress

Short synonyms. Fragments OK. Drop "you should". Merge redundant bullets.

## Boundaries

Only `.md` prose files (`CLAUDE.md`, `wiki/`, `AGENTS.md`). Never `.ts`, `.tsx`, `.json`, lockfiles.
