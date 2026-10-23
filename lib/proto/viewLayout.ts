import type { AppRoute } from "./routes";

/**
 * Colonne racine d'une vue shell (`overflow-hidden` + inset 1px).
 * Évite la coupure des bordures / rings des cards sur les bords du conteneur.
 * Voir `wiki/conventions-ui.md` — Layout / overflow.
 */
export const VIEW_STACK_CLIP_SAFE =
  "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-px";

/** `<main>` sans scroll page — listes DataTable scrollent dans la card. */
const SHELL_MAIN_OVERFLOW_LOCKED = new Set<AppRoute>([
  "dashboard",
  "nouvelle-campagne",
  "reglementations-sms",
  "parrainage",
  "qr-boutique",
  "parametres",
  "aide",
  "contacts",
  "groupes",
  "campagnes",
  "liens",
  "modeles-sms",
  "automatisations",
]);

export function shellMainOverflowLocked(route: AppRoute): boolean {
  return SHELL_MAIN_OVERFLOW_LOCKED.has(route);
}

/** Listes toolbar + DataTable — `pt` main = `gap-2` sous la searchbar (`listViewLayout`). */
const SHELL_MAIN_LIST_COMPACT_PADDING = new Set<AppRoute>([
  "contacts",
  "groupes",
  "campagnes",
  "liens",
  "modeles-sms",
  "automatisations",
]);

export function shellMainUsesListCompactPadding(route: AppRoute): boolean {
  return SHELL_MAIN_LIST_COMPACT_PADDING.has(route);
}
