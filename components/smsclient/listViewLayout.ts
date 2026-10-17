/** Stack vertical listes — ref. vue Envois SMS (compact). */
export const LIST_VIEW_STACK_CLASS =
  "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden";

/** Ligne recherche + actions — hauteur alignée InputGroup (h-8). */
export const LIST_VIEW_TOOLBAR_CLASS =
  "flex min-h-8 flex-wrap items-center gap-2";

/** Boutons toolbar : même h-8 que la recherche (pas `lg`). */
export const LIST_VIEW_TOOLBAR_BUTTON_SIZE = "default" as const;

export const LIST_VIEW_SEARCH_INPUT_CLASS =
  "max-w-sm shrink-0 bg-transparent dark:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0";
