---
name: token-diet
description: >
  Règles de réduction drastique de tokens (lectures, recherches, edits, docs web).
  Use when user says "token diet", "moins de tokens", "économie tokens", "/token-diet",
  or when a task risks large context (web docs, broad search, big file rewrites).
  Always-on mirror: .cursor/rules/token-economy.mdc (with anti-loop).
---

# token-diet

**Always-on** : rule `.cursor/rules/token-economy.mdc` (injectée chaque chat). Ce skill = détail / rappel manuel.

Coupe **tokens d'entrée / outils**. Sortie terse = skill `caveman`. Plafonds shell/tests = rule `agent-session-limits` + `testing-no-auto-run` (ne pas relancer).

## Doc web

- **Interdit** : lire HTML brut, dump page entière, `WebFetch` sur page HTML lourde.
- **Obligatoire** pour doc / article / page web :
  ```bash
  npx defuddle parse <URL> --md
  ```
- URL déjà `.md` (raw GitHub, docs markdown) → `WebFetch` OK.
- Sinon skill `defuddle` si dispo.

## Recherche code

- **Interdit** : recherche globale repo (`rg` sans path, `find` racine, Grep sans `path` / `head_limit`).
- **Obligatoire** :
  1. Skill `smsclient-map` ou `view-scoped-edit` → max ~4 fichiers domaine
  2. Puis `Grep` avec `path` restreint + `head_limit`
  3. `Read` avec `offset`/`limit` sur gros fichiers (`CampaignWizard.tsx`, `Shell.tsx`, `ParametresView.tsx`)

## Édition

- **Interdit** : réécrire un fichier entier pour un patch local (`Write` full replace).
- **Obligatoire** : `StrReplace` / diffs ciblés.
- Exception : fichier **nouveau**, ou changement > ~50 % du fichier (alors `Write` OK, une fois).

## Échecs (build / test / hypothèse)

Agent **ne lance pas** tests/build (rule projet). Si l'humain colle une erreur, ou si une commande autorisée échoue :

1. Une hypothèse → un correctif minimal → stop
2. **2 échecs** (même symptôme ou 2 hypothèses ratées) → **stop immédiat**, demander à l'humain (log court / décision)
3. Pas de boucle run → fix → run

## Anti-patterns (coût tokens)

| Faire | Éviter |
|-------|--------|
| Lire 1 symbole via Grep+Read partiel | Ouvrir dossier entier « au cas où » |
| Citer 3–10 lignes | Coller stack trace / fichier complet |
| Subagent seulement si user demande | Explorer via Task en parallèle |
| Une intention = une commande shell | Chaînes `&&` / scripts marathon |

## Liens

- Sortie courte → `caveman`
- Où est quoi → `smsclient-map`
- Scope vue → `view-scoped-edit`
