---
title: couverture balises SMS (dropdown)
updated: 2026-09-03
---

# Couverture champs — menu balises campagne

## Problème

User doit voir, dans le dropdown « Insérer une info du contact », combien de destinataires ont déjà une valeur (ex. `742/800 · 93%`). Compter en JS sur `fetchClientsByIds` explose à ~4000 contacts (N× `.in(50)` + payload complet).

## Décisions

- **1 RPC** `campaign_merge_fill_counts` : agrégat SQL, JSON petit. IDs en **body** `uuid[]` (pas `.in()` GET).
- Mode **all** : `p_all_eligible = true` + `p_exclude_ids`. **Aucun** UUID destinataire. Filtre SQL : `user_id = auth.uid()`, `deleted_at is null`, `opt_in`, `not stop_sms`.
- Modes **manual / lists** : `p_client_ids` = set wizard déjà exclu. Pas de refiltre tel FR (`isValidFrMobile` reste JS).
- Mode **numbers** : pas de RPC ; UI `—`.
- Custom : `p_custom_ids text[]` (ids defs). `trim(custom_fields->>id) <> ''`.
- Système : `trim(first_name/last_name) <> ''` ; birthday : `trim(birthday::text) <> ''`.
- Call quand audience + defs changent (**pas** à l’ouverture du menu). Menu = props cache.
- Groupes pas encore résolus : attendre (comme resolve contacts). Erreur RPC : cacher le % (compose OK).
- Hors campagne (modèle SMS, QR) : pas de %.
- Checklist IA : mêmes chiffres.

## Perf (2000+ destinataires)

- **Fetch contacts complets** : étape **3** seulement (pas au « Continuer » étape 1). Cache par `recipientIdsKey`.
- **Chunks** : `fetchClientsByIds` en parallèle (6× `.in(50)`), pas séquentiel.
- **Crédits définitifs** : `definitiveCampaignCredits` uniquement étape 3 + contacts résolus ; étape 2 = indicatif.
- **Couverture balises** : RPC étape 2+ (pas de fetch rows).
- **Compteur destinataires** étapes 1–2 : `recipientIdSet.size` tant que rows pas chargées.

- Preview « tout vide ».
- Blocage envoi si tag inconnu / couverture basse.
- Recalcul crédits sans `fetchClientsByIds`.
- Index / table stats dénormalisée.

## UI

Ligne 2 du item : `Ex. « Marie »` puis `742/800 · 93%` (muted). Resolving : `…`. Total 0 : rien.
