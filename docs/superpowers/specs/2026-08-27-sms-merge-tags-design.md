---
title: balises SMS plain text
updated: 2026-08-27
---

# Balises SMS — `[prenom]` / `[nom]` / `[anniversaire]` / champs perso

## Problème

Chip `⟦prénom⟧` (contenteditable) ne convient pas. Il faut du plain text, plus nom / anniversaire / champs perso, dans les 3 modes de rédaction et la modale modèle.

## Décisions

- Syntaxe canonique : `[prenom]`, `[nom]`, `[anniversaire]`, `[Libellé du champ]`.
- Legacy `⟦prénom⟧`, `{PRENOM}`, `{prenom}`, `{{prenom}}` → `[prenom]` à la normalisation.
- Champs perso : token = libellé actuel (trim). Match insensible à la casse / accents. Clé système gagne si collision (`prenom` / `nom` / `anniversaire`).
- `[…]` inconnu : inchangé.
- Valeur absente : vide + nettoyage espaces / virgules adjacentes.
- `[anniversaire]` : `JJ/MM` depuis `YYYY-MM-DD`.
- Manuel + modèle : menu **Personnaliser** insère le token au curseur (éditeur = texte, plus de chip).
- IA : cases à cocher (prénom, nom, anniversaire, champs perso). Le prompt / mock d’API **doit** contenir chaque token coché. Variante sans token requis = rejet.
- Aperçu / crédits : valeurs d’estimation (plus longues parmi destinataires ; fallback Marie / Nom / 31/12).
- Renommage champ perso : anciennes balises invalidées (V1, pas de migration).
- QR welcome : même normalisation + menu si composer partagé.

## Hors scope V1

- Autocomplétion `[`.
- Surbrillance syntaxique.
- Migration auto des libellés renommés.
- Format date champs perso (valeur stockée telle quelle).
