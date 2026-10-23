/** Stack vertical listes — ref. vue Envois SMS (compact). */
export const LIST_VIEW_STACK_CLASS =
  "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden";

/** Ligne recherche + actions — hauteur alignée InputGroup (h-8). */
export const LIST_VIEW_TOOLBAR_CLASS =
  "flex h-8 min-h-8 flex-nowrap items-center gap-2";

/** Zone flex entre colonnes et CTA — hauteur fixe (bandeau select-all ou spacer). */
export const LIST_VIEW_TOOLBAR_EXPAND_SLOT_CLASS =
  "h-8 min-h-8 min-w-0 flex-1";

/** Boutons toolbar : même h-8 que la recherche (pas `lg`). */
export const LIST_VIEW_TOOLBAR_BUTTON_SIZE = "default" as const;

/** Filtres / Colonnes — radius défaut Button (`rounded-lg`), comme footer modale. */
export const LIST_VIEW_TOOLBAR_OUTLINE_BUTTON_CLASS = "shrink-0";

/** Select toolbar filtres : trigger pleine largeur, menu = largeur trigger. */
export const LIST_FILTER_SELECT_TRIGGER_CLASS =
  "w-full min-w-0 max-w-full cursor-pointer";

export const LIST_FILTER_SELECT_CONTENT_PROPS = {
  position: "popper" as const,
  align: "start" as const,
  sideOffset: 4,
  className:
    "z-[10001] max-h-60 w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]",
};

/** CTA toolbar / empty (create, import…) — même Button shadcn que footer modale, pas `rounded-full`. */
export const LIST_VIEW_CTA_BUTTON_CLASS = "shrink-0";

/** CTA toolbar — grid 1×1 : default + sélection empilés (largeur = max des deux, pas de mount/unmount). */
export const LIST_VIEW_TOOLBAR_CTA_SLOT_CLASS =
  "ml-auto inline-grid h-8 shrink-0 grid-cols-1 grid-rows-1 items-center";

export const LIST_VIEW_TOOLBAR_CTA_LAYER_CLASS =
  "col-start-1 row-start-1 flex items-center justify-end gap-2";

export const LIST_VIEW_SEARCH_INPUT_CLASS =
  "max-w-xs shrink-0 bg-transparent dark:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0";

function isSelectedIdSet(
  selectedIds: ReadonlySet<string> | readonly string[],
): selectedIds is ReadonlySet<string> {
  return (
    typeof selectedIds === "object" &&
    selectedIds !== null &&
    "size" in selectedIds &&
    typeof (selectedIds as ReadonlySet<string>).size === "number" &&
    typeof (selectedIds as ReadonlySet<string>).has === "function"
  );
}

export function listViewSelectedIdCount(
  selectedIds: ReadonlySet<string> | readonly string[],
): number {
  return isSelectedIdSet(selectedIds) ? selectedIds.size : selectedIds.length;
}

/** CTA sélection : visibilité = ids locaux (pas le compteur hook seul — évite « Supprimer (0) » au clear). */
export function listViewToolbarSelection(args: {
  selectedIds: ReadonlySet<string> | readonly string[];
  displaySelectedCount: number;
}): { selectionActionCount: number; toolbarHasSelection: boolean } {
  const size = listViewSelectedIdCount(args.selectedIds);
  if (size === 0) {
    return { selectionActionCount: 0, toolbarHasSelection: false };
  }
  return {
    selectionActionCount: Math.max(size, args.displaySelectedCount),
    toolbarHasSelection: true,
  };
}
