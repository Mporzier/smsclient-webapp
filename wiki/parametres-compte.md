---
title: Paramètres vs Compte
tags:
  - agent
  - parametres
  - profil
aliases:
  - parametres-vs-compte
---

# Paramètres vs Compte

Modèle mental produit (proto).

## Paramètres (`parametres`)

Org + billing + SMS + données + profil. Vue : `ParametresView` + `parametres/`.

Sections UI (onglets haut, une section à la fois) :

1. **Compte** — form inline (icône initiales, prénom, nom, email lecture seule, téléphone, langue) — `CompteSettingsPanel`
2. **Entreprise** — nom, activité, SIRET/TVA, adresse, contact facturation
3. **Facturation** — abonnement / paiement (Bientôt), factures crédits
4. **SMS & alertes** — expéditeur, alertes et conseils, résumé mensuel (factures email toujours envoyées)
5. **Données** — champs personnalisés, corbeille

Profil DB : `user_profiles` via `lib/supabase/profile.ts`.

## Compte (Shell)

Menu **Mon profil** → onglet Compte Paramètres (`requestParametresSection`). Déconnexion Shell. `MonProfilModal` plus branché depuis Shell.

## Stubs « Bientôt »

`abonnement`, `paiement` : cards + modales honnêtes, pas de faux état carte.

## Fichiers

- `components/smsclient/views/ParametresView.tsx`
- `components/smsclient/views/parametres/parametresSettings.tsx`
- `components/smsclient/modals/MonProfilModal.tsx`
- `components/smsclient/Shell.tsx`

Voir aussi [[conventions-ui]], [[index]].
