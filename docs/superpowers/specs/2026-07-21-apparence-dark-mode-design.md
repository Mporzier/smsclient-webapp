---
title: Apparence — dark mode v1
date: 2026-07-21
status: approved
---

# Apparence — dark mode v1 (design)

## Contexte

`app/globals.css` définit déjà `@custom-variant dark (&:is(.dark *))` et un bloc `.dark { … }` de tokens CSS. Les composants shadcn (`components/ui/*`) ont déjà des variantes `dark:`. Aucun toggle ne pose la classe `dark` sur `<html>`, et le Shell utilise surtout des couleurs light hardcodées.

Objectif v1 : section Paramètres **Apparence** + bascule Clair/Sombre réelle sur le cadre app.

## Décisions

| Choix | Décision |
|-------|----------|
| Persistance | `localStorage` clé `smsclient.theme` (`"light"` \| `"dark"`) |
| Sync profil / DB | Non |
| Mode système | Non |
| Défaut | `"light"` |
| Stack | Hook custom + script inline anti-FOUC (pas de `next-themes`) |
| UI | Nouvelle section nav `apparence` + carte Thème Clair/Sombre |
| Shell | Remplacer hardcodes du cadre (sidebar / header / fond) par tokens |
| Views / modales hardcodées | Hors scope v1 |

## Comportement

1. Au load : script inline dans `app/layout.tsx` lit `localStorage.getItem("smsclient.theme")`. Si `"dark"`, ajoute `class="dark"` sur `<html>` avant paint.
2. `setTheme("dark" | "light")` : écrit `localStorage`, sync `document.documentElement.classList`, dispatch event custom (ex. `smsclient:theme`) pour les listeners React.
3. Multi-onglets : écouter `storage` sur la même clé.
4. Valeur invalide / absente → `"light"` (retire `dark` si présent).

## API

- Module `lib/theme/theme.ts` : types, clé storage, `getStoredTheme()`, `applyTheme(theme)`, constante event.
- Hook `hooks/useTheme.ts` : `{ theme, setTheme }` — state initial depuis DOM/`getStoredTheme`, sync via events.

Pas de React Context obligatoire si hook + event suffisent (même pattern que `parametresNav`).

## UI Paramètres

- `SettingSectionId` : ajouter `"apparence"` (après `compte` ou en fin de liste nav — **après `compte`** recommandé).
- Carte / panel : titre Thème ; contrôle segmenté Clair | Sombre (icônes Sun / Moon).
- i18n : clés `settings.appearance.*` (et nav section) FR + EN via `lib/i18n`.
- Fichier panel dédié ex. `ApparenceSettingsPanel.tsx` (évite grossir `ParametresView`).

## Shell v1

Fichiers cibles principaux : `Shell.tsx` (+ éventuels sous-composants `shell/` si couleurs hardcodées).

Remplacer où c’est le chrome layout :

- fonds → `bg-background` / `bg-card` / `bg-muted`
- textes → `text-foreground` / `text-muted-foreground`
- bordures → `border-border`

Ne pas refactorer toutes les vues. Les `dark:` déjà présents sur UI lib / quelques composants s’activent dès que `.dark` est sur `<html>`.

## Hors scope

- `prefers-color-scheme` / option Système
- Colonne profil Supabase / sync multi-appareil
- Audit exhaustif `bg-white`, `text-slate-*`, gradients marketing dans chaque view
- Toggle dans le header Shell (seulement Paramètres pour v1)

## Critères de succès

1. Section **Apparence** visible dans Paramètres, FR/EN.
2. Choix persiste après refresh (même onglet).
3. Pas de flash light→dark au reload si thème = dark.
4. En dark : sidebar + header + fond shell lisibles (tokens), pas page entièrement blanche autour du contenu shadcn.
5. Clair reste le rendu actuel (pas de régression visuelle majeure light).

## Self-review

- Pas de placeholder TBD sur les décisions listées.
- Scope Shell vs views explicite.
- Pas de contradiction light défaut / storage.
- Commit : manuel (user), hors agent.
