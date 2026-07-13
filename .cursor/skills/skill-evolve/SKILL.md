---
name: skill-evolve
description: >
  Propose improvements to existing Cursor skills/rules or new skills when relevant.
  Always propose before implementing. Use when workflow gaps appear, repeated agent mistakes,
  user friction with skills, or user says "améliore skill", "nouveau skill", "/skill-evolve".
  Always-on mirror: .cursor/rules/skill-evolve.mdc.
---

# skill-evolve

But : faire évoluer `.cursor/skills/` + rules always-on **sans surprise**.

## Always-on

Rule `.cursor/rules/skill-evolve.mdc` injectée chaque chat. Ce skill = détail.

## Quand proposer (si relevant)

- Même erreur / boucle / oubli **≥2 fois** dans la session ou le repo
- Gap : pas de skill/rule pour un workflow récurrent (domaine, debug, convention)
- Skill existant **stale** (chemins faux, duplique une rule, contredit `CLAUDE.md` / rules)
- User demande process répétable (« toujours faire X »)
- Après gros refactor structure (ex. flatten layout) → skills/map à mettre à jour

## Interdit

- **Implémenter** skill/rule sans proposition acceptée
- Spammer une proposition chaque message — max **une** proposition courte quand le signal est clair
- Dupliquer une rule already always-on en skill « always » sans miroir rule
- Skills décoratifs / one-shot

## Format proposition (avant code)

```
Skill evolve:
- Type: improve <name> | add <name> | rule always-on
- Pourquoi: (1 ligne)
- Contenu: (3 bullets max)
- Fichiers: paths touchés
OK à implémenter ?
```

Attendre **oui** / OK / go. Sinon stop.

## Après acceptation

1. Skill : `.cursor/skills/<name>/SKILL.md` (frontmatter `name` + `description` triggers)
2. Si always-on voulu : rule `.cursor/rules/<name>.mdc` `alwaysApply: true` (compressé) + note dans skill
3. Catalogue : `smsclient-map` + `wiki/index.md` + `CLAUDE.md` / `AGENTS.md` si always-on
4. Pas de test auto
