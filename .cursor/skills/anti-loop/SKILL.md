---
name: anti-loop
description: >
  Bloque boucles de commandes/outils IA et interdit de finaliser un job si incertitude.
  Si doute → demander à l'utilisateur, ne pas brûler de tokens.
  Use when user says "anti-loop", "pas de boucle", "si doute demande", "/anti-loop",
  or when agent is about to retry a failed command, guess among options, or claim "done" without evidence.
  Always-on mirror: .cursor/rules/token-economy.mdc (with token-diet).
---

# anti-loop

**Always-on** : rule `.cursor/rules/token-economy.mdc` (injectée chaque chat). Ce skill = détail / rappel manuel.

But : **zéro tokens gaspillés** en retries, exploration en spirale, ou « done » faux.

## Boucles interdites

| Pattern | Règle |
|---------|--------|
| commande échoue → relancer / variante | **Retry = 0.** Stop. Citer échec court. Demander humain. |
| run → fix → run (test/build/lint/tsc) | **Interdit** (voir `testing-no-auto-run`). Donner commandes à copier. |
| Grep/Read → encore Grep/Read sans hypothèse | Max **2** tours d'investigation. Puis stop + question. |
| Subagent → subagent | Pas de `Task` sauf demande user. Pas de parallèle. |
| « je vérifie que ça passe » | Ne pas lancer vérif. Ne pas prétendre avoir vérifié. |

Shell : ≤ 3 commandes / requête user ; une intention = une commande (pas `&&` / `;` chaînés). Détail → rule `agent-session-limits`.

## Incertitude = frein hard

**Ne finalise pas** le job (pas de « c'est bon », pas de commit/PR/merge, pas de patch large) si l'un de :

- ≥ 2 causes plausibles sans preuve
- fichier / API / comportement attendu **inconnu**
- conflit de règles / specs
- erreur user incomplète (log manquant, steps manquants)
- choix produit (UX, naming, scope) non tranché

À la place :

1. **Stop outils** (sauf 1 question ciblée si besoin d'1 fait)
2. Dire en 2–4 lignes : ce qui est sûr / ce qui manque / options
3. **Une** question claire à l'utilisateur
4. Attendre réponse — ne pas « continuer au cas où »

## Finalisation autorisée seulement si

- Hypothèse unique + correctif appliqué **ou**
- User a tranché le doute **ou**
- Livrable demandé est purement local et non ambigu

Sinon : réponse = **blocage explicite** + question. Pas de semi-fix silencieux.

## Phrases interdites (souvent mensonge token-burn)

- « Je relance pour confirmer »
- « Laisse-moi explorer un peu plus »
- « Probablement X, je corrige Y aussi »
- « Done / fixed / ça devrait marcher » sans preuve user

## Liens

- Tokens lecture/edit → `token-diet`
- Sortie courte → `caveman`
- Plafonds always-on → `.cursor/rules/agent-session-limits.mdc`
