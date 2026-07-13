@AGENTS.md

# smsclient-webapp — carte d'identité

Produit: proto SMS (campagnes, contacts, groupes, QR, auth Supabase).
Stack: Next.js 16 · React 19 · Supabase · Tailwind 4 · Vitest · Playwright — **pnpm only**.
Layout: **flat** (app à la racine, pas de dossier app `smsclient/`).

## Mémoire (ordre)

1. `wiki/hot.md` — session récente
2. `wiki/index.md` — route → ≤3 fichiers
3. Code (skill `smsclient-map` / `view-scoped-edit`, max ~4 fichiers / domaine)

## Carte

| Zone | Path |
|------|------|
| Routes | `app/` |
| UI proto | `components/smsclient/` |
| Compositor | `components/smsclient/prototypeApp/` |
| Shell | `components/smsclient/Shell.tsx` + `shell/` |
| Wizard | `components/smsclient/CreateCampaign/` |
| Paramètres | `components/smsclient/views/parametres/` |
| Data | `hooks/`, `lib/supabase/`, `lib/proto/` |
| Tests | `tests/unit\|integration\|e2e/` |

## Entrées

- Proto: `prototypeApp/usePrototypeApp.ts`
- Shell: `Shell.tsx` + `shell/`
- Wizard: `CreateCampaign/CampaignWizard.tsx`
- Auth: `components/auth/AuthGate.tsx`

## Always-on (rules)

`.cursor/rules/` — injecté chaque chat :

- `agent-session-limits` — ≤3 shells, pas de chaînes, pas de Task sauf demande
- `testing-no-auto-run` — pas de test/build/tsc auto
- `token-economy` — anti-boucle + doute→question + lectures/edits frugales
- `caveman` — sortie compressée (full) ; off = `stop caveman` / `normal mode`
- `skill-evolve` — proposer improve/add skill avant d’implémenter

Skills détail (manuel / trigger) : `anti-loop`, `token-diet`, `caveman`, `skill-evolve`, …

## Vérif manuelle

```bash
pnpm test:unit
pnpm test:integration
```

## Next 16

Lire `node_modules/next/dist/docs/` avant code Next. Skill `next16-guard`.
