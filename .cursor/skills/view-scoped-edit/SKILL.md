---
name: view-scoped-edit
description: >
  Scope agent reads when editing a smsclient view or domain.
  Use when task mentions a view name, route, or domain (contacts, campagnes, qr…).
---

# view-scoped-edit

Read skill `smsclient-map` first (+ `wiki/conventions-ui.md` si modale / tel / DataTable). Then **max 4 files** unless user asks broader refactor.

## Per domain — read only these

| Domain        | Max files                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------- |
| contacts      | `ContactsView.tsx`, `useContacts.ts`, `clients.ts` **ou** `ContactCreateModal.tsx` / `smsUtils.ts`  |
| contact-modal | `ContactCreateModal.tsx`, `modalFormGuard.ts`, `ContactCustomFieldsList.tsx`, `smsUtils.ts`         |
| import        | `ImportContactsModal.tsx`, `contactImportMap.ts`, `smsUtils.ts`                                    |
| listes        | `DataTable.tsx`, `listColumnSizes.ts`, view concernée                                              |
| groupes       | `GroupesView.tsx`, `useGroups.ts`, `lib/supabase/groups.ts`                                        |
| campagnes     | `CampagnesView.tsx`, `useCampaigns.ts`, `lib/supabase/campaigns.ts`                                |
| wizard        | `CampaignWizard.tsx` (offset), `useCampaignWizard.ts`, `campaignTypes.ts`                          |
| qr            | `QrCodeView.tsx`, `useQrWheel.ts`, `lib/supabase/qrWheel.ts`                                       |
| modeles       | `ModelesSmsView.tsx`, `modals/CreateSmsTemplateModal.tsx`, `useSmsTemplates.ts`, `lib/supabase/smsTemplates.ts` |
| paramètres    | `ParametresView.tsx`, `useTrashItems.ts`, `lib/supabase/profile.ts`                                |
| shell         | `Shell.tsx` (offset), `lib/proto/routes.ts`                                                        |
| auth          | `AuthGate.tsx`, `lib/supabase/client.ts`, `lib/auth/authErrors.ts`                                 |

## Forbidden without explicit ask

- Full read `Shell.tsx`, `CampaignWizard.tsx`, `CampaignWizardStep1.tsx`
- Scan entire `components/smsclient/`
- Read `prototypeApp/usePrototypeActions.ts` when editing single view

## Proto shell edits

`prototypeApp/` — read compositor `usePrototypeApp.ts` + targeted hook only.
