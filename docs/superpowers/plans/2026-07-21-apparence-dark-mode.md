# Apparence / dark mode v1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Section Paramètres « Apparence » avec bascule Clair/Sombre (`localStorage`), classe `dark` sur `<html>` sans FOUC, cadre app déjà tokenisé qui suit le thème.

**Architecture:** Module pur `lib/theme/theme.ts` (storage + `classList` + event) + script inline anti-FOUC dans `app/layout.tsx` + hook `hooks/useTheme.ts`. Panel Paramètres dédié ; Shell déjà en tokens (`bg-canvas`, `bg-card`, …) — audit seulement.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 4 (`@custom-variant dark`), Vitest, Lucide, i18n `lib/i18n`.

**Spec:** `docs/superpowers/specs/2026-07-21-apparence-dark-mode-design.md`

## Global Constraints

- Persistance : `localStorage` clé `smsclient.theme` uniquement (`"light"` \| `"dark"`) — pas de profil DB, pas de mode système.
- Défaut : `"light"`.
- Pas de dépendance `next-themes`.
- Agent : ne pas lancer `pnpm test*` / `pnpm build` / `pnpm lint` / `pnpm install` (skills `no-heavy-cmds`, `no-verify-build`, `testing-no-auto-run`). Proposer les commandes ; user lance.
- Agent : ne pas `git commit` / `git push` (`no-git-commit`). Proposer message + commandes.

---

## File map

| File | Role |
|------|------|
| `lib/theme/theme.ts` | Types, clé storage, parse, apply, event name |
| `hooks/useTheme.ts` | State React + listeners |
| `app/layout.tsx` | Script anti-FOUC + `suppressHydrationWarning` sur `<html>` |
| `tests/unit/lib/theme/theme.test.ts` | Tests purs parse / apply |
| `lib/i18n/messages.ts` | Clés FR/EN section + thème |
| `components/smsclient/views/parametres/parametresSettings.tsx` | `SettingSectionId` + entrée nav |
| `components/smsclient/views/parametres/ApparenceSettingsPanel.tsx` | UI Clair/Sombre |
| `components/smsclient/views/ParametresView.tsx` | Branche section `apparence` |
| `components/smsclient/Shell.tsx` + `shell/*` | Audit tokens (déjà majoritairement OK) |

---

### Task 1: Module `lib/theme/theme.ts` + tests unitaires

**Files:**
- Create: `lib/theme/theme.ts`
- Create: `tests/unit/lib/theme/theme.test.ts`

**Interfaces:**
- Produces: `ThemeMode`, `THEME_STORAGE_KEY`, `THEME_EVENT`, `parseTheme`, `getStoredTheme`, `applyTheme`, `readDomTheme`

- [ ] **Step 1: Écrire le test unitaire (échoue sans module)**

```ts
import { afterEach, describe, expect, it } from "vitest";
import {
  THEME_STORAGE_KEY,
  applyTheme,
  parseTheme,
} from "@/lib/theme/theme";

describe("theme", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
    localStorage.removeItem(THEME_STORAGE_KEY);
  });

  it("parseTheme accepte light/dark seulement", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("system")).toBe("light");
    expect(parseTheme(null)).toBe("light");
    expect(parseTheme("")).toBe("light");
  });

  it("applyTheme pose/retire .dark et écrit localStorage", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });
});
```

- [ ] **Step 2: Implémenter `lib/theme/theme.ts`**

```ts
export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "smsclient.theme";
export const THEME_EVENT = "smsclient:theme";

export function parseTheme(raw: string | null | undefined): ThemeMode {
  return raw === "dark" ? "dark" : "light";
}

export function getStoredTheme(): ThemeMode {
  try {
    return parseTheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "light";
  }
}

export function readDomTheme(): ThemeMode {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore quota / private mode */
  }
  window.dispatchEvent(
    new CustomEvent(THEME_EVENT, { detail: theme }),
  );
}
```

- [ ] **Step 3: User lance le test**

```bash
pnpm exec vitest run tests/unit/lib/theme/theme.test.ts
```

Expected: PASS

- [ ] **Step 4: Proposer commit (user lance)**

```bash
git add lib/theme/theme.ts tests/unit/lib/theme/theme.test.ts
git commit -m "$(cat <<'EOF'
feat(theme): add localStorage theme apply helpers

EOF
)"
```

---

### Task 2: Anti-FOUC script + `useTheme`

**Files:**
- Modify: `app/layout.tsx`
- Create: `hooks/useTheme.ts`

**Interfaces:**
- Consumes: `THEME_STORAGE_KEY`, `THEME_EVENT`, `ThemeMode`, `applyTheme`, `getStoredTheme`, `readDomTheme`, `parseTheme`
- Produces: `useTheme(): { theme: ThemeMode; setTheme: (t: ThemeMode) => void }`

