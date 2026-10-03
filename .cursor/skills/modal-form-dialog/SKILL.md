---
name: modal-form-dialog
description: >
  Comportements obligatoires des modales formulaire smsclient (shell, dirty,
  dismiss, SMS). Use when adding or changing any Dialog form, FormDialogShell,
  FormDialogHeader, modal dismiss, useModalFormDirty, or copying modal UX from
  another feature.
---

# modal-form-dialog

Parent : skill **`conventions-first`**. **Avant d’écrire ou copier une modale** : lire `wiki/conventions-ui.md` section **Modales formulaire** (source de vérité produit).

## Références code (copier le pattern, pas reinventer)

| Besoin | Fichier |
| ------ | ------- |
| Shell standard | `modals/FormDialogShell.tsx` + `FormDialogHeader.tsx` (`footerLeading` = CTA gauche pied) |
| Dirty + dismiss dehors / Échap | `modals/CreateSmsLinkModal.tsx` ou `ContactCreateModal.tsx` |
| Guard stack (emoji, confirm) | `modals/modalFormGuard.ts` — `useModalFormDirty`, `hasStackedOpenDialog` |
| Champ Message SMS modale | `modals/ModalSmsMessageField.tsx` (aligné `CreateAutomationModal`) |
| Chrome z-index / autofocus | `modals/modalChrome.ts` |

## Checklist obligatoire (form éditable)

1. **Shell** : `FormDialogShell` ou même triplet (`formDialogContentCls`, `FormDialogHeader`, footer) que les modales liens / contact.
2. **Croix** : `DialogContent showCloseButton={!saving}` — jamais `modalCloseBtn*`.
3. **Autofocus** : `onOpenAutoFocus={preventDialogOpenAutoFocus}`.
4. **Dirty** : `useModalFormDirty(open, snapshot, equals)` ; baseline après reset des seeds (voir tip wiki).
5. **Dismiss** : `canDismiss = !saving && !isDirty` → `onPointerDownOutside` / `onEscapeKeyDown` : si `hasStackedOpenDialog()` ne pas bloquer ; sinon `if (!canDismiss) e.preventDefault()`.
6. **FormDialogShell** : passer **`formDirty={isDirty}`** dès qu’il y a des champs modifiables (le shell applique dismiss + `onOpenChange` ; sans prop = bug).
7. **Popovers** (emoji, tags, select) : `popoverClassName={dialogPopoverZCls}` ; ne pas bloquer dismiss parent quand stack ouverte.
8. **Erreurs** : sous le champ (`ModalSmsMessageField` ou équivalent), pas bannière body.
9. **Submit** : pas disabled pour validation — seulement `saving` / busy.

## Anti-patterns (erreurs agent fréquentes)

- Brancher `FormDialogShell` sans `formDirty` alors que le body est éditable.
- Réimplémenter label + `SmsMessageComposer` au lieu de `ModalSmsMessageField`.
- Bloquer tout `onPointerDownOutside` quand `saving` seulement (oublier dirty).
- Lire uniquement la modale cible sans `conventions-ui.md` ni référence `CreateSmsLinkModal`.

## QR / SMS bienvenue

- Modale config : `QrWelcomeSmsSettingsModal.tsx` (shell + dirty + `ModalSmsMessageField`).
