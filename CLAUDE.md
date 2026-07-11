@AGENTS.md

# smsclient — carte agent

Stack: Next.js 16, React 19, Supabase, Tailwind 4, Vitest, Playwright. pnpm only.

## Mémoire

- `wiki/hot.md` — contexte session récent
- `wiki/index.md` — routes → 3 fichiers max
- Skills: `.cursor/skills/`

## Arborescence

- `app/` — routes publiques
- `components/smsclient/` — UI proto
- `components/smsclient/prototypeApp/` — compositor proto
- `components/smsclient/shell/` — layout (LogoMark, SidebarNav, SearchBar)
- `components/smsclient/CreateCampaign/` — wizard (+ `step1/`, `CampaignWizardSchedule.tsx`)
- `components/smsclient/views/parametres/` — sections Paramètres
- `hooks/`, `lib/supabase/`, `lib/proto/`
- `tests/unit|integration|e2e/`

## Points d'entrée

- Shell: `Shell.tsx` (~400 lignes) + `shell/`
- Proto: `prototypeApp/usePrototypeApp.ts`
- Wizard: `CreateCampaign/CampaignWizard.tsx` + modules extraits
- Auth: `components/auth/AuthGate.tsx`

## Tests manuels

```bash
pnpm test:unit
pnpm test:integration
```

## Next.js 16

Lire `node_modules/next/dist/docs/` avant code Next.