- [ ] **Step 1: Script inline + `suppressHydrationWarning` dans `app/layout.tsx`**

Dans le `<html>`, ajouter `suppressHydrationWarning` (classe `dark` peut différer serveur/client).

Juste après l’ouverture de `<html …>`, avant `<body>`, injecter :

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `(function(){try{var t=localStorage.getItem("smsclient.theme");if(t==="dark")document.documentElement.classList.add("dark");else document.documentElement.classList.remove("dark");}catch(e){}})();`,
  }}
/>
```

Garder les `className` existants (`h-full`, fonts, etc.). Ne pas importer le module dans le script (string littérale = clé exacte `smsclient.theme`).

- [ ] **Step 2: Créer `hooks/useTheme.ts`**

```tsx
"use client";

import {
  THEME_EVENT,
  THEME_STORAGE_KEY,
  applyTheme,
  getStoredTheme,
  parseTheme,
  readDomTheme,
  type ThemeMode,
} from "@/lib/theme/theme";
import { useEffect, useState } from "react";

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>("light");

  useEffect(() => {
    setThemeState(readDomTheme() || getStoredTheme());

    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<ThemeMode>).detail;
      setThemeState(parseTheme(detail));
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY) return;
      const next = parseTheme(e.newValue);
      applyTheme(next);
      setThemeState(next);
    };

    window.addEventListener(THEME_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(THEME_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setTheme = (next: ThemeMode) => {
    applyTheme(next);
    setThemeState(next);
  };

  return { theme, setTheme };
}
```

Note: sur event `storage` (autre onglet), `applyTheme` sync aussi le DOM local (le navigateur ne change pas `classList` tout seul).

- [ ] **Step 3: Vérif manuelle FOUC (user)**

1. Devtools → Application → Local Storage → `smsclient.theme` = `dark`
2. Hard refresh
3. Attendu : pas de flash blanc ; `<html class="… dark">` dès le premier paint

- [ ] **Step 4: Proposer commit (user lance)**

```bash
git add app/layout.tsx hooks/useTheme.ts
git commit -m "$(cat <<'EOF'
feat(theme): anti-FOUC script and useTheme hook

EOF
)"
```

---

### Task 3: i18n + section Paramètres Apparence

**Files:**
- Modify: `lib/i18n/messages.ts` (objets `fr` et `en`)
- Modify: `components/smsclient/views/parametres/parametresSettings.tsx`
- Create: `components/smsclient/views/parametres/ApparenceSettingsPanel.tsx`
- Modify: `components/smsclient/views/ParametresView.tsx`

**Interfaces:**
- Consumes: `useTheme`, `ThemeMode`
- Produces: section id `"apparence"`, panel UI

- [ ] **Step 1: Clés i18n**

Dans `fr` (près des autres `parametres.section.*`) :

```ts
"parametres.section.apparence": "Apparence",
"parametres.appearance.themeTitle": "Thème",
"parametres.appearance.themeDescription": "Choisir le mode clair ou sombre.",
"parametres.appearance.light": "Clair",
"parametres.appearance.dark": "Sombre",
```

Dans `en` :

```ts
"parametres.section.apparence": "Appearance",
"parametres.appearance.themeTitle": "Theme",
"parametres.appearance.themeDescription": "Choose light or dark mode.",
"parametres.appearance.light": "Light",
"parametres.appearance.dark": "Dark",
```

`MessageKey` dérive de `fr` — les deux objets doivent avoir les mêmes clés.

- [ ] **Step 2: Étendre `SettingSectionId` + `settingSections`**

Dans `parametresSettings.tsx` :

```ts
export type SettingSectionId =
  | "compte"
  | "apparence"
  | "entreprise"
  | "facturation"
  | "sms-alertes"
  | "donnees";

export const settingSections: SettingSectionDef[] = [
  { id: "compte" },
  { id: "apparence" },
  { id: "entreprise" },
  { id: "facturation" },
  { id: "sms-alertes" },
  { id: "donnees" },
];
```

Pas de nouvelle `SettingId` / carte grille — panel plein comme Compte.

- [ ] **Step 3: Créer `ApparenceSettingsPanel.tsx`**

```tsx
"use client";

