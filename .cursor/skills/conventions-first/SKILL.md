---
name: conventions-first
description: >
  Before implementing or copying smsclient UI/flows, load the validated behavior
  from skills + wiki (not from one arbitrary file). Use when user says "like other
  modals", "standard app", "same behavior", or any feature touch matching a domain
  skill. After a convention gap caused an agent mistake, update skills + always-on
  mirror. Always-on mirror: .cursor/rules/conventions-first.mdc.
---

# conventions-first

Comportement **valide** = ce qui est dans **skills + wiki + fichiers référence** — pas l’état du premier composant tombé sous la main.

## Avant d’implémenter (toute requête touchant l’app)

1. `wiki/index.md` → domaine
2. Skill **`smsclient-map`** → skill domaine si listé (ex. **`modal-form-dialog`**, `view-scoped-edit`, `next16-guard`, `postgrest-in-chunk`)
3. Wiki thème : `wiki/conventions-ui.md`, `wiki/hot.md` si pertinent
4. User demande « comme X » / « standard » → ouvrir **fichier référence** du skill (ex. `CreateSmsLinkModal.tsx`), pas seulement le fichier en cours d’edit

## Domaines → skills (non exhaustif)

| Sujet | Skill / doc |
| ----- | ------------- |
| Modales form | `modal-form-dialog` + `conventions-ui.md` |
| Vue / route | `view-scoped-edit` |
| Next.js code | `next16-guard` |
| Supabase `.in()` bulk | `postgrest-in-chunk` |
| Carte repo | `smsclient-map` |

## Après écart agent (convention existante ratée)

Quand l’user corrige (« tu aurais dû… », « comme les autres modales », post-mortem process) :

1. Fix code minimal
2. **Mettre à jour** skill domaine (checklist, anti-patterns, refs)
3. **Rule always-on** miroir compressée si pas déjà injectée chaque chat
4. Ligne dans `smsclient-map` + section wiki si manquante
5. JSDoc court sur shell/API partagée (`FormDialogShell`, etc.)

Pas seulement « skill evolve: OK ? » pour ce cas — l’user a validé le comportement en le demandant.

## Nouvelle convention (pas encore documentée)

1. Implémenter aligné sur la **meilleure référence** existante la plus proche
2. Documenter dans wiki ou skill **dans la même session**
3. Rule always-on si règle transverse (dismiss, auth, limits déjà ailleurs)

## Anti-patterns

- Copier layout d’une modale sans `useModalFormDirty` / dismiss parce que la cible ne l’avait pas
- Créer composant parallèle au lieu d’étendre shell/champ partagé documenté
- Finir la tâche code sans mettre à jour skills quand l’user a explicité le standard attendu
