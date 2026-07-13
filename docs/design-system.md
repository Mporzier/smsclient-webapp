# Design system — smsclient

## Stack

- **UI kit** : [shadcn/ui](https://ui.shadcn.com) (preset **Nova** / `radix-nova`)
- **Primitives** : Radix via package `radix-ui`
- **Styles** : Tailwind CSS v4 + CSS variables in [`app/globals.css`](../app/globals.css)
- **Utils** : `cn()` dans [`lib/utils.ts`](../lib/utils.ts) (`clsx` + `tailwind-merge`)
  - [`lib/cn.ts`](../lib/cn.ts) re-exporte `cn` pour les imports legacy

## Composants

Nouveaux composants UI → [`components/ui/`](../components/ui/) via CLI :

```bash
pnpm dlx shadcn@latest add <component> -y -c .
```

Installés : `button`, `dropdown-menu`, `dialog`, `input`.

`ProtoBtn` = wrapper compat → `Button`. Code neuf : `Button` direct.

`DialogContent` accepte `overlayClassName` (z-index stacked via [`modalChrome.ts`](../components/smsclient/modals/modalChrome.ts)).

## Règles

1. **Nouveau UI** : `components/ui` + tokens. Pas de nouveaux hex.
2. **Legacy** : migration opportuniste. Pas de big-bang.
3. **Brand** : vars `:root` / `.dark` dans `globals.css`.
4. **Listes / DataTable** : garder **TanStack Table** (déjà en place). Polish DS (tokens + `Pager` → `Button`). **Pas** AG Grid / MUI DataGrid / shadcn Table seul. Virtualisation (`@tanstack/react-virtual`) seulement si perf mesurée.

## Brand (tokens)

| Token | Rôle | Hex legacy |
|-------|------|------------|
| `--primary` | bleu identité | `#1831c9` |
| `--ring` | bleu action | `#2f6fed` |
| `--accent` | fond bleu clair | `#e9f5ff` |
| `--destructive` | danger | `#e13b54` |
| `--foreground` | texte navy | `#14284f` |
| `--background` | fond soft | `#f8fafc` |
| `--canvas` | fond panels | `#e5eaf2` |

## Checklist migration

### Fait

- [x] Tokens brand + `--canvas`
- [x] Primitives `button` / `dropdown-menu` / `dialog` / `input`
- [x] Menu compte + HeaderHelp → `DropdownMenu`
- [x] CTA header / `ProtoBtn` wrapper → `Button`
- [x] Vague 2 — Shell / SidebarNav tokens
- [x] **Vague 3** — Confirms → `Dialog` + SearchBar → `Input`
- [x] **Vague L1** — DataTable tokens + Pager → `Button` (TanStack conservé)

### A. Shell chrome

- [x] SearchBar → `Input`

### B. Modals → Dialog

- [x] `modalChrome` tokens + helpers Dialog (`dialogOverlay*`, `confirmDialogContentCls`)
- [x] Confirms : `ConfirmDeleteModal`, `ConfirmUnsubscribeModal`, `CampaignWizardLeaveConfirmModal`
- [ ] Petites : `MonProfilModal`, `ParametresSettingModal`, `CampaignDetailsModal`, `EmailPendingModal`
- [ ] Moyennes / grosses (plus tard)

### C. Forms → Input

- [ ] Classes `inp` MonProfil / Contact / Parametres
- [ ] `AuthForm`, `parametresSettings`
- [ ] CLI si besoin : `label`, `textarea`, `select` (user lance)

### D / E / Listes

- [ ] ProtoBtn → Button direct (opportuniste)
- [ ] Hex vues (opportuniste)
- [x] DataTable tokens + Pager Button — **pas** Table shadcn / AG Grid
- [ ] L2 : tri colonnes UI + Checkbox shadcn
- [ ] L3 : virtualisation si besoin

### Hors scope

- Remplacer TanStack par AG Grid / MUI
- Dark mode produit
- Big-bang 16 modales

## Vagues suivantes

4. Petites modales + `Input`  
5. Moyennes / grosses  
L2. Tri colonnes + checkbox  
L3. Virtual si perf  

Vérif manuelle :

```bash
pnpm build
```

Tester : listes Contacts / Groupes / Campagnes (chrome + pagination).
