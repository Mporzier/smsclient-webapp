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

Installés : `button`, `dropdown-menu`, `dialog`, `input`, `label`, `textarea`, `select`, `checkbox`.

Code neuf : `Button` / `Input` / `Dialog` / `Checkbox` directs. Helpers brand : `brandBtnCls`, `brandBtnPrimaryCls`, `brandInputCls`, `formDialogContentCls` dans [`modalChrome.ts`](../components/smsclient/modals/modalChrome.ts).

`DialogContent` accepte `overlayClassName` (z-index stacked via `modalChrome`).

## Règles

1. **Nouveau UI** : `components/ui` + tokens. Pas de nouveaux hex.
2. **Legacy** : migration opportuniste. Pas de big-bang.
3. **Brand** : vars `:root` / `.dark` dans `globals.css`.
4. **Listes / DataTable** : garder **TanStack Table**. Polish DS. **Pas** AG Grid / MUI DataGrid / shadcn Table seul. Virtualisation seulement si perf mesurée.

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
- [x] Primitives `button` / `dropdown-menu` / `dialog` / `input` / `label` / `textarea` / `select` / `checkbox`
- [x] Menu compte + HeaderHelp → `DropdownMenu`
- [x] Shell / SidebarNav / SearchBar → tokens + `Input`
- [x] Confirms → `Dialog`
- [x] DataTable L1 tokens + Pager → `Button` ; L2a tri ; L2b Checkbox
- [x] Vague 4 — petites modales Dialog + forms Input
- [x] Vague 5 — ContactCreate / GroupModal / ImportContacts → Dialog
- [x] ProtoBtn purgé → `Button` + `brandBtn*`
- [x] Hex produit → tokens (Dashboard / Aide : hex décoratifs restants volontaires)

### B. Modals → Dialog

- [x] `modalChrome` helpers Dialog
- [x] Confirms
- [x] Petites : MonProfil, ParametresSetting, CampaignDetails, EmailPending, AutomationEdit, GroupQuickCreate, CreateSmsLink, UnsubscribedContacts, QrWelcome, QrCapturePreview, QrWheelSettings
- [x] Grosses : ContactCreate, GroupModal, ImportContacts
- [x] Legacy `overlayCls` / `ModalPortal` retirés

### C. Forms → Input

- [x] `inp` → Input : MonProfil, Onboarding, QrWheelSettings, QrCapturePage, AuthForm, ContactCreate

### D / E / Listes

- [x] ProtoBtn purge
- [x] Hex vues prioritaires (wizard, listes, guides, charts, overlay)
- [x] DataTable + L2a + L2b
- [ ] L3 : virtualisation si perf mesurée

### Hors scope

- Remplacer TanStack par AG Grid / MUI
- Dark mode produit
- Hex SVG `LogoMark` + illustrations Aide / gradients Dashboard décoratifs

## Vérif

```bash
pnpm build
```

Tester : listes Contacts / Groupes / Campagnes + modales profil / contact / groupe / import.
