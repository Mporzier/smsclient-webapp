---
title: hot
updated: 2026-07-16
tags:
  - agent
  - session
---

# hot — contexte récent

Updated: 2026-07-21

## Session 2026-07-21 (i18n suite)

- Stats `StatistiquesView` EN (déjà branché)
- Aide `AideView` EN (`help.*`)
- QR chrome : `QrCodeView` + stats card + compliance EN (`qr.*`)
- Hors scope encore : wizard campagne, modales QR (welcome/wheel/preview), contact/import, FloatingHelpBanner, réglementations

## Session 2026-07-20 (i18n sidebar + paramètres)

- Infra `lib/i18n` (`useI18n` ← `profile.language`)
- Shell sidebar + header + menu compte EN
- Paramètres / Dashboard / Contacts / Groupes / Campagnes / Liens / Modèles EN

## Session 2026-07-20 (Paramètres sections)

- Croix modales : `FormDialogHeader` / `FormDialogShell` + `showCloseButton` — `modalCloseBtn*` deprecated
- Compte : lignes email/icône alignées (spacer bouton Éditer invisible)
- Champ `language` profil (`fr`|`en`) — migration `20260720170000_user_profiles_language.sql`
- Menu Shell garde `MonProfilModal`

## Session 2026-07-16 (UI contacts / modales)

- Logo + `smsclient.fr` sidebar (+ header mobile) → `go("dashboard")` — `Shell.tsx`
- `DataTable` : `maxSize` défaut colonnes = **600** ; séparateurs resize `after:bg-muted-foreground/45`
- Contacts : colonne `actions` = **40** (comme `select`) — `listColumnSizes.ts` `CONTACT_COL`
- Tel FR : `isValidFrMobile` / `frDisplayToE164` = **06/07 only** ; normalise `+33` sans double `0` — `lib/proto/smsUtils.ts` (modale + import)
- `ContactCreateModal` : erreurs **sous champs** (pas banner haut) ; edit sans autofocus prénom (`onOpenAutoFocus` prevent)
- Dismiss modales : form vide / update non dirty → clic dehors ferme ; confirms empilées aussi — `useModalFormDirty` baseline différée + `hasStackedOpenDialog()` — `modalFormGuard.ts`
- Champs perso contacts V1 (session liée) : defs params, JSONB, liste + modale + import CSV

Détail durable : [[conventions-ui]]

## Session antérieure

- Token savings : rules, skills, wiki, gros fichiers découpés
- `PrototypeApp` → `prototypeApp/` ; `shell/` ; `parametres/` ; `CreateCampaign/` helpers
- Skills caveman + obsidian

## Rappel agent

`/caveman` actif. Max 4 fichiers / domaine (`view-scoped-edit`). Pas de test/build auto. Commit manuel.
