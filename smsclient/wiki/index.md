# smsclient — index agent

Lire `wiki/hot.md` d'abord si session récente documentée.

## Routes → fichiers (max 3)

| Route | View | Hook | Supabase |
|-------|------|------|----------|
| dashboard | `views/DashboardView.tsx` | — | — |
| contacts | `views/ContactsView.tsx` | `hooks/useContacts.ts` | `lib/supabase/clients.ts` |
| groupes | `views/GroupesView.tsx` | `hooks/useGroups.ts` | `lib/supabase/groups.ts` |
| campagnes | `views/CampagnesView.tsx` | `hooks/useCampaigns.ts` | `lib/supabase/campaigns.ts` |
| nouvelle-campagne | `CreateCampaign/CampaignWizard.tsx` | `prototypeApp/useCampaignWizard.ts` | `campaigns.ts` |
| automatisations | `views/AutomatisationsView.tsx` | `hooks/useAutomations.ts` | `lib/supabase/automations.ts` |
| statistiques | `views/StatistiquesView.tsx` | `hooks/useStatistics.ts` | `lib/supabase/statistics.ts` |
| parametres | `views/ParametresView.tsx` | `hooks/useTrashItems.ts` | `lib/supabase/profile.ts`, `trash.ts` |
| qr-boutique | `views/QrCodeView.tsx` | `useQrWheel`, `useUserQrCode` | `qrWheel.ts`, `qrCodes.ts` |
| liens | `views/LiensView.tsx` | `hooks/useLinks.ts` | `lib/supabase/links.ts` |
| modeles-sms | `views/ModelesSmsView.tsx` | `hooks/useSmsTemplates.ts` | `lib/supabase/smsTemplates.ts` |
| acheter-credits | `views/AcheterCreditsView.tsx` | `hooks/useCredits.ts` | `lib/supabase/credits.ts` |

## Shell / navigation

- `Shell.tsx` — layout (offset read)
- `shell/` — LogoMark, SidebarNav, SearchBar
- `lib/proto/routes.ts` — `AppRoute` enum
- `prototypeApp/usePrototypeApp.ts` — compositor proto

## Tests

- Unit: `tests/unit/`
- Integration: `tests/integration/harness/`
- E2E selectors: `tests/e2e/helpers/selectors.ts`

## Skills

`.cursor/skills/` — `smsclient-map`, `view-scoped-edit`, `test-debug-vitest`, `test-debug-playwright`
