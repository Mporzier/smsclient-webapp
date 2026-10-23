"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import {
  LIST_VIEW_TOOLBAR_CTA_LAYER_CLASS,
  LIST_VIEW_TOOLBAR_CTA_SLOT_CLASS,
} from "@/components/smsclient/listViewLayout";

type ListViewToolbarCtaSwitchProps = {
  hasSelection: boolean;
  defaultActions: ReactNode;
  selectionActions: ReactNode;
};

/** Bascule CTA toolbar sans démontage — évite reflow / flash au select-all. */
export function ListViewToolbarCtaSwitch({
  hasSelection,
  defaultActions,
  selectionActions,
}: ListViewToolbarCtaSwitchProps) {
  return (
    <div className={cn(LIST_VIEW_TOOLBAR_CTA_SLOT_CLASS, "isolate overflow-hidden")}>
      <div
        className={cn(
          LIST_VIEW_TOOLBAR_CTA_LAYER_CLASS,
          hasSelection ? "hidden" : "relative z-10 min-w-0 bg-card",
        )}
        aria-hidden={hasSelection || undefined}
      >
        {defaultActions}
      </div>
      <div
        className={cn(
          LIST_VIEW_TOOLBAR_CTA_LAYER_CLASS,
          hasSelection ? "relative z-10 min-w-0 bg-card" : "hidden",
        )}
        aria-hidden={!hasSelection || undefined}
      >
        {hasSelection ? selectionActions : null}
      </div>
    </div>
  );
}
