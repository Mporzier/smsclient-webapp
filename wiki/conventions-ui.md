---
title: Conventions UI
tags:
  - conventions
  - ui
  - modals
  - contacts
aliases:
  - ui-conventions
---

# Conventions UI — smsclient

Faits utiles pour agents. Source : sessions produit 2026-07.

## Shell

- Logo + texte `smsclient.fr` (sidebar et header mobile) cliquables → `go("dashboard")` — `components/smsclient/Shell.tsx`

## DataTable / listes

| Règle | Détail | Fichier |
| ----- | ------ | ------- |
| max resize colonne | défaut **600** px (`col.maxSize ?? 600`) | `DataTable.tsx` |
| séparateur resize | trait `after:bg-muted-foreground/45` | `DataTable.tsx` |
| largeurs contacts | `CONTACT_COL` — `select` et `actions` = **40** (fixes) | `listColumnSizes.ts` |
| sticky | `select` gauche, `actions` droite | `ContactsView.tsx` |

## Téléphone FR (mobile SMS)

- Valide **uniquement** `06` / `07` (10 chiffres nationaux)
- Pipeline : `coerceFrPhoneForImport` → `normalizeFRPhone` / `formatFrPhoneInput` → `isValidFrMobile` → `frDisplayToE164`
- `+33` / `0033` / `33…` : strip préfixe **sans** re-ajouter `0` si déjà présent (évite `+3306…` → `006…`)
- Fichier unique : `lib/proto/smsUtils.ts` — utiliséé par modale contact, import CSV, wizard, QR

## Modales formulaire

| Comportement | Règle |
| ------------ | ----- |
| Croix fermeture | **Toujours** `DialogContent showCloseButton` (ghost absolu). **Jamais** `modalCloseBtn*` custom |
| Header | `FormDialogHeader` (+ `FormDialogShell` si shell complet) — `pr-8` réservé pour la croix |
| Erreurs validation | **Sous le champ**, pas banner en haut du body |
| Submit | **Jamais** disabled pour form invalide — clic déclenche erreurs. `disabled` seulement `saving` / busy / plafond / env (`!configured`) |
| Autofocus ouverture | **Aucun** — `onOpenAutoFocus={preventDialogOpenAutoFocus}` (`modalChrome`) |
| Clic dehors / Escape | Ferme si **pas dirty** et pas en save |
| Form create vide | Pas dirty → ferme |
| Form update inchangé | Pas dirty → ferme |
| Dirty | Bloque dismiss (sauf confirm empilée) |
| Confirm empilée (delete, désabo…) | Clic dehors **ferme le confirm** ; parent reste — ne pas `preventDefault` sur parent si `hasStackedOpenDialog()` |

Fichiers clés :

- `modals/FormDialogHeader.tsx` / `FormDialogShell.tsx` — header + shell standard
- `modals/modalFormGuard.ts` — `useModalFormDirty` (baseline **après** reset seeds), `hasStackedOpenDialog`
- `modals/ContactCreateModal.tsx` — contact create/edit
- `modals/ConfirmDeleteModal.tsx` — dismiss si `!loading`
- `modals/GroupModal.tsx` — même pattern dismiss / stack
- `modalChrome.ts` — `modalCloseBtn*` **deprecated**

> [!tip] Dirty baseline
> Ne pas capturer le snapshot dirty au même render que le reset des seeds (`setFirst(seed)` etc.) — sinon faux dirty et dismiss bloqué.

## Paramètres vs Compte

Identité = form onglet Compte Paramètres (`CompteSettingsPanel`). Menu Shell **Mon profil** → `requestParametresSection("compte")` + `go("parametres")`. Org / billing / SMS / données = autres onglets. Détail : [[parametres-compte]].

## Contacts — champs perso

- Defs compte : Paramètres ; valeurs JSONB `clients.custom_fields`
- Colonnes liste à **droite** (avant `actions`) ; scroll horizontal si besoin
- Modale : liste 2 colonnes label / valeur (`ContactCustomFieldsList`)
- Import : roles `custom:<id>` — `lib/import/contactImportMap.ts`

Voir aussi [[hot]] et [[index]].
