---
name: smsclient-map
description: >
  Quick "where is what" map for smsclient. Use before broad exploration —
  find view, hook, supabase module, or test entry for a domain.
---

# smsclient-map

Read `wiki/index.md` first. Max 4 files per domain (`view-scoped-edit`).

## Navigation core

- Routes: `lib/proto/routes.ts`
- Compositor: `prototypeApp/usePrototypeApp.ts`
- Routes render: `prototypeApp/routes/` (audience, content, settings)
- Shell: `Shell.tsx` + `shell/` (SidebarNav, LogoMark, SearchBar)

## Domain map — lire d'abord

| Domain | Files |
|--------|-------|
| Contacts | `views/ContactsView.tsx`, `hooks/useContacts.ts`, `lib/supabase/clients.ts` |
| Groupes | `views/GroupesView.tsx`, `hooks/useGroups.ts`, `lib/supabase/groups.ts` |
| Campagnes | `views/CampagnesView.tsx`, `hooks/useCampaigns.ts`, `lib/supabase/campaigns.ts` |
| Wizard | `CreateCampaign/CampaignWizard.tsx`, `prototypeApp/useCampaignWizard.ts`, `CampaignWizardSchedule.tsx` |
| Wizard step1 | `CreateCampaign/CampaignWizardStep1.tsx`, `CreateCampaign/step1/` |
| QR | `views/QrCodeView.tsx`, `hooks/useQrWheel.ts`, `lib/supabase/qrWheel.ts` |
| Paramètres | `views/ParametresView.tsx`, `views/parametres/`, `hooks/useTrashItems.ts` |
| Shell | `Shell.tsx`, `shell/SidebarNav.tsx` |
| Actions proto | `prototypeApp/actions/` (contact, group, misc) |

## Skills

`.cursor/skills/` — `view-scoped-edit`, `test-debug-vitest`, `test-debug-playwright`, `next16-guard`, `caveman`, `cavecrew`

## Tests

- E2E: `tests/e2e/helpers/selectors.ts`
- Integration: `tests/integration/harness/`
