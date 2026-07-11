---
name: caveman-commit
description: >
  Ultra-compressed commit message generator. Cuts noise from commit messages while preserving
  intent and reasoning. Conventional Commits format. Subject ≤50 chars, body only when "why"
  isn't obvious. Use when user says "write a commit", "commit message", "generate commit",
  "/commit", or invokes /caveman-commit. Auto-triggers when staging changes.
---

Write commit messages terse and exact. Conventional Commits format. No fluff. Why over what.

## Rules

**Subject line:**
- `<type>(<scope>): <imperative summary>` — `<scope>` optional
- Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `style`, `revert`
- Imperative mood: "add", "fix", "remove" — not "added", "adds", "adding"
- ≤50 chars when possible, hard cap 72
- No trailing period

**Body (only if needed):**
- Skip when subject self-explanatory
- Add for: non-obvious why, breaking changes, migration notes
- Wrap at 72 chars
- Reference issues at end: `Closes #42`

**Never in message:**
- "This commit", "I", "we", restating filename when scope covers it
- AI attribution unless user rule requires

## Auto-Clarity

Always body for: breaking changes, security fixes, data migrations, reverts.

## Boundaries

Only generates message. No `git commit`, no stage. Output code block ready to paste.