import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ApparenceSettingsPanel() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-bold text-foreground">
        {t("parametres.appearance.themeTitle")}
      </h2>
      <p className="mt-1 text-xs font-medium text-muted-foreground">
        {t("parametres.appearance.themeDescription")}
      </p>
      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label={t("parametres.appearance.themeTitle")}
      >
        <Button
          type="button"
          size="sm"
          variant={theme === "light" ? "default" : "outline"}
          aria-pressed={theme === "light"}
          onClick={() => setTheme("light")}
          className={cn("gap-1.5")}
        >
          <Sun className="size-4" aria-hidden />
          {t("parametres.appearance.light")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={theme === "dark" ? "default" : "outline"}
          aria-pressed={theme === "dark"}
          onClick={() => setTheme("dark")}
          className={cn("gap-1.5")}
        >
          <Moon className="size-4" aria-hidden />
          {t("parametres.appearance.dark")}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Brancher dans `ParametresView.tsx`**

1. Import `ApparenceSettingsPanel`.
2. Dans le filtre `availableSections`, traiter `apparence` comme `compte` (toujours visible) :

```ts
const availableSections = settingSections.filter((section) => {
  if (section.id === "compte" || section.id === "apparence") return true;
  return visibleCards.some((c) => c.section === section.id);
});
```

3. Dans le `tabpanel`, avant/après compte :

```tsx
{sectionId === "compte" ? (
  <CompteSettingsPanel … />
) : sectionId === "apparence" ? (
  <ApparenceSettingsPanel />
) : (
  <div className="grid …">…</div>
)}
```

Retirer / adapter `isCompteSection` si besoin pour rester lisible.

- [ ] **Step 5: Vérif manuelle UI (user)**

1. Ouvrir Paramètres → onglet Apparence
2. Cliquer Sombre → UI shell/shadcn bascule ; `localStorage.smsclient.theme === "dark"`
3. Refresh → reste sombre
4. Passer langue EN (Compte) → labels Appearance / Theme / Light / Dark

- [ ] **Step 6: Proposer commit (user lance)**

```bash
git add lib/i18n/messages.ts \
  components/smsclient/views/parametres/parametresSettings.tsx \
  components/smsclient/views/parametres/ApparenceSettingsPanel.tsx \
  components/smsclient/views/ParametresView.tsx
git commit -m "$(cat <<'EOF'
feat(parametres): add Apparence section for light/dark theme

EOF
)"
```

---

### Task 4: Audit Shell tokens (scope v1)

**Files:**
- Review: `components/smsclient/Shell.tsx`, `components/smsclient/shell/SidebarNav.tsx`, `components/smsclient/shell/SearchBar.tsx`, `components/smsclient/shell/LogoMark.tsx`
- Modify: seulement si hardcode light restant sur le chrome (fond / texte / bordure)

**Contexte:** Shell utilise déjà `APP_CANVAS_CLASS` (`bg-canvas`), `MAIN_PANEL_CLASS` (`bg-card border-border`), `text-foreground`, `bg-muted`, etc. Tokens `.dark` dans `globals.css` couvrent `--canvas`, `--card`, `--foreground`, `--sidebar*`.

- [ ] **Step 1: Grep ciblé hardcodes**

Chercher dans `components/smsclient/Shell.tsx` et `components/smsclient/shell/` :

- `bg-white`, `bg-slate-`, `text-slate-`, `border-slate-`, `#fff`, `bg-zinc-`

Si aucun match chrome → **aucune édition** ; noter dans le résumé de tâche.

- [ ] **Step 2: Fixes minimaux seulement si trouvés**

Remplacer par tokens (`bg-background` / `bg-card` / `bg-canvas` / `text-foreground` / `border-border`). Ne pas toucher `LogoMark` couleurs marque (logo fixe OK). Ne pas refactorer les vues.

- [ ] **Step 3: Smoke manuelle dark (user)**

En thème dark :

- Canvas autour du panel principal sombre (`--canvas`)
- Sidebar / header lisibles
- Composants shadcn (boutons Paramètres, dropdown profil) cohérents

- [ ] **Step 4: Proposer commit seulement s’il y a un diff**

```bash
git add components/smsclient/Shell.tsx components/smsclient/shell/
git commit -m "$(cat <<'EOF'
fix(shell): swap remaining chrome hardcodes for theme tokens

EOF
)"
```

---

## Self-review (plan vs spec)

| Spec | Task |
|------|------|
| `localStorage` `smsclient.theme` light/dark | Task 1 |
| Script anti-FOUC layout | Task 2 |
| Hook + event / storage multi-onglets | Task 2 |
| Section Apparence + i18n | Task 3 |
| Shell tokens v1 | Task 4 (audit ; déjà largement fait) |
| Hors scope système / DB / views | Respecté — aucun task |

Pas de placeholder TBD. Types `ThemeMode` / clés storage alignés entre tasks.

---

## Vérif manuelle finale (user)

```bash
pnpm exec vitest run tests/unit/lib/theme/theme.test.ts
pnpm lint
pnpm build
```

Puis parcours UI Clair ↔ Sombre + refresh + EN.
