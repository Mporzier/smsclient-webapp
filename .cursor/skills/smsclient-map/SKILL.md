---
name: smsclient-map
description: >
  Quick "where is what" map for smsclient. Use before broad exploration —
  find view, hook, supabase module, or test entry for a domain.
---

# smsclient-map

Read `wiki/index.md` first (+ `wiki/hot.md`, `wiki/conventions-ui.md` si UI/modales). Max 4 fichiers par domaine (`view-scoped-edit`).

## Skills location

`.cursor/skills/` at workspace root.

## Navigation core

- Routes: `lib/proto/routes.ts`
- Compositor: `prototypeApp/usePrototypeApp.ts`
- Routes render: `prototypeApp/routes/`
- Shell: `Shell.tsx` + `shell/` (logo → `dashboard`)

## Domain map — lire d'abord

| Domain       | Files                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------- |
| Contacts     | `ContactsView.tsx`, `useContacts.ts`, `lib/supabase/clients.ts`                          |
| Modales      | `modals/ContactCreateModal.tsx`, `modals/modalFormGuard.ts`, `ConfirmDeleteModal.tsx`    |
| Tel / import | `lib/proto/smsUtils.ts`, `lib/import/contactImportMap.ts`, `ImportContactsModal.tsx`     |
| Listes       | `DataTable.tsx`, `listColumnSizes.ts`                                                    |
| Wizard       | `CreateCampaign/CampaignWizard.tsx`, `prototypeApp/useCampaignWizard.ts`                 |
| Wiki         | skill `obsidian-markdown` — `wiki/` (`hot`, `index`, `conventions-ui`)                   |

## Conventions rapides (détail wiki/conventions-ui.md)

- Tel mobile FR = **06/07** only (`smsUtils`)
- Erreurs form modale = **sous champ**
- Dismiss dehors si pas dirty ; confirms empilées : `hasStackedOpenDialog()` — pas `preventDefault` parent
- `CONTACT_COL.actions` = `select` (40) ; DataTable `maxSize` défaut 600

## Skills catalogue

- **limits**: `no-heavy-cmds`, `no-verify-build` (+ rules always-on) — gagne sur superpowers ; propose cmds, jamais run
- **smsclient**: `smsclient-map`, `view-scoped-edit`, `test-debug-vitest`, `test-debug-playwright`, `next16-guard`, `token-diet`, `anti-loop`, `skill-evolve`
- **caveman**: `caveman`, `cavecrew`, `caveman-commit`, `caveman-compress`, `caveman-help`, `caveman-review`, `caveman-stats`
- **obsidian**: `obsidian-markdown`, `obsidian-cli`, `obsidian-bases`, `json-canvas`
