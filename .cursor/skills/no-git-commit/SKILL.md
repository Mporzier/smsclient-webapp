---
name: no-git-commit
description: >
  Interdit à l'agent tout git commit et tout git push. Commit et push
  toujours manuels par l'utilisateur. Use when finishing a task, plan says
  "Commit", writing-plans / executing-plans / caveman-commit urge a commit,
  creating a PR, or user says "commit", "push", "/no-git-commit".
  Always-on mirror: .cursor/rules/no-git-commit.mdc.
---

# no-git-commit

**Always-on** : rule `.cursor/rules/no-git-commit.mdc`.

cursor ne commit JAMAIS. commit et push toujours manuel

## Interdit (agent)

- `git commit`, `git commit -m`, amend, `--no-verify`
- `git push`, `git push -u`, force push
- `gh pr create` s’il implique push non demandé (proposer la commande)
- Contourner via plans (« Step: Commit »), skills `caveman-commit`, finishing-branch, ou sous-agents

## Autorisé

- `git status`, `git diff`, `git log` (légers, ciblés)
- `git add` **seulement** si l’user demande explicitement de stager
- Proposer le message + les commandes à lancer **manuellement** :

```bash
git add path/to/file
git commit -m "feat: …"
git push
```

## Fin de tâche

Dire ce qui a changé. Proposer commit/push si utile. **Ne pas** les exécuter — même si un plan ou skill dit « Commit ».
