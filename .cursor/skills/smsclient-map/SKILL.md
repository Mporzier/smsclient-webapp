---
name: smsclient-map
description: >
  Quick "where is what" map for smsclient. Use before broad exploration —
  find view, hook, supabase module, or test entry for a domain.
---

# smsclient-map

Read `wiki/index.md` first. Max 4 files per domain (`view-scoped-edit`).

## Skills location

`.cursor/skills/` at workspace root.

## Navigation core

- Routes: `lib/proto/routes.ts`
- Compositor: `prototypeApp/usePrototypeApp.ts`
- Routes render: `prototypeApp/routes/`
- Shell: `Shell.tsx` + `shell/`

## Domain map — lire d'abord

| Domain | Files |
|--------|-------|
| Contacts | `views/ContactsView.tsx`, `hooks/useContacts.ts`, `lib/supabase/clients.ts` |
| Wizard | `CreateCampaign/CampaignWizard.tsx`, `prototypeApp/useCampaignWizard.ts` |
| Wiki edits | skill `obsidian-markdown` — `wiki/` |

## Skills catalogue

- **smsclient**: `smsclient-map`, `view-scoped-edit`, `test-debug-vitest`, `test-debug-playwright`, `next16-guard`, `token-diet`, `anti-loop`, `skill-evolve`
- **caveman**: `caveman`, `cavecrew`, `caveman-commit`, `caveman-compress`, `caveman-help`, `caveman-review`, `caveman-stats`
- **obsidian**: `obsidian-markdown`, `obsidian-cli`, `obsidian-bases`, `json-canvas`
