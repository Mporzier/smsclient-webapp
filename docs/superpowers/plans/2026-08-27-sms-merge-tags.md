# SMS merge tags Implementation Plan

> **For agentic workers:** Implement in-repo. Pas de commit auto. Pas de `pnpm test` / build auto (rules smsclient). Proposer commandes.

**Goal:** Balises plain text `[prenom]` `[nom]` `[anniversaire]` `[libellé]` dans manuel, modèle, IA, modale modèle.

**Architecture:** Parser central `lib/proto/smsPersonalization.ts`. UI `SmsMergeTagMenu`. Éditeur SMS n’émet plus de chips. IA : `selectedMergeTags` à la place de `includeFirstName`.

**Tech Stack:** Next.js / React, shadcn DropdownMenu + Checkbox, Vitest (manuel).

## Global Constraints

- pnpm only ; agent ne lance pas tests/build/lint.
- Caveman chat ; prose normale dans diffs.
- Max fichiers raisonnable ; wizard en offset si gros.

## File map

- `lib/proto/smsPersonalization.ts` — tokens, expand, crédits, preview
- `tests/unit/lib/proto/smsPersonalization.test.ts` — expand / cleanup / legacy
- `components/smsclient/CreateCampaign/SmsMergeTagMenu.tsx` — menu + checklist IA
- `smsMessageEditorDom.ts` + `SmsRichMessageEditor.tsx` + `SmsMessageComposer.tsx` — insert texte
- `SmsAiOptionCards.tsx` + `campaignTextUtils.ts` + `campaignAiApi.ts` + `SmsAiComposePanel.tsx`
- `CampaignWizard.tsx` + `campaignTypes.ts` + `settingsRoutes.tsx`
- `CreateSmsTemplateModal.tsx` + `campaignSmsTemplates.ts` + `constants.ts`

## Tasks

1. Parser + tests unitaires (user run).
2. Menu / checklist.
3. Composer + éditeur sans chips.
4. IA selectedMergeTags + mock variants.
5. Wizard / modèle / crédits / preview.
6. Templates secteur + DEFAULT_SMS.

## Verify (user)

```bash
pnpm test:unit
pnpm lint
```
